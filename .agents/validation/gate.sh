#!/usr/bin/env bash
set -euo pipefail

# Slopcast Validation Gate
# Fail-fast pipeline — stops at first failure.
# Run from repo root (or worktree root).
#
# Usage:
#   bash .agents/validation/gate.sh                    # All stages
#   bash .agents/validation/gate.sh --skip-screenshots  # Skip browser validation (stages 7-8)
#
# Environment variables:
#   VALIDATION_PORT   — Dev server port for screenshots (default: 3001)
#   BASELINE_DIR      — Baseline screenshot directory (default: .agents/state/baseline)
#   DIFF_THRESHOLD    — Max pixel diff % before failure (default: 1)
#   TASK_NAME         — Task name for logging (default: derived from directory)

SKIP_SCREENSHOTS=false
for arg in "$@"; do
  case "$arg" in
    --skip-screenshots) SKIP_SCREENSHOTS=true ;;
  esac
done

VALIDATION_PORT="${VALIDATION_PORT:-3001}"
BASELINE_DIR="${BASELINE_DIR:-.agents/state/baseline}"
DIFF_THRESHOLD="${DIFF_THRESHOLD:-1}"
TASK_NAME="${TASK_NAME:-$(basename "$(pwd)")}"

# Locate activity-log.sh (works from worktrees)
MAIN_WORKTREE="$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //' || pwd)"
ACTIVITY_LOG="${MAIN_WORKTREE}/.agents/activity-log.sh"

log_event() {
  if [ -f "$ACTIVITY_LOG" ]; then
    bash "$ACTIVITY_LOG" "$@" 2>/dev/null || true
  fi
}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
WARN_COUNT=0

STAGE_FORMAT_CHECK="SKIP"
STAGE_LINT="SKIP"
STAGE_CIRCULAR="SKIP"
STAGE_KNIP="SKIP"
STAGE_DEPS_CHECK="SKIP"
STAGE_TYPECHECK="SKIP"
STAGE_BUILD="SKIP"
STAGE_TESTS="SKIP"
STAGE_STORYBOOK_BUILD="SKIP"
STAGE_STORYBOOK_TEST="SKIP"
STAGE_UI_AUDIT="SKIP"
STAGE_SCREENSHOTS="SKIP"
STAGE_STORYBOOK_SHOTS="SKIP"
STAGE_AI_REVIEW="SKIP"
STAGE_UI_VERIFY="SKIP"

set_stage_result() {
  local label="$1"
  local value="$2"

  case "$label" in
    format:check*) STAGE_FORMAT_CHECK="$value" ;;
    lint*) STAGE_LINT="$value" ;;
    circular*) STAGE_CIRCULAR="$value" ;;
    knip*) STAGE_KNIP="$value" ;;
    deps:check*) STAGE_DEPS_CHECK="$value" ;;
    typecheck*) STAGE_TYPECHECK="$value" ;;
    build*) STAGE_BUILD="$value" ;;
    tests*) STAGE_TESTS="$value" ;;
    storybook:build*) STAGE_STORYBOOK_BUILD="$value" ;;
    storybook:test*) STAGE_STORYBOOK_TEST="$value" ;;
    ui:audit*) STAGE_UI_AUDIT="$value" ;;
    screenshots*) STAGE_SCREENSHOTS="$value" ;;
    storybook-shots*) STAGE_STORYBOOK_SHOTS="$value" ;;
    ai-visual-review*) STAGE_AI_REVIEW="$value" ;;
    ui:verify*) STAGE_UI_VERIFY="$value" ;;
  esac
}

stage_pass() {
  echo -e "  ${GREEN}PASS${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
  set_stage_result "$1" "PASS"
}

stage_fail() {
  echo -e "  ${RED}FAIL${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  set_stage_result "$1" "FAIL"
}

stage_skip() {
  echo -e "  ${YELLOW}SKIP${NC} $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
  set_stage_result "$1" "SKIP"
}

stage_warn() {
  echo -e "  ${YELLOW}WARN${NC} $1"
  WARN_COUNT=$((WARN_COUNT + 1))
  set_stage_result "$1" "WARN"
}

# Write validation record and log result
write_validation_record() {
  local result="$1"
  local timestamp
  timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local date_slug
  date_slug="$(date -u +%Y%m%d-%H%M%S)"

  local validations_dir="${MAIN_WORKTREE}/.agents/state/validations"
  mkdir -p "$validations_dir"

  local record_file="${validations_dir}/${TASK_NAME}-${date_slug}.json"

  cat > "$record_file" <<RECORD_EOF
{
  "task": "${TASK_NAME}",
  "timestamp": "${timestamp}",
  "result": "${result}",
  "passed": ${PASS_COUNT},
  "warnings": ${WARN_COUNT},
  "failed": ${FAIL_COUNT},
  "skipped": ${SKIP_COUNT},
  "stages": {
    "format_check": "${STAGE_FORMAT_CHECK}",
    "lint": "${STAGE_LINT}",
    "circular": "${STAGE_CIRCULAR}",
    "knip": "${STAGE_KNIP}",
    "deps_check": "${STAGE_DEPS_CHECK}",
    "typecheck": "${STAGE_TYPECHECK}",
    "build": "${STAGE_BUILD}",
    "tests": "${STAGE_TESTS}",
    "storybook_build": "${STAGE_STORYBOOK_BUILD}",
    "storybook_test": "${STAGE_STORYBOOK_TEST}",
    "ui_audit": "${STAGE_UI_AUDIT}",
    "screenshots": "${STAGE_SCREENSHOTS}",
    "storybook_shots": "${STAGE_STORYBOOK_SHOTS}",
    "ai_visual_review": "${STAGE_AI_REVIEW}",
    "ui_verify": "${STAGE_UI_VERIFY}"
  }
}
RECORD_EOF

  log_event gate_result task="$TASK_NAME" result="$result" passed="$PASS_COUNT" failed="$FAIL_COUNT"
}

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  Slopcast Validation Gate${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

log_event validation_start task="$TASK_NAME"

# ── Stage 1: Format Check (warning-only rollout) ──────────────
echo -e "${CYAN}Stage 1: Format Check${NC}"
if npm run format:check 2>&1; then
  stage_pass "format:check"
else
  stage_warn "format:check"
  echo -e "  ${YELLOW}Continuing:${NC} formatting is warning-only during the vibe-slop-stopper rollout."
fi
echo ""

# ── Stage 2: Lint (warning-only rollout) ──────────────────────
echo -e "${CYAN}Stage 2: Lint${NC}"
if npm run lint 2>&1; then
  stage_pass "lint"
else
  stage_warn "lint"
  echo -e "  ${YELLOW}Continuing:${NC} lint is warning-only during the vibe-slop-stopper rollout."
fi
echo ""

# ── Stage 3: Circular Dependencies (warning-only rollout) ─────
echo -e "${CYAN}Stage 3: Circular Dependencies${NC}"
if npm run circular 2>&1; then
  stage_pass "circular"
else
  stage_warn "circular"
  echo -e "  ${YELLOW}Continuing:${NC} circular dependency checks are warning-only during rollout."
fi
echo ""

# ── Stage 4: Dead Code Scan (warning-only rollout) ────────────
echo -e "${CYAN}Stage 4: Dead Code Scan${NC}"
KNIP_OUTPUT="$(npm run knip -- --no-exit-code 2>&1 || true)"
echo "$KNIP_OUTPUT"
if echo "$KNIP_OUTPUT" | grep -qE "Unused |Unlisted |Configuration hints"; then
  stage_warn "knip"
else
  stage_pass "knip"
fi
echo ""

# ── Stage 5: Architecture Rules (warning-only rollout) ────────
echo -e "${CYAN}Stage 5: Architecture Rules${NC}"
DEPS_OUTPUT="$(npm run deps:check 2>&1 || true)"
echo "$DEPS_OUTPUT"
if echo "$DEPS_OUTPUT" | grep -q " warn "; then
  stage_warn "deps:check"
else
  stage_pass "deps:check"
fi
echo ""

# ── Stage 6: Type Safety ──────────────────────────────────────
echo -e "${CYAN}Stage 6: Type Safety${NC}"
if npm run typecheck 2>&1; then
  stage_pass "typecheck"
else
  stage_fail "typecheck"
  echo -e "\n${RED}Gate failed at Stage 6: Type errors found.${NC}"
  write_validation_record "FAIL"
  exit 1
fi
echo ""

# ── Stage 7: Production Build ─────────────────────────────────
echo -e "${CYAN}Stage 7: Production Build${NC}"
if npm run build 2>&1; then
  stage_pass "build"
else
  stage_fail "build"
  echo -e "\n${RED}Gate failed at Stage 7: Build errors found.${NC}"
  write_validation_record "FAIL"
  exit 1
fi
echo ""

# ── Stage 8: Unit Tests ──────────────────────────────────────
echo -e "${CYAN}Stage 8: Unit Tests${NC}"
if npm test 2>&1; then
  stage_pass "tests"
else
  stage_fail "tests"
  echo -e "\n${RED}Gate failed at Stage 8: Test failures found.${NC}"
  write_validation_record "FAIL"
  exit 1
fi
echo ""

# ── Stage 8.5: Test Coverage Warning ─────────────────────────
echo -e "${CYAN}Stage 8.5: Test Coverage Check${NC}"

# Files that don't need unit tests
SKIP_TEST_PATTERNS="App.tsx|index.tsx|main.tsx|pages/.*\.tsx|types\.ts|constants\.ts|constants/.*\.ts|theme/.*\.ts|styles/.*|auth/.*Provider|\.d\.ts"

MISSING_TESTS=()
CHANGED_FILES=$(git diff --name-only main...HEAD 2>/dev/null || echo "")

if [ -n "$CHANGED_FILES" ]; then
  while IFS= read -r file; do
    # Only check .ts/.tsx source files under src/
    if [[ "$file" == src/*.ts ]] || [[ "$file" == src/*.tsx ]]; then
      # Skip files that don't need tests
      if echo "$file" | grep -qE "$SKIP_TEST_PATTERNS"; then
        continue
      fi
      # Skip test files themselves
      if [[ "$file" == *.test.ts ]] || [[ "$file" == *.test.tsx ]]; then
        continue
      fi
      # Check for corresponding test file
      test_file="${file%.*}.test.${file##*.}"
      if [ ! -f "$test_file" ]; then
        MISSING_TESTS+=("$file")
      fi
    fi
  done <<< "$CHANGED_FILES"
fi

if [ ${#MISSING_TESTS[@]} -gt 0 ]; then
  echo -e "  ${YELLOW}WARNING${NC} The following changed source files have no corresponding .test.ts file:"
  for f in "${MISSING_TESTS[@]}"; do
    echo -e "    ${YELLOW}⚠${NC}  $f"
  done
  echo -e "  (This is a warning, not a failure — some files are hard to unit test)"
else
  echo -e "  ${GREEN}OK${NC} All changed source files have test coverage (or are exempt)"
fi
echo ""

# ── Stage 9: Storybook Build ────────────────────────────────
echo -e "${CYAN}Stage 9: Storybook Build${NC}"
if npm run storybook:build 2>&1; then
  stage_pass "storybook:build"
else
  stage_fail "storybook:build"
  echo -e "\n${RED}Gate failed at Stage 9: Storybook build failed.${NC}"
  write_validation_record "FAIL"
  exit 1
fi
echo ""

# ── Stage 10: Storybook Tests ────────────────────────────────
echo -e "${CYAN}Stage 10: Storybook Tests${NC}"
if npm run storybook:test 2>&1; then
  stage_pass "storybook:test"
else
  stage_fail "storybook:test"
  echo -e "\n${RED}Gate failed at Stage 10: Storybook tests failed.${NC}"
  write_validation_record "FAIL"
  exit 1
fi
echo ""

# ── Stage 11: Style Drift ─────────────────────────────────────
echo -e "${CYAN}Stage 11: Style Drift Check${NC}"
if npm run ui:audit 2>&1; then
  stage_pass "ui:audit"
else
  stage_fail "ui:audit"
  echo -e "\n${RED}Gate failed at Stage 11: Style drift detected.${NC}"
  write_validation_record "FAIL"
  exit 1
fi
echo ""

# ── Stage 12: Screenshot Diff ────────────────────────────────
if [ "$SKIP_SCREENSHOTS" = true ]; then
  echo -e "${CYAN}Stage 12: Screenshot Diff${NC}"
  stage_skip "screenshots (--skip-screenshots)"
  echo ""
  echo -e "${CYAN}Stage 13: Playwright E2E${NC}"
  stage_skip "ui:verify (--skip-screenshots)"
  echo ""
else
  echo -e "${CYAN}Stage 12: Screenshot Diff${NC}"
  TASK_SLUG=$(basename "$(pwd)")
  AFTER_DIR=".agents/state/validation-${TASK_SLUG}/after"

  if [ ! -d "$BASELINE_DIR" ] || [ -z "$(ls -A "$BASELINE_DIR" 2>/dev/null)" ]; then
    stage_skip "screenshots (no baseline — run capture-baseline.sh first)"
  else
    # Start dev server
    npx vite --host 127.0.0.1 --strictPort --port "$VALIDATION_PORT" &
    DEV_PID=$!

    # Wait for server to be ready
    echo "  Waiting for dev server on port ${VALIDATION_PORT}..."
    for i in $(seq 1 30); do
      if curl -s "http://127.0.0.1:${VALIDATION_PORT}/" > /dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    # Capture screenshots (all 7 themes for full regression coverage)
    UI_BASE_URL="http://127.0.0.1:${VALIDATION_PORT}/" UI_OUT_DIR="$AFTER_DIR" UI_ALL_THEMES=1 npm run ui:shots 2>&1 || true

    # Kill dev server
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true

    if [ -d "$AFTER_DIR" ] && [ -n "$(ls -A "$AFTER_DIR"/*.png 2>/dev/null)" ]; then
      # Run diff
      DIFF_RESULT=$(node .agents/validation/screenshot-diff.mjs "$BASELINE_DIR" "$AFTER_DIR" --threshold "$DIFF_THRESHOLD" 2>&1) || true
      echo "$DIFF_RESULT"

      if echo "$DIFF_RESULT" | grep -q "SCREENSHOT_DIFF_FAIL"; then
        stage_fail "screenshots (diff exceeds ${DIFF_THRESHOLD}% threshold)"
        echo -e "\n${RED}Gate failed at Stage 12: Screenshot regression detected.${NC}"
        write_validation_record "FAIL"
        exit 1
      else
        stage_pass "screenshots"
      fi
    else
      stage_skip "screenshots (capture failed — check dev server)"
    fi
  fi
  echo ""

  # ── Stage 13: Playwright E2E ──────────────────────────────────
  echo -e "${CYAN}Stage 13: Playwright E2E${NC}"

  # Start dev server for ui:verify
  npx vite --host 127.0.0.1 --strictPort --port "$VALIDATION_PORT" &
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
    echo -e "\n${RED}Gate failed at Stage 13: Playwright E2E failed.${NC}"
    write_validation_record "FAIL"
    exit 1
  fi

  kill "$DEV_PID" 2>/dev/null || true
  wait "$DEV_PID" 2>/dev/null || true
  echo ""
fi

# ── Summary ───────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "  ${GREEN}${PASS_COUNT} passed${NC}  ${YELLOW}${WARN_COUNT} warned${NC}  ${SKIP_COUNT} skipped  ${RED}${FAIL_COUNT} failed${NC}"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}VALIDATION GATE: PASS${NC}"
  write_validation_record "PASS"
else
  echo -e "  ${RED}VALIDATION GATE: FAIL${NC}"
  write_validation_record "FAIL"
fi
echo -e "${CYAN}═══════════════════════════════════════${NC}"

exit "$FAIL_COUNT"
