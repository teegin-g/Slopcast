# Slopcast Multi-Agent Development System

## Overview

This system separates **implementation** from **validation** to prevent coding agents from breaking the app during agentic development. It uses git worktrees for isolation and a structured supervisor-coordinated pipeline.

## Architecture

```
User Request
    │
    ▼
┌──────────┐     ┌──────────────┐     ┌───────────┐
│Supervisor │────▶│ Implementer  │────▶│ Validator  │
│ (plan +   │     │ (worktree)   │     │ (gate.sh)  │
│  coord)   │◀────│              │◀────│            │
└──────────┘     └──────────────┘     └───────────┘
    │
    ▼
  Merge to main
```

## Roles

| Role | File | Responsibility |
|------|------|---------------|
| **Supervisor** | `roles/supervisor.md` | Decompose requests, create worktrees, coordinate agents, merge results |
| **Implementer** | `roles/implementer.md` | Build features in isolated worktrees, follow project conventions |
| **Validator** | `roles/validator.md` | Run validation gate, generate pass/fail reports |

## Workflows

| Workflow | File | Description |
|----------|------|-------------|
| **Feature Pipeline** | `workflows/feature-pipeline.md` | Full request → plan → implement → validate → merge cycle |
| **Worktree Lifecycle** | `workflows/worktree-lifecycle.md` | Create / work / validate / merge / cleanup operations |

## Validation Gate

The validation gate (`validation/gate.sh`) is a fail-fast pipeline:

1. **Type safety** — `npm run typecheck`
2. **Production build** — `npm run build`
3. **Unit tests** — `npm test`
4. **Style drift** — `npm run ui:audit`
5. **Screenshot diff** — Capture + compare against baseline (>1% pixel diff = failure)
6. **UI flow validation** — `npm run ui:verify`

## Usage Modes

### Automated (Supervisor-Orchestrated)
The supervisor handles everything end-to-end. User reviews final result.

### Manual (Step-Through)
1. `/supervisor` — plans and creates worktrees, then pauses
2. `/implement` — implements one task in a specific worktree
3. `/validate` — runs validation gate against a worktree
4. User tells supervisor to merge (or does it manually)

## Tool Adapters

| Tool | Adapter | Invocation |
|------|---------|------------|
| **Claude Code** | `adapters/claude-code/` | `/supervisor`, `/implement`, `/validate` skills |
| **Cursor** | `adapters/cursor/` | Load `.cursorrules`, invoke roles via Composer |
| **Codex** | `adapters/codex/` | `codex --agent supervisor` (or `implementer`/`validator`) |

## Key Directories

- `.agents/state/` — Ephemeral session state (gitignored)
- `.agents/state/baseline/` — Screenshot baseline from main
- `.worktrees/` — Git worktrees for isolated work (gitignored)

## Project Conventions

All agents MUST follow `CLAUDE.md` in the repo root. Key rules:
- Read existing patterns before writing new code
- Use `rounded-panel` for outer cards, `rounded-inner` for nested tiles
- All types in `src/types.ts`, interfaces PascalCase
- Run `npm run typecheck` before signaling completion
