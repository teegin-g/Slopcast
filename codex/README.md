# Codex (project setup)

Codex CLI loads its configuration from:

- `~/.codex/config.toml`
- `~/.codex/rules/*.rules` (command allow/deny rules)

This folder keeps **repo-local templates** you can copy into `~/.codex` to make Codex work smoothly on Slopcast (Playwright MCP + broader command allowances for git/python/basic ops).

## One-time setup

1) Ensure this repo is trusted (and optionally enable Playwright MCP):

- Copy the relevant parts of `codex/slopcast.config.snippet.toml` into `~/.codex/config.toml`.
- Replace the placeholder path with the **absolute path** to this repo.
- If you already have `[mcp_servers.playwright]` configured, don’t duplicate it.

2) Allow common commands Codex may need while working on this repo:

- Copy `codex/slopcast.rules` to `~/.codex/rules/slopcast.rules`.
- Restart Codex.

## Notes on “ample permissions”

The included rules are intentionally broad enough for typical work (git branching/commits, python, npm scripts, basic file ops), but they **do not** allow destructive commands like `rm` by default.

Note: `cd` is a shell builtin, so it isn’t something you allow/deny via `.rules`.

If you want fewer prompts for a given session, prefer using Codex flags instead of opening the rules too far:

- `codex --full-auto` (sandboxed, low-friction)
- `codex -a never -s workspace-write` (no approvals, still sandboxed)
- `codex -s danger-full-access` (use with care)
