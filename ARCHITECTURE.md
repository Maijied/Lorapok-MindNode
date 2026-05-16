# Architecture Design

## 1. Overview

Lorapok MindNode implements a **zero-knowledge** architecture. Firebase acts as blind storage: it never receives keys or plaintext. Encryption and decryption happen entirely in the browser via the Web Crypto API.

## 2. High-Level System

```mermaid
flowchart TB
    subgraph Client["Browser (React SPA)"]
        UI["Components<br/>Home · Editor · MarkdownPreview"]
        Hook["useVault<br/>(localStorage)"]
        Crypto["CryptoService<br/>PBKDF2 + AES-GCM"]
        Mnemonic["MnemonicService<br/>12-word recovery"]
        DB["DB (firebase-service)"]
        Cache["CacheService<br/>IndexedDB"]
    end

    subgraph Cloud["Firebase (blind storage)"]
        FS["Firestore<br/>notes/{noteId}"]
        Storage["Firebase Storage<br/>encrypted attachments"]
    end

    subgraph Deploy["CI/CD"]
        GH["GitHub Actions"]
        Pages["GitHub Pages"]
    end

    UI --> Hook
    UI --> Crypto
    UI --> Mnemonic
    UI --> DB
    DB --> Cache
    DB --> FS
    DB --> Storage
    Crypto -.->|"keys never leave browser"| UI
    GH --> Pages
    Pages --> Client
```

## 3. Frontend Module Map

```mermaid
flowchart LR
    subgraph Entry
        main["main.jsx"]
        App["App.jsx<br/>React Router"]
    end

    subgraph Routes
        Home["Home.jsx<br/>/"]
        Editor["Editor.jsx<br/>/note/:noteId"]
        Preview["MarkdownPreview.jsx"]
    end

    subgraph Services
        crypto["crypto-service.js"]
        firebase["firebase-service.js"]
        cache["cache-service.js"]
        mnemonic["mnemonic-service.js"]
    end

    subgraph State
        vault["useVault.js<br/>localStorage vault"]
    end

    main --> App
    App --> Home
    App --> Editor
    Editor --> Preview
    Home --> firebase
    Home --> mnemonic
    Home --> vault
    Editor --> crypto
    Editor --> firebase
    Editor --> mnemonic
    Editor --> vault
    firebase --> cache
```

## 4. Security Model (End-to-End Encryption)

### 4.1 Cryptographic Pipeline

Uses the **Web Crypto API** (no third-party crypto libraries).

**Encryption flow:**

1. **Key derivation**: User supplies a secret key. `PBKDF2` with a random `salt` and 100,000 SHA-256 iterations derives a 256-bit symmetric key.
2. **Cipher**: Note content is encrypted with **AES-GCM**.
3. **Payload** stored in Firestore / IndexedDB:
   - `ciphertext` — encrypted content (Base64)
   - `iv` — initialization vector (unique per save)
   - `salt` — key-derivation salt

**Decryption flow:**

1. Fetch `ciphertext`, `iv`, and `salt` by `noteId`.
2. Derive the symmetric key from the secret key and `salt`.
3. Decrypt with AES-GCM; wrong keys fail the authentication tag check.

### 4.2 Access Control (Recovery phrase + 6-digit PIN)

Access is **note ID + credentials**, not user accounts.

| Phase | Credential | Purpose |
|-------|------------|---------|
| First-time setup | 12-word recovery phrase | Required to create a note; backs up access |
| PIN setup | 6-digit PIN (any digits) | Encrypts note content for daily use |
| Daily unlock | 6-digit PIN | Fast unlock and auto-save |
| Recovery | 12-word recovery phrase | Restores PIN via `recoverySeal` if PIN is forgotten |

The note body is encrypted with the **PIN**. The recovery phrase encrypts a sealed copy of the PIN (`recoverySeal`) so recovery never stores the PIN in plaintext on the server.

- Routes: `/` (home), `/note/:noteId` (editor)
- `pinEnabled` and `recoverySeal` are stored as metadata alongside ciphertext (not secret)

## 5. Encrypt / Decrypt Data Flow

```mermaid
sequenceDiagram
    actor User
    participant Editor
    participant Mnemonic as MnemonicService
    participant Crypto as CryptoService
    participant DB
    participant Cache as CacheService (IndexedDB)
    participant Firestore

    User->>Editor: Enter 6-digit PIN or recovery phrase
    Editor->>Mnemonic: phraseToKey() (recovery) or PIN as key
    Editor->>DB: fetchNote(noteId)
    DB->>Cache: getNote (local-first)
    alt cache miss
        DB->>Firestore: getDoc(notes/{id})
        Firestore-->>DB: ciphertext, iv, salt, metadata
        DB->>Cache: setNote
    end
    DB-->>Editor: encrypted payload
    Editor->>Crypto: decrypt(ciphertext, key, iv, salt)
    Crypto-->>Editor: plaintext title, body, tags
    Note over Editor: Auto-save after 1s debounce
    Editor->>Crypto: encrypt(content, key)
    Editor->>DB: saveNote(noteId, encrypted payload)
    DB->>Cache: setNote (always)
    DB->>Firestore: setDoc (if Firebase configured)
```

## 6. Persistence (Local-First)

```mermaid
flowchart TD
    Save["saveNote()"] --> IDB["IndexedDB<br/>mindnode-cache"]
    Save --> FS{"Firebase<br/>configured?"}
    FS -->|yes| Fire["Firestore notes/"]
    FS -->|no| LocalOnly["Local-only mode"]

    Load["fetchNote()"] --> IDB2["IndexedDB first"]
    IDB2 -->|hit| Return["Return cached blob"]
    IDB2 -->|miss| FS2{"Firebase enabled?"}
    FS2 -->|yes| Fetch["Firestore fetch → cache"]
    FS2 -->|no| Err["Error: not found locally"]

    Vault["useVault"] --> LS["localStorage<br/>mindnode_vault<br/>(note IDs + titles only)"]
```

## 7. Data Model (Firestore)

**Collection: `notes`**

| Field | Description |
|-------|-------------|
| `id` | Document ID (note identifier) |
| `ciphertext`, `iv`, `salt` | Encrypted body |
| `encryptedTitle` | Encrypted title blob |
| `encryptedTags` | Encrypted tags blob |
| `attachments` | Encrypted file metadata + Storage URLs |
| `pinEnabled` | `true` after 6-digit PIN setup |
| `recoverySeal` | PIN encrypted with recovery phrase (for PIN recovery) |
| `ttl` | Optional self-destruct hours |
| `updatedAt` | ISO timestamp |

## 8. Repository Layout

| Path | Role |
|------|------|
| `src/main.jsx` | React bootstrap |
| `src/App.jsx` | Routes: `/`, `/note/:noteId` |
| `src/components/` | Home, Editor, MarkdownPreview, HowToUseModal |
| `src/services/` | Crypto, Firebase, IndexedDB cache, mnemonics |
| `src/hooks/useVault.js` | Recent-note bookmarks (IDs/titles only) |
| `public/sw.js` | Service worker for offline assets |
| `.github/workflows/deploy.yml` | Build and deploy to GitHub Pages |

## 9. Deployment Pipeline

- **CI/CD**: GitHub Actions on push to `main`.
- **Secrets**: GitHub Secrets → Vite env vars (`VITE_FIREBASE_*`) → production bundle.
- **Hosting**: GitHub Pages.

## 10. Firebase Rules

| File | Purpose |
|------|---------|
| `firestore.rules` | `notes/{noteId}` read/write with ciphertext validation |
| `storage.rules` | `notes/{noteId}/{fileName}` for encrypted attachments |
| `firebase.json` | Wires rules for `firebase deploy` |
| `firebase-rules.txt` | Deploy instructions (pointer) |

```bash
firebase deploy --only firestore:rules,storage
```

Rules allow unauthenticated access to `notes/*` (key-based app) but reject malformed documents and all other paths. Encryption remains the real access control.
