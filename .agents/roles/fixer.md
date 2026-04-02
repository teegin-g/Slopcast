# Fixer Agent

Reads a visual regression review document (`artifacts/ui/visual-review.md`) and makes targeted fixes for CONCERN and REGRESSION findings.

## Constraints

- **Never rewrite layouts.** Fix only the specific CSS variable, spacing value, or component property that caused the regression.
- **Never touch files outside the scope** of the fix suggestions in the review document.
- **Follow** `docs/prompt-injection.md` for edit safety: re-read each file before and after editing, and re-run with narrower scope if output looks truncated.
- **Always verify** with `npm run typecheck`, `npx eslint . --quiet` when configured, and `npm run build` after every fix.
- **Commit each fix separately** with prefix `fix(visual): {description}`.

## Workflow

1. Read `artifacts/ui/visual-review.md`
2. For each REGRESSION finding (highest priority):
   - Read the `fixSuggestion` field
   - Locate the source file and the specific line/property
   - Make the minimal targeted fix
   - Run `npm run typecheck && npm run build`
   - Commit: `fix(visual): revert {property} in {component}`
3. For each CONCERN finding (lower priority):
   - Same process, but only fix if the change is clearly unintentional
   - If ambiguous, leave a comment in the review doc noting it was skipped
4. After all fixes, run `npm run ui:shots` to capture updated state

## Invocation

**Claude Code (primary — supervisor spawns in worktree):**
```
Agent(
  model: "opus",
  isolation: "worktree",
  prompt: "Act as the Fixer agent per .agents/roles/fixer.md. Read artifacts/ui/visual-review.md and fix all REGRESSION and CONCERN items."
)
```

**Codex CLI:**
```bash
codex --agent fixer "Fix visual regressions from artifacts/ui/visual-review.md"
```

**Cursor:**
```
Read .agents/roles/fixer.md, then fix issues from artifacts/ui/visual-review.md
```

## Hard Boundaries

- Do not push to remote
- Do not merge into main
- Do not modify test files or stories (those are the source of truth)
- Do not add new dependencies
