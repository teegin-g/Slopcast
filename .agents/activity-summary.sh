#!/usr/bin/env bash
set -euo pipefail

# Slopcast Agent Activity Summary
# Reads .agents/state/activity.jsonl and prints a formatted table.
#
# Usage:
#   bash .agents/activity-summary.sh                 # All events
#   bash .agents/activity-summary.sh --task <slug>   # Filter by task

TASK_FILTER=""

while [ $# -gt 0 ]; do
  case "$1" in
    --task)
      TASK_FILTER="$2"
      shift 2
      ;;
    *)
      echo "Usage: bash .agents/activity-summary.sh [--task <slug>]" >&2
      exit 1
      ;;
  esac
done

# Find the log file
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MAIN_WORKTREE="$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //' || echo "$REPO_ROOT")"
LOG_FILE="${MAIN_WORKTREE}/.agents/state/activity.jsonl"

if [ ! -f "$LOG_FILE" ]; then
  echo "No activity log found at ${LOG_FILE}"
  exit 0
fi

CYAN='\033[0;36m'
NC='\033[0m'

# Print header
printf "${CYAN}%-20s  %-22s  %-30s  %s${NC}\n" "TIMESTAMP" "EVENT" "TASK" "DETAILS"
printf "${CYAN}%s${NC}\n" "──────────────────────────────────────────────────────────────────────────────────────────"

# Process each line
while IFS= read -r line; do
  # Skip empty lines
  [ -z "$line" ] && continue

  # Extract fields using lightweight parsing (no jq dependency)
  ts=$(echo "$line" | sed -n 's/.*"ts":"\([^"]*\)".*/\1/p')
  event=$(echo "$line" | sed -n 's/.*"event":"\([^"]*\)".*/\1/p')
  task=$(echo "$line" | sed -n 's/.*"task":"\([^"]*\)".*/\1/p')

  # Apply task filter
  if [ -n "$TASK_FILTER" ] && [ "$task" != "$TASK_FILTER" ]; then
    continue
  fi

  # Extract time portion only (HH:MM:SS) from ISO timestamp
  time_only="${ts##*T}"
  time_only="${time_only%%Z*}"

  # Build details string from remaining key-value pairs (exclude ts, event, task)
  details=""
  # Extract all key-value pairs and filter out ts, event, task
  for key in result passed failed role worktree branch reason; do
    val=$(echo "$line" | sed -n "s/.*\"${key}\":\"\\([^\"]*\\)\".*/\\1/p")
    if [ -n "$val" ]; then
      if [ -n "$details" ]; then
        details="${details}, ${key}=${val}"
      else
        details="${key}=${val}"
      fi
    fi
  done

  printf "%-20s  %-22s  %-30s  %s\n" "$time_only" "$event" "$task" "$details"
done < "$LOG_FILE"
