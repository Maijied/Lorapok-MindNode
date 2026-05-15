# 🏗️ Architecture Design

## 1. Overview
Lorapok MindNode implements a "Zero-Knowledge" architecture. The central premise is that the server (Firebase) acts as a blind storage vault, never possessing the keys required to read the data it hosts.

## 2. Security Model (End-to-End Encryption)

### 2.1 Cryptographic Pipeline
We use the **Web Crypto API** to ensure industry-standard security without relying on external libraries.

**Encryption Flow:**
1. **Key Derivation**: The user provides a `Secret Key`. We use `PBKDF2` with a random `salt` and 100,000 iterations of SHA-256 to derive a 256-bit symmetric key.
2. **Cipher**: The note content is encrypted using **AES-GCM (Galois/Counter Mode)**.
3. **Payload**: The following are stored in Firestore:
   - `ciphertext`: The encrypted note content.
   - `iv`: The initialization vector (unique per save).
   - `salt`: The salt used for key derivation.

**Decryption Flow:**
1. Fetch the `ciphertext`, `iv`, and `salt` from Firestore using the `noteId`.
2. Derive the symmetric key using the `Secret Key` and the stored `salt`.
3. Decrypt the `ciphertext` using the derived key and `iv`.

### 2.2 Access Control
Instead of User IDs, we use **Note IDs**. 
- `URL -> /note/:noteId`
- Access is granted if the user can successfully decrypt the note using their key. If the key is wrong, the decryption will fail (AES-GCM authentication tag check), and the user will be denied access.

## 3. Data Model (Firestore)

**Collection: `notes`**
- `id`: (Document ID) Unique Note Identifier.
- `encryptedData`: {
    - `content`: String (Base64 encrypted blob).
    - `iv`: String (Base64).
    - `salt`: String (Base64).
}
- `metadata`: {
    - `title`: String (Encrypted).
    - `updatedAt`: Timestamp.
    - `tags`: Array (Encrypted).
}

## 4. Frontend Architecture
- **State Management**: React Context for managing the current active note and decryption key.
- **Routing**: React Router for handling `/` (Home) and `/note/:id` (Editor).
- **Styling**: Tailwind CSS with a custom configuration to match Lorapok Labs' aesthetic (Zinc palette, Indigo accents, high border-radius).
- **Performance**: Vite for optimized bundling and Hot Module Replacement (HMR).

## 5. Deployment Pipeline
- **CI/CD**: GitHub Actions.
- **Secret Injection**: GitHub Secrets $\rightarrow$ GitHub Actions $\rightarrow$ Vite Environment Variables $\rightarrow$ Production Bundle.
