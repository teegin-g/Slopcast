#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MODE="prod"
BUILD_ONLY=0
SKIP_INSTALL=0

kill_listeners_on_port() {
  local port="$1"

  if [[ -z "$port" ]]; then
    return 0
  fi

  if ! command -v lsof >/dev/null 2>&1; then
    echo "Warning: lsof not found; can't free port $port automatically."
    return 0
  fi

  local pids=""
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | sort -u || true)"

  if [[ -z "$pids" ]]; then
    return 0
  fi

  echo "Port $port is in use. Terminating listener process(es): $pids"
  # shellcheck disable=SC2086
  kill -TERM $pids 2>/dev/null || true

  local still=""
  for _ in {1..20}; do
    sleep 0.1
    still="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | sort -u || true)"
    [[ -z "$still" ]] && break
  done

  if [[ -n "$still" ]]; then
    echo "Port $port still busy. Forcing termination: $still"
    # shellcheck disable=SC2086
    kill -KILL $still 2>/dev/null || true
  fi
}

load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

# Block until FastAPI answers /api/health (Node proxies /api to this port).
wait_for_backend_health() {
  local port="$1"
  local attempts=50
  local i=0
  if ! command -v curl >/dev/null 2>&1; then
    echo "Warning: curl not found; sleeping 2s before starting Node (ensure FastAPI is listening on port ${port})."
    sleep 2
    return 0
  fi
  while (( i < attempts )); do
    if curl -sf "http://127.0.0.1:${port}/api/health" >/dev/null; then
      echo "FastAPI backend is healthy on port ${port}."
      return 0
    fi
    sleep 0.15
    ((i += 1)) || true
  done
  echo "Error: FastAPI did not become healthy at http://127.0.0.1:${port}/api/health"
  return 1
}

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url"
  else
    echo "Open this URL in your browser: $url"
  fi
}

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [--dev|--prod] [--build-only] [--skip-install]

Options:
  --dev           Run Vite + FastAPI together (npm run dev:full); map /api uses port 3000.
  --prod          Build and run Node static server + FastAPI on PYTHON_API_PORT (default 8001).
  --build-only    Only build the production bundle, do not start the server.
  --skip-install  Skip npm install.
  --help          Show this help text.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      MODE="dev"
      shift
      ;;
    --prod)
      MODE="prod"
      shift
      ;;
    --build-only)
      BUILD_ONLY=1
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Please install it first."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Please install it first."
  exit 1
fi

if [[ -z "${GEMINI_API_KEY:-}" && ! -f ".env" && ! -f ".env.local" ]]; then
  echo "Warning: GEMINI_API_KEY not set and no .env file found."
  echo "AI analysis will be disabled until a key is configured."
fi

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ "$MODE" == "dev" ]]; then
  echo "Starting Vite + FastAPI (dev:full)..."
  DEV_URL="http://localhost:3000"
  (sleep 2; open_url "$DEV_URL") &
  npm run dev:full
  exit 0
fi

echo "Building production bundle..."
npm run build

if [[ "$BUILD_ONLY" -eq 1 ]]; then
  echo "Build complete."
  exit 0
fi

echo "Starting production servers (Node + FastAPI)..."
PORT="${PORT:-8000}"
PYTHON_API_PORT="${PYTHON_API_PORT:-8001}"
export PORT PYTHON_API_PORT

kill_listeners_on_port "$PYTHON_API_PORT"
kill_listeners_on_port "$PORT"

load_env_file "$ROOT_DIR/.env"
load_env_file "$ROOT_DIR/.env.local"
load_env_file "$ROOT_DIR/.env.backend.local"

if [[ -f "$ROOT_DIR/.venv/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.venv/bin/activate"
elif [[ -d "$ROOT_DIR/.venv" ]]; then
  echo "Warning: $ROOT_DIR/.venv exists but is incomplete (missing bin/activate)."
  echo "Recreate it with: rm -rf .venv && python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt"
fi

if ! command -v python >/dev/null 2>&1; then
  echo "Error: Python is required for the FastAPI backend (Node proxies /api to 127.0.0.1:${PYTHON_API_PORT})."
  echo "Use a project .venv with backend deps installed, or put python on PATH."
  exit 1
fi

if ! python -c "import uvicorn" 2>/dev/null; then
  echo "Error: uvicorn is missing for the active Python. Install backend dependencies, e.g.:"
  echo "  source .venv/bin/activate && pip install -r backend/requirements.txt"
  exit 1
fi

BACKEND_PID=""
cleanup_backend() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping FastAPI (pid ${BACKEND_PID}) ..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    local j=0
    while (( j < 40 )); do
      kill -0 "$BACKEND_PID" 2>/dev/null || break
      sleep 0.1
      ((j += 1)) || true
    done
    kill -KILL "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup_backend EXIT INT TERM

echo "Starting FastAPI (uvicorn, no --reload) on 127.0.0.1:${PYTHON_API_PORT} ..."
cd "$ROOT_DIR"
python -m uvicorn backend.main:app --host 127.0.0.1 --port "$PYTHON_API_PORT" &
BACKEND_PID=$!

if ! wait_for_backend_health "$PYTHON_API_PORT"; then
  exit 1
fi

PROD_URL="http://localhost:${PORT}"
(sleep 1; open_url "$PROD_URL") &
npm run start
