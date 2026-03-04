#!/usr/bin/env bash
set -euo pipefail

# Slopcast Validation Gate
# Fail-fast pipeline — stops at first failure.
# Run from repo root (or worktree root).
#
# Usage:
#   bash .agents/validation/gate.sh                    # All stages
#   bash .agents/validation/gate.sh --skip-screenshots  # Skip screenshot diff (stages 5-6)
#
# Environment variables:
#   VALIDATION_PORT   — Dev server port for screenshots (default: 3001)
#   BASELINE_DIR      — Baseline screenshot directory (default: .agents/state/baseline)
#   DIFF_THRESHOLD    — Max pixel diff % before failure (default: 1)

SKIP_SCREENSHOTS=false
for arg in "$@"; do
  case "$arg" in
    --skip-screenshots) SKIP_SCREENSHOTS=true ;;
  esac
done

VALIDATION_PORT="${VALIDATION_PORT:-3001}"
BASELINE_DIR="${BASELINE_DIR:-.agents/state/baseline}"
DIFF_THRESHOLD="${DIFF_THRESHOLD:-1}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

stage_pass() {
  echo -e "  ${GREEN}PASS${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

stage_fail() {
  echo -e "  ${RED}FAIL${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

stage_skip() {
  echo -e "  ${YELLOW}SKIP${NC} $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  Slopcast Validation Gate${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# ── Stage 1: Type Safety ──────────────────────────────────────
echo -e "${CYAN}Stage 1: Type Safety${NC}"
if npm run typecheck 2>&1; then
  stage_pass "typecheck"
else
  stage_fail "typecheck"
  echo -e "\n${RED}Gate failed at Stage 1: Type errors found.${NC}"
  exit 1
fi
echo ""

# ── Stage 2: Production Build ─────────────────────────────────
echo -e "${CYAN}Stage 2: Production Build${NC}"
if npm run build 2>&1; then
  stage_pass "build"
else
  stage_fail "build"
  echo -e "\n${RED}Gate failed at Stage 2: Build errors found.${NC}"
  exit 1
fi
echo ""

# ── Stage 3: Unit Tests ──────────────────────────────────────
echo -e "${CYAN}Stage 3: Unit Tests${NC}"
if npm test 2>&1; then
  stage_pass "tests"
else
  stage_fail "tests"
  echo -e "\n${RED}Gate failed at Stage 3: Test failures found.${NC}"
  exit 1
fi
echo ""

# ── Stage 4: Style Drift ─────────────────────────────────────
echo -e "${CYAN}Stage 4: Style Drift Check${NC}"
if npm run ui:audit 2>&1; then
  stage_pass "ui:audit"
else
  stage_fail "ui:audit"
  echo -e "\n${RED}Gate failed at Stage 4: Style drift detected.${NC}"
  exit 1
fi
echo ""

# ── Stage 5: Screenshot Diff ─────────────────────────────────
if [ "$SKIP_SCREENSHOTS" = true ]; then
  echo -e "${CYAN}Stage 5: Screenshot Diff${NC}"
  stage_skip "screenshots (--skip-screenshots)"
  echo ""
  echo -e "${CYAN}Stage 6: UI Flow Validation${NC}"
  stage_skip "ui:verify (--skip-screenshots)"
  echo ""
else
  echo -e "${CYAN}Stage 5: Screenshot Diff${NC}"

  if [ ! -d "$BASELINE_DIR" ] || [ -z "$(ls -A "$BASELINE_DIR" 2>/dev/null)" ]; then
    stage_skip "screenshots (no baseline — run capture-baseline.sh first)"
    echo ""
  else
    TASK_SLUG=$(basename "$(pwd)")
    AFTER_DIR=".agents/state/validation-${TASK_SLUG}/after"

    # Start dev server
    npx vite --port "$VALIDATION_PORT" &
    DEV_PID=$!

    # Wait for server to be ready
    echo "  Waiting for dev server on port ${VALIDATION_PORT}..."
    for i in $(seq 1 30); do
      if curl -s "http://127.0.0.1:${VALIDATION_PORT}/" > /dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    # Capture screenshots
    UI_BASE_URL="http://127.0.0.1:${VALIDATION_PORT}/" UI_OUT_DIR="$AFTER_DIR" npm run ui:shots 2>&1 || true

    # Kill dev server
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true

    if [ -d "$AFTER_DIR" ] && [ -n "$(ls -A "$AFTER_DIR"/*.png 2>/dev/null)" ]; then
      # Run diff
      DIFF_RESULT=$(node .agents/validation/screenshot-diff.mjs "$BASELINE_DIR" "$AFTER_DIR" --threshold "$DIFF_THRESHOLD" 2>&1) || true
      echo "$DIFF_RESULT"

      if echo "$DIFF_RESULT" | grep -q "SCREENSHOT_DIFF_FAIL"; then
        stage_fail "screenshots (diff exceeds ${DIFF_THRESHOLD}% threshold)"
        echo -e "\n${RED}Gate failed at Stage 5: Screenshot regression detected.${NC}"
        exit 1
      else
        stage_pass "screenshots"
      fi
    else
      stage_skip "screenshots (capture failed — check dev server)"
    fi
    echo ""

    # ── Stage 6: UI Flow Validation ─────────────────────────────
    echo -e "${CYAN}Stage 6: UI Flow Validation${NC}"

    # Restart dev server for ui:verify
    npx vite --port "$VALIDATION_PORT" &
    DEV_PID=$!
    for i in $(seq 1 30); do
      if curl -s "http://127.0.0.1:${VALIDATION_PORT}/" > /dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    if UI_BASE_URL="http://127.0.0.1:${VALIDATION_PORT}/" npm run ui:verify 2>&1; then
      stage_pass "ui:verify"
    else
      stage_fail "ui:verify"
      kill "$DEV_PID" 2>/dev/null || true
      wait "$DEV_PID" 2>/dev/null || true
      echo -e "\n${RED}Gate failed at Stage 6: UI flow verification failed.${NC}"
      exit 1
    fi

    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
    echo ""
  fi
fi

# ── Summary ───────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "  ${GREEN}${PASS_COUNT} passed${NC}  ${SKIP_COUNT} skipped  ${RED}${FAIL_COUNT} failed${NC}"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}VALIDATION GATE: PASS${NC}"
else
  echo -e "  ${RED}VALIDATION GATE: FAIL${NC}"
fi
echo -e "${CYAN}═══════════════════════════════════════${NC}"

exit "$FAIL_COUNT"
