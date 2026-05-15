# 🌐 Community Knowledge Base (Shared Learning)

## 🧠 Collective Intelligence
This file acts as a "cross-project" memory. While the `brain.md` focuses on this specific project's execution, this file stores universal patterns, user preferences, and "best-in-class" solutions discovered across the Lorapok Labs ecosystem.

### 🎨 Global Design Patterns
- **The "Organic" Feel**: Prefer `rounded-3xl` over `rounded-lg`. Use `backdrop-blur-md` for all floating headers.
- **Accent Strategy**: Use Indigo-600 for primary actions and Zinc-400 for secondary, high-contrast labels.
- **Interaction**: Implement a `0.2s` cubic-bezier transition on all hover states for a "snappy yet smooth" feeling.

### 🔐 Security Universal Truths
- **Key Derivation**: PBKDF2 is non-negotiable for user-provided passwords.
- **Symmetric Encryption**: AES-GCM is the only acceptable choice for content encryption to ensure integrity and confidentiality.
- **IV Management**: Never reuse an IV for the same key.

### 🛠️ Common Pitfalls & Solutions
- **Symptom**: CORS errors during Firebase deployment on GitHub Pages.
- **Solution**: Ensure the domain is whitelisted in the Firebase Console $\rightarrow$ Authentication $\rightarrow$ Settings $\rightarrow$ Authorized Domains.
- **Symptom**: Slow load times for large encrypted notes.
- **Solution**: Implement a local `IndexedDB` cache to store ciphertext locally, bypassing the network for repeated reads.

---
*This knowledge base is updated autonomously by Lorapok-Omni as it discovers superior patterns.*
