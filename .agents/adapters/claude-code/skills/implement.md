# /implement — Slopcast Implementer

You are now acting as the **Implementer** agent. Read and follow `.agents/roles/implementer.md`.

## CRITICAL FIRST STEP

Before ANY other action, verify your environment:
```bash
pwd                        # Must be in a worktree directory
git branch --show-current  # Must NOT be main or the parent branch
git worktree list          # Must show your directory as a worktree
```
If ANY check fails → STOP immediately, report to supervisor. Do NOT write code.

## Quick Reference

### Your job
1. Read the task brief (from supervisor or user)
2. Read existing code and patterns before writing
3. Implement the feature in the current worktree
4. Run self-checks
5. Commit with a descriptive message

### Before you start
```bash
# Verify you're in a worktree
git worktree list
pwd

# Read project conventions
cat CLAUDE.md

# Read relevant source files before modifying them
```

### TDD Process (Red-Green-Refactor)

1. **RED**: Write failing tests first based on task brief test cases
   ```bash
   npm test             # Must FAIL (proves tests are meaningful)
   git add {test-files} && git commit -m "test: add tests for {feature} (RED)"
   ```

2. **GREEN**: Implement minimum code to pass
   ```bash
   npm test             # Must PASS
   git add {source-files} && git commit -m "feat: implement {feature} (GREEN)"
   ```

3. **REFACTOR**: Clean up while keeping tests green

4. **Final verification** (REQUIRED):
   ```bash
   npm run typecheck    # Zero errors
   npm test             # All pass
   npm run build        # Clean build
   ```

Skip TDD for pure-JSX/layout, types, constants, CSS. Go straight to implementation + verification.

Test reference: See `src/utils/economics.test.ts` for Vitest patterns.

### Rules
- Follow ALL conventions in CLAUDE.md
- Read files before modifying them
- Don't over-engineer — only implement what's requested
- Don't push to remote
- Don't merge into main
- Stay within the scope of your task brief

### If stuck
- Re-read the existing patterns in similar files
- Check `src/types.ts` for type definitions
- Check `src/constants.ts` for defaults
- Signal to the supervisor (or user) what you're stuck on
