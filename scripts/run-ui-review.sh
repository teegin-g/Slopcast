#!/usr/bin/env bash
# run-ui-review.sh — Start a Claude Code session to execute the UI review plan
# Usage: ./scripts/run-ui-review.sh
#
# This script launches Claude Code with the full UI review context pre-loaded,
# configured to spawn agent teams WITHOUT worktree isolation (which fails on
# Databricks-proxied setups).

set -euo pipefail
cd "$(dirname "$0")/.."

PLAN_FILE=".planning/UI-REVIEW-IMPLEMENTATION-PLAN.md"

if [ ! -f "$PLAN_FILE" ]; then
  echo "ERROR: Plan file not found at $PLAN_FILE"
  exit 1
fi

PROMPT=$(cat <<'PROMPT_EOF'
# UI Review Implementation Session

You have a comprehensive UI review implementation plan at `.planning/UI-REVIEW-IMPLEMENTATION-PLAN.md`. Read it now.

## Your Mission
Execute ALL 6 workstreams described in the plan to implement the full UI review fixes for Slopcast.

## Critical Agent Spawning Rules

**DO NOT use `isolation: "worktree"`** — worktree creation fails on this Databricks-proxied setup.
**DO NOT use `TeamCreate` or `team_name`** — team agent model routing is broken on Databricks.
**DO use regular `Agent` tool calls** with `mode: "bypassPermissions"` — these work correctly.

## Execution Strategy

Run the 6 workstreams using regular Agent tool calls. You can run non-overlapping workstreams in parallel.

### Phase A — Run these 3 agents IN PARALLEL (single message, 3 Agent tool calls):

**Agent 1: Accessibility** — Read the Workstream 1 section of the plan. Execute all changes: MotionConfig wrapper in index.tsx, reduced-motion in 3 canvas backgrounds, focus-visible rings on all listed buttons. Run `npm run typecheck` when done.

**Agent 2: Theme Colors** — Read the Workstream 2 section of the plan. Execute all changes: theme.css edits (radii, synthwave surface, tropical border, remove radius-kpi), themes.ts synthwave glass, SectionCard opacity, KpiGrid labels, Toast borders, radius cleanup. Run `npm run typecheck` when done.

**Agent 3: Layout** — Read the Workstream 3 section of the plan. Execute all changes: AppShell padding, grid gaps, chart padding, PageHeader padding, SidebarNav spacing, useViewportLayout wide breakpoint (check ALL consumers), KpiGrid responsive density. Run `npm run typecheck` when done.

### Phase B — After Phase A agents complete, run these 2 IN PARALLEL:

**Agent 4: Typography** — Read the Workstream 4 section. Execute: app.css typography utilities, KPI value sizes, KPI color coding, demote button font-black to font-bold, extend heading-font, GroupList legibility. Run `npm run typecheck` when done.

**Agent 5: Motion** — Read the Workstream 5 section. Execute: create src/theme/motion.ts, unify springs, kill stepper pulse, fix progress overshoot, animate modals, MobileDrawer springs, AI assistant animation, ViewTransition mode, KPI stagger. Run `npm run typecheck` when done.

### Phase C — After Phase B, run validation:

**Agent 6: Validation** — Run `npm run typecheck && npm run build && npm test && npm run ui:audit`. If any fail, fix the issues. Then start `npm run dev` and use the Playwright MCP browser tools to visually verify: Economics tab (Slate + Synthwave themes), Wells tab (Mario theme), mobile viewport, keyboard focus rings.

## Agent Prompt Template

When spawning each agent, give it:
1. The full workstream section from the plan (copy the relevant content)
2. Explicit file paths and before/after changes
3. Instruction to read each file BEFORE editing
4. Instruction to run `npm run typecheck` at the end
5. `mode: "bypassPermissions"` so it can edit files and run commands

## Start Now

1. Read `.planning/UI-REVIEW-IMPLEMENTATION-PLAN.md`
2. Spawn Phase A agents (all 3 in parallel in a single message)
3. Wait for all 3 to complete
4. Spawn Phase B agents (both in parallel)
5. Wait for both to complete
6. Spawn validation agent
7. Report results
PROMPT_EOF
)

echo "Starting Claude Code UI Review session..."
echo "Plan file: $PLAN_FILE"
echo "Branch: $(git branch --show-current)"
echo ""

exec claude --print "$PROMPT"
