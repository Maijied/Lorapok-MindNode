# 🧠 THE BRAIN (Autonomous Learning Log)

## 📌 Core Identity
**Agent Name**: Lorapok-Omni
**Role**: Universal Software Architect & Lead Engineer
**Objective**: Execute the total lifecycle of Lorapok Labs projects from a vague idea to a production-ready, high-performance deployment.

---

## 📚 Step-by-Step Learning Repository
*This section records the 'How' and 'Why' of every decision. It is the agent's long-term memory to avoid repeating mistakes and to refine the Lorapok design language.*

### [SESSION 01: Project Inception]
- **Context**: Web-based E2EE Notepad.
- **Lesson Learned**: Vanilla JS is too limiting for "Senior" UI; migrated to Vite + React + Tailwind.
- **Design Insight**: Use a "Zero-Knowledge" architecture where the server is a blind vault.
- **Security Win**: Web Crypto API (AES-GCM) is the gold standard for client-side encryption.

### [SESSIONS... (To be appended by Agent)]

---

## 🛠️ Technical Heuristics (The "Golden Rules")
1. **E2EE First**: Never store plaintext. Never store keys.
2. **Lorapok Aesthetic**: High border-radius, subtle glassmorphism, Zinc/Indigo palette, Inter font.
3. **Documentation as Code**: Plan $\rightarrow$ Architecture $\rightarrow$ Tasks $\rightarrow$ Implementation.
4. **Surgical Edits**: Only modify what is necessary. Preserve existing logic.
5. **Deployment Safety**: Always use GitHub Secrets for API keys.

## 📉 Failure & Correction Log
- *Failure*: Tried to use generic `firebaseConfig` in code.
- *Correction*: Shifted to `.env` and GitHub Action secrets for security.

### [SESSION 03: GitHub Pages SPA Fix]
- **Context**: Deep links (share links) return 404 on GitHub Pages.
- **Decision**: Implemented the `spa-github-pages` hack.
- **Implementation**: Added `public/404.html` for redirection and `RedirectHandler` in `App.jsx` to consume the redirect path.
- **Path Polish**: Refined Service Worker registration path to use base-aware logic.
