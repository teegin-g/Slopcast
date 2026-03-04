#!/usr/bin/env bash
set -euo pipefail

# Slopcast Agent Activity Logger
# Appends one JSON line to .agents/state/activity.jsonl
#
# Usage:
#   bash .agents/activity-log.sh <event> [key=value ...]
#
# Examples:
#   bash .agents/activity-log.sh session_start role=supervisor
#   bash .agents/activity-log.sh task_created task=add-theme-toggle
#   bash .agents/activity-log.sh gate_result task=add-theme-toggle result=PASS passed=4 failed=0
#
# Events:
#   session_start, task_created, worktree_created, worktree_verified,
#   implementation_start, implementation_done, validation_start, validation_done,
#   gate_result, merge_start, merge_result, worktree_cleaned, session_end
#
# Values starting with { or [ are treated as raw JSON; all others are strings.

if [ $# -lt 1 ]; then
  echo "Usage: bash .agents/activity-log.sh <event> [key=value ...]" >&2
  exit 1
fi

EVENT="$1"
shift

# Find repo root (works from worktrees too)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# If in a worktree, the state dir lives in the main repo
MAIN_WORKTREE="$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //' || echo "$REPO_ROOT")"
STATE_DIR="${MAIN_WORKTREE}/.agents/state"
LOG_FILE="${STATE_DIR}/activity.jsonl"

mkdir -p "$STATE_DIR"

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Build JSON object
JSON="{\"ts\":\"${TS}\",\"event\":\"${EVENT}\""

for pair in "$@"; do
  KEY="${pair%%=*}"
  VALUE="${pair#*=}"

  # Values starting with { or [ are raw JSON
  if [[ "$VALUE" == "{"* ]] || [[ "$VALUE" == "["* ]]; then
    JSON="${JSON},\"${KEY}\":${VALUE}"
  else
    # Escape double quotes in string values
    VALUE="${VALUE//\"/\\\"}"
    JSON="${JSON},\"${KEY}\":\"${VALUE}\""
  fi
done

JSON="${JSON}}"

echo "$JSON" >> "$LOG_FILE"
