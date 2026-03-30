# Coding Agent Harness

This document describes how coding agents are set up in this repository: what files control behavior, how work is isolated, how validation is enforced, and how the repo is wired for Cursor, Claude Code, and Codex.

## What This Harness Is

Slopcast uses a layered agent harness rather than a single prompt file.

At a high level:

1. `CLAUDE.md` defines the project conventions the agent should follow.
2. `.cursorrules` tells Cursor how to enter the repo's multi-agent operating model.
3. `AGENTS.md` adds UI-specific verification expectations.
4. `.agents/` defines the actual role system, workflow, validation gate, and logging.
5. Tool-specific adapter files make the same model usable from Cursor, Claude Code, and Codex.

The result is a conservative setup designed to keep agents from freelancing on the main codebase without structure, especially for larger feature work.

## Mental Model

The repo supports two ways of working:

1. Direct repo edits for small, simple tasks.
2. Structured multi-agent feature work using `supervisor`, `implementer`, and `validator` roles.

The structured path is the important harness:

1. A supervisor receives the request.
2. The supervisor decomposes the work into task briefs.
3. Each task gets its own git worktree under `.worktrees/`.
4. An implementer works only inside that worktree.
5. A validator runs the gate against that worktree.
6. The supervisor merges validated work back sequentially.

This is explicitly documented as a separation between implementation and validation so coding agents do not quietly degrade the app while iterating.

## Core Control Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project conventions, architecture patterns, testing commands, and UI principles |
| `.cursorrules` | Cursor entry point for the multi-agent workflow |
| `AGENTS.md` | Additional UI workflow rules, especially Storybook and Playwright expectations |
| `.agents/system.md` | Overview of the full multi-agent architecture |
| `.agents/roles/supervisor.md` | Supervisor responsibilities and merge protocol |
| `.agents/roles/implementer.md` | Implementer rules, worktree safety, TDD expectations |
| `.agents/roles/validator.md` | Validator rules and report format |
| `.agents/workflows/feature-pipeline.md` | End-to-end request -> plan -> implement -> validate -> merge flow |
| `.agents/workflows/worktree-lifecycle.md` | Worktree creation, validation, merge, cleanup |
| `.agents/validation/gate.sh` | Fail-fast validation pipeline |
| `.agents/activity-log.sh` | Structured event logging |
| `.agents/activity-summary.sh` | Human-readable activity summary |

## Roles

### Supervisor

Defined in `.agents/roles/supervisor.md`.

Responsibilities:

- Clarify requirements.
- Break work into independent tasks.
- Create worktrees.
- Hand tasks to implementers.
- Send completed worktrees to the validator.
- Merge validated work sequentially.
- Clean up worktrees and branches.

Important supervisor behavior:

- It verifies that work actually landed on the expected worktree branch before merging.
- It treats merge order as dependency-sensitive.
- It runs integration checks after each merge.

### Implementer

Defined in `.agents/roles/implementer.md`.

Responsibilities:

- Work only in an assigned worktree.
- Read existing patterns before changing code.
- Implement the requested feature.
- Run self-checks before signaling completion.

Critical safety rule:

- The first step is to verify the environment with `pwd`, `git worktree list`, and `git branch --show-current`.
- If the agent is not inside a valid worktree, it is supposed to stop and report back rather than write code.

Development expectations:

- Prefer TDD for code that benefits from it.
- Skip TDD for layout-only JSX, type-only edits, constants, and style-only changes.
- Follow the conventions in `CLAUDE.md`.

### Validator

Defined in `.agents/roles/validator.md`.

Responsibilities:

- Run the full validation gate.
- Produce a pass/fail report.
- Stay read-only.

Important boundary:

- The validator is not supposed to fix issues. It only reports them.

## Worktree Isolation Model

The multi-agent system uses git worktrees as the isolation boundary.

Standard convention:

- Branch: `agent/{task-slug}`
- Directory: `.worktrees/{task-slug}`

Canonical setup command:

```bash
git worktree add -b agent/{task-slug} .worktrees/{task-slug} main
cd .worktrees/{task-slug} && npm install
```

Why this matters:

- It keeps parallel tasks from colliding in the same working tree.
- It gives the supervisor a clear branch to validate and merge.
- It makes it obvious when an implementer accidentally writes code outside the intended sandbox.

One nuance: the written workflow assumes `main` is the integration branch. If you are coordinating work from another long-lived branch, the docs and scripts are still useful, but the baked-in examples are opinionated toward `main`.

## Validation Gate

The main enforcement point is `.agents/validation/gate.sh`.

It is a fail-fast pipeline with a mix of warning-only and blocking stages.

### Warning-only stages right now

These stages continue on failure during the current rollout:

- `format:check`
- `lint`
- `circular`
- `knip`
- `deps:check`

### Blocking stages

These stop the gate on failure:

1. `typecheck`
2. `build`
3. `tests`
4. `storybook:build`
5. `storybook:test`
6. `ui:audit`
7. screenshot diff
8. `ui:verify`

### Browser validation behavior

The gate can:

- start a Vite dev server on a validation port
- capture screenshots
- diff them against a baseline
- run Playwright verification

Key options and assumptions:

- `--skip-screenshots` skips screenshot and E2E browser checks
- baseline screenshots live under `.agents/state/baseline`
- the default diff threshold is `1%`
- validation records are written to `.agents/state/validations/`

## UI-Specific Harness Rules

`AGENTS.md` adds a second layer specifically for UI work.

For visual or layout changes, the expected workflow is:

1. Run the app with `npm run dev`.
2. Run Storybook with `npm run storybook`.
3. Use Storybook MCP for reusable UI work when available.
4. Capture before/after screenshots on desktop and mobile.
5. Check both the main builder view and `ANALYSIS`.
6. Check at least the `slate` and `mario` themes.
7. Run `npm run ui:audit`.
8. Run `npm run ui:verify`.

There are also styling guardrails baked into the docs:

- prefer `rounded-panel` for outer cards
- prefer `rounded-inner` for nested tiles
- avoid reintroducing ad-hoc radius and shadow patterns

## Activity Logging And Artifacts

The harness does not just run commands; it records what happened.

### Activity log

`.agents/activity-log.sh` appends JSON lines to:

- `.agents/state/activity.jsonl`

Common events include:

- `session_start`
- `task_created`
- `worktree_created`
- `worktree_verified`
- `implementation_start`
- `implementation_done`
- `validation_start`
- `validation_done`
- `gate_result`
- `merge_start`
- `merge_result`
- `worktree_cleaned`
- `session_end`

### Activity summary

To read the log in a friendlier table:

```bash
bash .agents/activity-summary.sh
bash .agents/activity-summary.sh --task <slug>
```

### Validation artifacts

The gate writes structured JSON reports to:

- `.agents/state/validations/*.json`

These reports store:

- overall pass/fail
- stage counts
- per-stage status

## Adapter Layer By Tool

The repo is not tied to one coding agent. The same operating model is adapted to multiple runtimes.

### Cursor

Relevant files:

- `.cursorrules`
- `.agents/adapters/cursor/.cursorrules`

Behavior:

- Cursor is told to load the multi-agent model from `.agents/`.
- Role activation is prompt-driven: "Act as supervisor", "Act as implementer", or "validate mode".
- The Cursor rules point the agent back to the same role and workflow docs used elsewhere.

### Claude Code

Relevant files:

- `.agents/adapters/claude-code/skills/supervisor.md`
- `.agents/adapters/claude-code/skills/implement.md`
- `.agents/adapters/claude-code/skills/validate.md`
- `.claude/settings.json`

Behavior:

- Claude Code gets explicit skills for the three roles.
- The repo also has a Claude settings file with a session-start hook.
- `CLAUDE.md` is the common convention layer for Claude as well as other agents.

### Codex

Relevant files:

- `.agents/adapters/codex/agents.yaml`
- `.agents/adapters/codex/slopcast-agents.rules`
- `.codex/config.toml`

Behavior:

- Codex defines named agents: `supervisor`, `implementer`, and `validator`.
- Those agents load the same role docs from `.agents/`.
- The Codex permission rules explicitly allow worktree management, validation scripts, Vite, process cleanup, and install commands needed by the harness.
- The repo-local Codex config also registers MCP configuration.

## Skills Layer

Beyond the role system, the repo includes reusable skill libraries.

### Project-local design and UI skills

Mirrored under both:

- `.cursor/skills/`
- `.codex/skills/`

Examples:

- `adapt`
- `animate`
- `audit`
- `bolder`
- `clarify`
- `colorize`
- `critique`
- `delight`
- `distill`
- `extract`
- `frontend-design`
- `harden`
- `normalize`
- `onboard`
- `optimize`
- `polish`
- `quieter`
- `teach-impeccable`

These are essentially reusable playbooks for design-heavy or UI-heavy work.

### Broader Claude skill library

`.claude/skills/` contains a much larger knowledge pack, including Databricks, MLflow, and agent-evaluation workflows. That means the repo is set up not just for plain UI coding but also for more specialized technical assistance when those tasks come up.

## Typical Operating Flows

### Small direct edit

Use the repo directly when the task is simple and does not need the full supervisor/implementer/validator pipeline.

### Structured feature delivery

Use the full harness when you want:

- task decomposition
- isolation with worktrees
- explicit validation
- merge discipline
- a recorded activity trail

### UI-heavy work

Use the full harness plus the `AGENTS.md` visual workflow so the agent checks screenshots, Storybook coverage, theme behavior, and browser flows instead of only passing unit tests.

## Short Version

If you want the shortest accurate summary of the setup, it is this:

- `CLAUDE.md` defines project conventions.
- `.cursorrules` and adapter files tell each coding agent how to enter the role system.
- `.agents/` is the actual harness: roles, workflow, worktree isolation, validation gate, and logging.
- `AGENTS.md` tightens the process for UI work with Storybook, screenshots, theme checks, and Playwright.
- Work is meant to be isolated in `.worktrees/`, validated with `.agents/validation/gate.sh`, and recorded under `.agents/state/`.
