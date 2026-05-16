#!/usr/bin/env bash
# Start only the Python FastAPI backend (port 8001 by default).
# Vite must run separately: npm run dev
# Databricks "Live" wells also need credentials in .env.local or .env.backend.local
# (DATABRICKS_SERVER_HOSTNAME or DATABRICKS_HOST, DATABRICKS_HTTP_PATH or DATABRICKS_WAREHOUSE_ID, DATABRICKS_TOKEN).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_backend_env.sh"

PORT="${PYTHON_API_PORT:-8001}"
cd "$BACKEND_ENV_ROOT"

echo "[dev-backend] FastAPI → http://127.0.0.1:$PORT (proxy from Vite as /api)"
exec python -m uvicorn backend.main:app --host 127.0.0.1 --port "$PORT" --reload
