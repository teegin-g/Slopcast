#!/usr/bin/env bash
set -euo pipefail

# Capture baseline screenshots from main branch.
# Run from repo root before starting validation.
#
# Usage:
#   bash .agents/validation/capture-baseline.sh
#
# Environment variables:
#   BASELINE_PORT — Dev server port (default: 3002)

BASELINE_PORT="${BASELINE_PORT:-3002}"
BASELINE_DIR=".agents/state/baseline"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Capturing baseline screenshots from main...${NC}"

cd "$REPO_ROOT"

# Ensure we're on main (or stash if needed)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
STASH_NEEDED=false

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "  Current branch: $CURRENT_BRANCH"

  # Check for uncommitted changes
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "  Stashing uncommitted changes..."
    git stash push -m "baseline-capture-autostash"
    STASH_NEEDED=true
  fi

  echo "  Switching to main..."
  git checkout main
fi

# Clean and recreate baseline directory
rm -rf "$BASELINE_DIR"
mkdir -p "$BASELINE_DIR"

# Start dev server
echo "  Starting dev server on port ${BASELINE_PORT}..."
npx vite --port "$BASELINE_PORT" &
DEV_PID=$!

# Wait for server
echo "  Waiting for server..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:${BASELINE_PORT}/" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -s "http://127.0.0.1:${BASELINE_PORT}/" > /dev/null 2>&1; then
  echo -e "${RED}  Dev server failed to start on port ${BASELINE_PORT}${NC}"
  kill "$DEV_PID" 2>/dev/null || true
  exit 1
fi

# Capture screenshots
echo "  Capturing screenshots..."
UI_BASE_URL="http://127.0.0.1:${BASELINE_PORT}/" UI_OUT_DIR="$BASELINE_DIR" npm run ui:shots 2>&1

# Stop dev server
kill "$DEV_PID" 2>/dev/null || true
wait "$DEV_PID" 2>/dev/null || true

# Return to original branch if we switched
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "  Switching back to $CURRENT_BRANCH..."
  git checkout "$CURRENT_BRANCH"

  if [ "$STASH_NEEDED" = true ]; then
    echo "  Restoring stashed changes..."
    git stash pop
  fi
fi

# Count screenshots
SHOT_COUNT=$(find "$BASELINE_DIR" -name "*.png" 2>/dev/null | wc -l)
echo -e "${GREEN}  Baseline captured: ${SHOT_COUNT} screenshots in ${BASELINE_DIR}${NC}"
