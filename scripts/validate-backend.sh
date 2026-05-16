#!/usr/bin/env bash
# Validate the FastAPI/Databricks backend without touching frontend surfaces.
#
# Default gate:
#   bash scripts/validate-backend.sh
#
# Optional live Databricks gate, only after selecting/approving a non-production
# token/profile and exporting the Databricks SQL connector environment:
#   ALLOW_LIVE_DATABRICKS_TESTS=1 bash scripts/validate-backend.sh --live-databricks

set -euo pipefail

RUN_LIVE_DATABRICKS=false

usage() {
  cat <<'USAGE'
Usage:
  bash scripts/validate-backend.sh
  ALLOW_LIVE_DATABRICKS_TESTS=1 bash scripts/validate-backend.sh --live-databricks

Runs:
  1. python -m pytest backend/tests -m "not integration"
  2. Optional live Databricks integration tests when --live-databricks and
     ALLOW_LIVE_DATABRICKS_TESTS=1 are both provided.

Live Databricks tests require non-production approval plus:
  - DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HOST, or DATABRICKS_WORKSPACE_URL
  - DATABRICKS_HTTP_PATH or DATABRICKS_WAREHOUSE_ID
  - DATABRICKS_TOKEN or DATABRICKS_ACCESS_TOKEN
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --live-databricks)
      RUN_LIVE_DATABRICKS=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[validate-backend] Unknown argument: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_backend_env.sh"

PYTHON_BIN="${PYTHON_BIN:-python}"
cd "$BACKEND_ENV_ROOT"

echo "[validate-backend] Running local backend tests (Databricks integration excluded) ..."
"$PYTHON_BIN" -m pytest backend/tests -m "not integration"

if [ "$RUN_LIVE_DATABRICKS" != true ]; then
  echo "[validate-backend] SKIP live Databricks integration tests (--live-databricks not provided)."
  echo "[validate-backend] Use only after selecting/approving a non-production Databricks token/profile."
  exit 0
fi

if [[ "${ALLOW_LIVE_DATABRICKS_TESTS:-}" != "1" && "${ALLOW_LIVE_DATABRICKS_TESTS:-}" != "true" ]]; then
  echo "[validate-backend] SKIP live Databricks integration tests."
  echo "[validate-backend] Set ALLOW_LIVE_DATABRICKS_TESTS=1 only after confirming the configured token/profile is non-production and approved."
  exit 0
fi

hostname="${DATABRICKS_SERVER_HOSTNAME:-${DATABRICKS_HOST:-${DATABRICKS_WORKSPACE_URL:-}}}"
http_path="${DATABRICKS_HTTP_PATH:-}"
warehouse_id="${DATABRICKS_WAREHOUSE_ID:-}"
token="${DATABRICKS_TOKEN:-${DATABRICKS_ACCESS_TOKEN:-}}"

missing=()
if [ -z "$hostname" ]; then
  missing+=("DATABRICKS_SERVER_HOSTNAME/DATABRICKS_HOST/DATABRICKS_WORKSPACE_URL")
fi
if [ -z "$http_path" ] && [ -z "$warehouse_id" ]; then
  missing+=("DATABRICKS_HTTP_PATH/DATABRICKS_WAREHOUSE_ID")
fi
if [ -z "$token" ]; then
  missing+=("DATABRICKS_TOKEN/DATABRICKS_ACCESS_TOKEN")
fi

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[validate-backend] SKIP live Databricks integration tests; missing required environment:"
  for name in "${missing[@]}"; do
    echo "  - $name"
  done
  exit 0
fi

echo "[validate-backend] Running live Databricks integration tests ..."
"$PYTHON_BIN" -m pytest backend/tests/test_databricks_integration.py -m integration
