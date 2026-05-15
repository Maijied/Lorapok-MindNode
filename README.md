# 📝 Lorapok MindNode
**A High-Security, Key-Based Digital Notepad with End-to-End Encryption.**

Lorapok MindNode is a professional-grade digital notepad designed for users who prioritize privacy, security, and seamless accessibility. By eliminating traditional user accounts and implementing a robust End-to-End Encryption (E2EE) system, MindNode ensures that your thoughts remain yours—and yours alone.

## ✨ Key Features
- **🔒 Zero-Knowledge Security**: No accounts. No passwords stored on servers. Your notes are encrypted client-side using the Web Crypto API (AES-GCM).
- **🔑 Key-Based Access**: Access and update notes using a unique Note ID and a Secret Key.
- **🛡️ Recovery Phrases**: BIP-39 style 12-word mnemonic phrases for secure key backup.
- **⚡ Blazing Fast UI**: Built with Vite, React, and Tailwind CSS, following the minimalist and organic design patterns of Lorapok Labs.
- **📱 PWA Ready**: Install as a native app for faster access and offline capabilities.
- **✍️ Advanced Editor**: A powerful, distraction-free editing experience with auto-save and rich content support.
- **🔗 Secure Sharing**: Generate shareable links that require a Secret Key to decrypt and view.
- **🌙 Aesthetic Experience**: Full dark mode support and a polished, senior-level frontend design.

## 🛠️ Tech Stack
- **Frontend**: React 18+, Vite, Tailwind CSS.
- **Backend**: Firebase Firestore (NoSQL).
- **Cryptography**: Web Crypto API (PBKDF2 for key derivation, AES-GCM for encryption).
- **Deployment**: GitHub Pages via GitHub Actions.

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/Maijied/Lorapok-MindNode.git
cd Lorapok-MindNode
npm install
npm run dev
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deployment
Push your changes to the `main` branch. The GitHub Actions pipeline will automatically build and deploy the project to GitHub Pages.

---
*Designed for privacy. Built for speed.*
