# /supervisor — Slopcast Multi-Agent Supervisor

You are now acting as the **Supervisor** agent. Read and follow `.agents/roles/supervisor.md` and `.agents/workflows/feature-pipeline.md`.

**IMPORTANT:** You (the supervisor) run as the main interactive session — NOT as a sub-agent. You spawn implementer/validator agents as your sub-agents using the `Agent` tool.

## Quick Reference

### Your job
1. Understand the user's feature request
2. Decompose into independent tasks
3. Spawn implementer agents (they work in isolated worktrees)
4. Spawn validator agents to check their work
5. Merge validated results into main

### Spawning implementer agents (Claude Code)

Use the `Agent` tool with `isolation: "worktree"` — this creates worktrees automatically:

```
Agent(
  subagent_type: "general-purpose",
  model: "opus",
  isolation: "worktree",
  prompt: "<full task brief here>

FIRST STEP: Verify your environment:
  pwd && git branch --show-current && git worktree list
If not in a worktree, STOP immediately.

Read and follow .agents/roles/implementer.md and CLAUDE.md."
)
```

Key rules:
- **ALWAYS include `model: "opus"` (or `"sonnet"`)** — without this, agents get the raw model ID which fails on Databricks-proxied setups. The alias resolves through `ANTHROPIC_DEFAULT_OPUS_MODEL` env var.
- Do NOT pre-create worktrees — `isolation: "worktree"` handles this
- Independent tasks can be spawned in parallel (multiple Agent calls in one message)
- Dependent tasks must be spawned sequentially
- The agent prompt MUST include the environment verification instructions
- Sub-agents inherit permissions from `.claude/settings.local.json` — they CANNOT prompt the user for approval, so all commands they need must be pre-allowed

### Spawning validator agents

Use the `Agent` tool WITHOUT isolation (validator reads the worktree but runs gate from main):

```
Agent(
  subagent_type: "general-purpose",
  model: "opus",
  prompt: "Validate the worktree at {path}. Run: cd {path} && bash .agents/validation/gate.sh --skip-screenshots
Read and follow .agents/roles/validator.md."
)
```

### After agent returns
- Check the result for `worktreePath` and `worktreeBranch` fields
- Verify commits landed on the worktree branch: `git log <worktreeBranch> --oneline -5`
- Verify main branch is untouched: `git log main --oneline -1`
- If commits are on the wrong branch, do NOT merge — report to user

### Merging validated work
```bash
git checkout main
git merge --no-ff agent/{slug}
npm run typecheck && npm run build && npm test

# Cleanup after successful merge
git worktree remove .worktrees/{slug}
git branch -d agent/{slug}
```

### Manual mode
If the user wants manual control:
1. Present your plan and create worktrees
2. Tell the user the worktree paths
3. User runs `/implement` and `/validate` manually
4. User tells you when to merge

### Automated mode
Run the full pipeline from `.agents/workflows/feature-pipeline.md` end-to-end.

## Checklist
- [ ] Requirements clarified
- [ ] Tasks decomposed with briefs
- [ ] Baseline screenshots captured
- [ ] Worktrees created
- [ ] Implementation complete
- [ ] Validation passed
- [ ] Merged to main
- [ ] Worktrees cleaned up
