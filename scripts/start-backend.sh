#!/usr/bin/env bash
# Start the Python FastAPI backend alongside the Vite dev server.
# Usage: ./scripts/start-backend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$PROJECT_ROOT/.venv"
PORT="${PYTHON_API_PORT:-8001}"

# Activate virtualenv if present
if [ -d "$VENV_DIR" ]; then
  source "$VENV_DIR/bin/activate"
fi

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
