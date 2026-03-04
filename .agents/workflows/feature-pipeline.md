# Feature Pipeline Workflow

End-to-end workflow for implementing features using the multi-agent system.

## Phases

### Phase 1: Request & Planning (Supervisor)

1. Receive feature request from user
2. Ask clarifying questions if requirements are ambiguous
3. Decompose into independent tasks with clear briefs
4. Determine task dependencies and parallelization strategy
5. Present plan to user for approval (in manual mode, pause here)

### Phase 2: Setup (Supervisor)

1. Capture baseline screenshots from main (if not already captured):
   ```bash
   bash .agents/validation/capture-baseline.sh
   ```
2. Create a worktree for each task:
   ```bash
   git worktree add -b agent/{task-slug} .worktrees/{task-slug} main
   cd .worktrees/{task-slug} && npm install
   ```
3. In manual mode: report worktree paths and pause

### Phase 3: Implementation (Implementer)

For each task (parallel if independent, sequential if dependent):

1. Implementer reads task brief and relevant code
2. Implementer writes code following CLAUDE.md conventions
3. Implementer runs self-checks: `typecheck` + `test` + `build`
4. Implementer commits with descriptive message
5. Implementer signals completion

In manual mode: user runs `/implement` in each worktree

### Phase 4: Validation (Validator)

For each completed worktree:

1. Validator runs full gate: `bash .agents/validation/gate.sh`
2. Validator generates pass/fail report
3. If FAIL: report goes back to implementer for fixing (max 3 cycles)
4. If PASS: worktree is ready for merge

In manual mode: user runs `/validate` against each worktree

### Phase 5: Merge (Supervisor)

Sequential merge of validated worktrees:

1. `git checkout main`
2. For each worktree (in dependency order):
   a. `git merge --no-ff agent/{task-slug}`
   b. Run integration check: `npm run typecheck && npm run build && npm test`
   c. If fail: `git merge --abort`, report to user
   d. If pass: continue to next worktree
3. After all merges: `npm run ui:verify` as final check

### Phase 6: Cleanup (Supervisor)

1. Remove all worktrees: `git worktree remove .worktrees/{task-slug}`
2. Delete branches: `git branch -d agent/{task-slug}`
3. Report summary to user

## Failure Escalation

```
Implementation fails → Retry with updated brief (max 2 retries)
    ↓ (still fails)
Validation fails → Send to implementer for fix (max 3 cycles)
    ↓ (still fails)
Merge conflicts → Rebase and resolve (implementer)
    ↓ (still fails)
Escalate to user as "needs human review"
```

## Example

```
User: "Add dark mode toggle to the header"

Supervisor:
  Task 1: "Add theme toggle button component" → worktree: .worktrees/theme-toggle-btn
  Task 2: "Wire toggle into header layout" → worktree: .worktrees/header-theme-wire
  (Task 2 depends on Task 1)

Phase 3: Implement Task 1, then Task 2
Phase 4: Validate each
Phase 5: Merge Task 1, validate main, merge Task 2, validate main
Phase 6: Clean up
```
