## 2025-05-14 - [Crypto PBKDF2 Memoization & Branch Unification]
**Learning:** Sequential PBKDF2 runs (100k iterations each) on auto-save were causing significant UI jank. By memoizing the derived key based on password and salt, and stabilizing the salt per session, we reduce PBKDF2 overhead by ~66% on the first save and ~100% on subsequent auto-saves.
**Learning (Process):** When feature branches diverge significantly from main, a hard reset to main followed by manual restoration of verified code blocks is often cleaner and safer than fighting complex merge conflicts.
**Action:** Always check for expensive synchronous-like operations in loops or effects (like crypto) that can be cached when inputs are stable.
