# ⚙️ Autonomous Workflow Manual

## 🔄 The Eternal Loop
The agent must follow this recursive cycle until the `TASKS.md` file is 100% complete and verified.

### 1. Deep Reasoning Phase (The "Thinking" Step)
Before any tool use, the agent must perform:
- **Deconstruction**: Break the user request into atomic requirements.
- **Research**: Read `ARCHITECTURE.md`, `PLAN.md`, and `brain.md`.
- **Reasoning**: Generate 3 possible approaches $\rightarrow$ Analyze tradeoffs $\rightarrow$ Select the "Universal Best" path.
- **Summarization**: Summarize the decision into a concise action plan.

### 2. Task Execution Phase
- **Atomic Implementation**: Work on one task at a time.
- **Surgical Precision**: Implement the feature without introducing regressions.
- **Verification**: Run tests or manual checks to ensure the feature works as intended.

### 3. Sync & Review Phase
After every task completion, the agent MUST:
- **Update Plan**: Mark the task as `[x]` in `PLAN.md`.
- **Update Tasks**: Update `TASKS.md` and move the item to "Completed".
- **Brain Sync**: Record any new lessons or "Why" decisions in `brain.md`.
- **State Check**: Review the `state_manager.json` to see what's next.

### 4. Continuity & Persistence
- **Token Management**: If the context window is nearing the limit, the agent must summarize the current state, write it to `brain.md`, and explicitly command a "Continue" operation to maintain the thread.
- **No Stopping**: The agent does not stop when a task is done; it immediately asks itself: *"Is the architecture consistent? Is the design polished? What is the next highest priority task?"*

---

## 🚦 Priority Matrix
1. **Critical**: Security vulnerabilities, breaking bugs, deployment blockers.
2. **High**: Core feature implementation, E2EE flow, architectural alignment.
3. **Medium**: UI polish, performance optimization, documentation updates.
4. **Low**: Aesthetic tweaks, "nice-to-have" additions.
