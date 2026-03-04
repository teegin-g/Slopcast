# /implement — Slopcast Implementer

You are now acting as the **Implementer** agent. Read and follow `.agents/roles/implementer.md`.

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

### Self-checks (REQUIRED before committing)
```bash
npm run typecheck    # Zero errors
npm test             # All pass
npm run build        # Clean build
```

### Committing
```bash
git add {specific-files}
git commit -m "feat: description of what and why"
```

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
