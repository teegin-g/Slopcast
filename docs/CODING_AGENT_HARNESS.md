# Coding Agent Harness

The repo uses a layered agent harness for structured feature work:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project conventions + mechanical overrides |
| `.cursorrules` | Cursor adapter → enters the role system |
| `AGENTS.md` | UI verification expectations (Storybook, screenshots, themes) |
| `.agents/` | Role system, workflow, validation gate, and logging |

Two modes of work: direct edits for small tasks, or structured multi-agent delivery (supervisor → implementer → validator) using git worktrees for isolation.

For full details, see `.agents/system.md` (roles and workflow), `.agents/roles/` (individual role docs), and `.agents/validation/gate.sh` (the validation gate).
