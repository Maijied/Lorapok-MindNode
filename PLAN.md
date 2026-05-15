# 🗺️ Implementation Plan

## Phase 1: Foundation & Documentation
- [x] Define Project Scope and Requirements.
- [x] Create professional documentation (`README.md`, `ARCHITECTURE.md`, `PLAN.md`, `TASKS.md`).
- [x] Scaffold Vite + React + Tailwind CSS project.
- [x] Configure GitHub Actions for automatic deployment.
- [x] Generate Lorapok Brand Assets (Logo/Design Language).

## Phase 2: Cryptographic Layer
- [x] Implement `crypto-service.js` using Web Crypto API.
- [x] Develop PBKDF2 key derivation logic.
- [x] Implement AES-GCM encryption and decryption functions.
- [x] Create helper utilities for Base64/ArrayBuffer conversion.
- [x] Implement binary blob encryption for file attachments.

## Phase 3: Backend Integration
- [x] Set up Firebase project and Firestore.
- [x] Implement `firebase-service.js` for encrypted data persistence.
- [x] Build the "Blind Storage" logic (saving ciphertext and salts).
- [x] Integrate Firebase Storage for encrypted file uploads.
- [x] Implement IndexedDB local caching for instant access.

## Phase 4: UI/UX Development (The "Senior" Touch)
- [x] Design a minimalist "Key Entry" landing page.
- [x] Build the "Note Editor" with a professional, focused interface.
- [x] Implement "Auto-save" with encrypted payloads.
- [x] Develop the "Share Link" generator and Key-access system.
- [x] Add Dark Mode and Responsive Design.
- [x] Implement a high-end la Lorapok Labs vibe.

## Phase 5: Testing & Polishing
- [x] Verify E2EE flow: Encrypt $\rightarrow$ Save $\rightarrow$ Fetch $\rightarrow$ Decrypt.
- [x] Test cross-browser compatibility for Web Crypto API.
- [x] Refine animations and transitions using Framer Motion.
- [ ] Perform security audit on client-side key handling.

## Phase 6: Launch
- [x] Push final code to GitHub.
- [x] Configure GitHub Secrets.
- [x] Deploy via GitHub Pages.

## Phase 7: Power Features (Advanced Expansion)
- [x] **Markdown Engine**: Implement a professional Markdown renderer (React-Markdown) with a split-pane preview.
- [x] **The Vault**: Create a local-storage managed directory of Note IDs so users don't have to remember IDs.
- [x] **E2EE File Attachments**: Architecture implemented.
- [ ] **Attachment Manager UI**: Implement the file upload and viewing gallery in the editor.
- [x] **Self-Destruct Mode**: Implementation of TTL (Time-to-Live) in Note schema.
- [x] **Advanced Tagging**: Encrypted tags for organizing notes within the vault.
- [ ] **Recovery Phrase (Mnemonic)**: Implement a seed-phrase system to recover keys.
- [ ] **Collaboration**: Implement encrypted real-time synchronization for shared notes.

## Phase 8: Hardening & Optimization
- [x] Implement Zest-inspired UI refinements (Micro-interactions, Framer Motion).
- [ ] Add comprehensive error handling for cryptographic failures.
- [ ] **PWA Installation**: Implement manifest and service worker for offline usage.
