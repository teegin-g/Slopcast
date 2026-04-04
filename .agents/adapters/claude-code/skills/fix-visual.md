# /fix-visual — Visual Regression Fixer

Reads `artifacts/ui/visual-review.md` and fixes flagged REGRESSION and CONCERN items.

## Trigger

User runs `/fix-visual` or says "fix visual regressions".

## Behavior

1. Read `artifacts/ui/visual-review.md`
2. If no review file exists, tell the user to run `npm run ui:review` first
3. Parse the findings table for REGRESSION and CONCERN entries
4. For each finding with a `fixSuggestion`:
   - Read the referenced source file
   - Apply the minimal fix (CSS variable, spacing, border-radius, etc.)
   - Re-read the file after editing to confirm the change applied cleanly
   - Run `npm run typecheck` and `npx eslint . --quiet` when configured to verify
5. After all fixes: `npm run build`
6. Commit each fix: `fix(visual): {description}`
7. Report what was fixed and what was skipped

## Important

- Always pass `model: "opus"` when spawning as a sub-agent (Databricks proxy requirement)
- If running in a worktree, verify with `git worktree list` first
- Follow the edit-safety and truncation rules in `CLAUDE.md`
- Only fix what the review document explicitly flags — do not refactor surrounding code
