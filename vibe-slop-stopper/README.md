# Vibe Slop Stopper

**A comprehensive plan to tame vibe-code creep in the Slopcast codebase.**

## What is this?

Slopcast has grown to 29,400 lines across 123 files with zero automated guardrails — no linter, no formatter, no dead code detection, no complexity limits. Every AI session is free to grow files, add unused exports, and accumulate state without friction. This folder contains the diagnosis, tooling plan, refactoring guides, and ongoing governance framework to fix that.

## Documents

| File | Purpose |
|------|---------|
| [01-DIAGNOSIS.md](./01-DIAGNOSIS.md) | Current state audit — what's wrong and why it hurts |
| [02-TOOLING-SETUP.md](./02-TOOLING-SETUP.md) | Install guides for ESLint, Prettier, Knip, dependency-cruiser, bundle analyzer |
| [03-REFACTORING-PLAN.md](./03-REFACTORING-PLAN.md) | Concrete plan to split monoliths (god hook, types, CSS, backgrounds) |
| [04-CI-INTEGRATION.md](./04-CI-INTEGRATION.md) | Gate script updates and CI pipeline additions |
| [05-AI-CODING-GUIDELINES.md](./05-AI-CODING-GUIDELINES.md) | Rules for AI agents to prevent future creep |
| [06-ROLLOUT-SCHEDULE.md](./06-ROLLOUT-SCHEDULE.md) | Prioritized week-by-week implementation timeline |

## The One-Liner

> The code isn't bad — it's **ungoverned**. The fix isn't a rewrite, it's tooling that makes the right thing easy and the wrong thing loud.

## Quick Start

If you want to start fixing things right now:

```bash
# 1. Install guardrails (15 min)
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks prettier knip

# 2. Run dead code scan
npx knip

# 3. Run lint (after config — see 02-TOOLING-SETUP.md)
npx eslint src/

# 4. Check circular deps
npx madge --circular --extensions ts,tsx src/
```
