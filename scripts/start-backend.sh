#!/usr/bin/env bash
# Start the Python FastAPI backend alongside the Vite dev server.
# Usage: ./scripts/start-backend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_backend_env.sh"
PROJECT_ROOT="$BACKEND_ENV_ROOT"
PORT="${PYTHON_API_PORT:-8001}"

echo "[start-backend] Starting FastAPI on port $PORT ..."
cd "$PROJECT_ROOT"
python -m uvicorn backend.main:app --host 127.0.0.1 --port "$PORT" --reload &
BACKEND_PID=$!

echo "[start-backend] Starting Vite dev server ..."
npm run dev &
VITE_PID=$!

cleanup() {
  echo "[start-backend] Shutting down ..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $VITE_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
