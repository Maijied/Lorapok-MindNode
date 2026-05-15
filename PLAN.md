# 🗺️ Implementation Plan

## Phase 1: Foundation & Documentation
- [x] Define Project Scope and Requirements.
- [x] Create professional documentation (`README.md`, `ARCHITECTURE.md`, `PLAN.md`, `TASKS.md`).
- [x] Scaffold Vite + React + Tailwind CSS project.
- [x] Configure GitHub Actions for automatic deployment.

## Phase 2: Cryptographic Layer
- [x] Implement `crypto-service.js` using Web Crypto API.
- [x] Develop PBKDF2 key derivation logic.
- [x] Implement AES-GCM encryption and decryption functions.
- [x] Create helper utilities for Base64/ArrayBuffer conversion.

## Phase 3: Backend Integration
- [x] Set up Firebase project and Firestore.
- [x] Implement `firebase-service.js` for encrypted data persistence.
- [x] Build the "Blind Storage" logic (saving ciphertext and salts).

## Phase 4: UI/UX Development (The "Senior" Touch)
- [x] Design a minimalist "Key Entry" landing page.
- [x] Build the "Note Editor" with a professional, focused interface.
- [x] Implement "Auto-save" with encrypted payloads.
- [x] Develop the "Share Link" generator and Key-access system.
- [x] Add Dark Mode and Responsive Design.

## Phase 5: Testing & Polishing
- [ ] Verify E2EE flow: Encrypt $\rightarrow$ Save $\rightarrow$ Fetch $\rightarrow$ Decrypt.
- [ ] Test cross-browser compatibility for Web Crypto API.
- [ ] Refine animations and transitions to match Lorapok Labs vibe.
- [ ] Perform security audit on client-side key handling.

## Phase 6: Launch
- [x] Push final code to GitHub.
- [x] Configure GitHub Secrets.
- [x] Deploy via GitHub Pages.

## Phase 7: Power Features (Advanced Expansion)
- [x] **Markdown Engine**: Implement a professional Markdown renderer (React-Markdown) with a split-pane preview.
- [x] **The Vault**: Create a local-storage managed directory of Note IDs so users don't have to remember IDs.
- [ ] **E2EE File Attachments**: Encrypt binary files and upload them to Firebase Storage.
- [ ] **Self-Destruct Mode**: Implement a "Burn after reading" feature with a TTL (Time-to-Live) on Firestore documents.
- [ ] **Advanced Tagging**: Encrypted tags for organizing notes within the vault.
- [ ] **Collaboration**: Implement encrypted real-time synchronization for shared notes.

## Phase 8: Hardening & Optimization
- [ ] Implement Zest-inspired UI refinements (Micro-interactions, Framer Motion).
- [ ] Add comprehensive error handling for cryptographic failures.
- [ ] Implement a PWA (Progressive Web App) for offline access.
