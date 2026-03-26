# Worktree Lifecycle

Operations for creating, working in, validating, merging, and cleaning up git worktrees.

## Create

```bash
# Create worktree with new branch based on main
git worktree add -b agent/{task-slug} .worktrees/{task-slug} main

# Install dependencies in the worktree
cd .worktrees/{task-slug} && npm install
```

**Naming convention**: Branch = `agent/{task-slug}`, directory = `.worktrees/{task-slug}`

**Task slug rules**: lowercase, hyphens only, max 50 chars. Example: `add-theme-toggle`, `fix-economics-rounding`

## Work

The implementer operates exclusively in `.worktrees/{task-slug}/`.

```bash
cd .worktrees/{task-slug}

# Make changes...

# Self-check before committing
npm run typecheck
npm test
npm run build
# For reusable UI or browser validation changes
npm run ui:components
npm run ui:verify

# Commit
git add {specific-files}
git commit -m "feat: description of what and why"
```

**Rules**:
- Never push to remote from a worktree
- Never merge into main from a worktree
- Only modify files within scope of the task

## Validate

The validator runs the full gate against the worktree.

```bash
cd .worktrees/{task-slug}
bash .agents/validation/gate.sh
```

For screenshot validation, start the dev server on an alternate port:

```bash
cd .worktrees/{task-slug}

# Start dev server on port 3001
PORT=3001 npx vite --port 3001 &
DEV_PID=$!

# Wait for server
sleep 5

# Capture screenshots
UI_BASE_URL=http://127.0.0.1:3001/ UI_OUT_DIR=.agents/state/validation-{task}/after npm run ui:shots

# Run diff against baseline
node .agents/validation/screenshot-diff.mjs .agents/state/baseline .agents/state/validation-{task}/after

# Run Playwright E2E verification
UI_BASE_URL=http://127.0.0.1:3001/ npm run ui:verify

# Cleanup
kill $DEV_PID
```

## Merge

Merging happens from the main repo root, one worktree at a time.

```bash
# Ensure we're on main
git checkout main

# Merge with no-ff to preserve branch history
git merge --no-ff agent/{task-slug} -m "merge: {task-slug} - brief description"

# Validate main after merge
npm run typecheck && npm run build && npm test && npm run ui:components

# If validation fails:
# git merge --abort  (if merge hasn't been committed yet)
# git revert HEAD    (if merge was already committed)
```

**Merge order**: Respect task dependencies. If Task B depends on Task A, merge A first.

After all merges succeed, run a final comprehensive check:
```bash
npm run ui:verify
```

## Cleanup

After successful merge:

```bash
# Remove the worktree directory
git worktree remove .worktrees/{task-slug}

# Delete the branch (safe — it's been merged)
git branch -d agent/{task-slug}
```

After failed merge (task abandoned):

```bash
# Force-remove the worktree
git worktree remove --force .worktrees/{task-slug}

# Force-delete the unmerged branch
git branch -D agent/{task-slug}
```

## Listing Active Worktrees

```bash
git worktree list
```

## Recovering from Issues

### Worktree is stale (main has moved ahead)
```bash
cd .worktrees/{task-slug}
git rebase main
# Resolve conflicts if any
npm install  # In case dependencies changed
npm run typecheck && npm test
```

### Worktree is corrupted
```bash
git worktree remove --force .worktrees/{task-slug}
git worktree add -b agent/{task-slug} .worktrees/{task-slug} main
cd .worktrees/{task-slug} && npm install
# Re-implement (cherry-pick from old branch if possible)
```
