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
  --dev           Run the Vite dev server (local development).
  --prod          Build and run the production server (default).
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

if [[ -z "${GEMINI_API_KEY:-}" && ! -f ".env.local" ]]; then
  echo "Warning: GEMINI_API_KEY not set and .env.local not found."
  echo "AI analysis will be disabled until a key is configured."
fi

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ "$MODE" == "dev" ]]; then
  echo "Starting Vite dev server..."
  DEV_URL="http://localhost:5173"
  (sleep 1; open_url "$DEV_URL") &
  npm run dev
  exit 0
fi

echo "Building production bundle..."
npm run build

if [[ "$BUILD_ONLY" -eq 1 ]]; then
  echo "Build complete."
  exit 0
fi

echo "Starting production server..."
PORT="${PORT:-8000}"
kill_listeners_on_port "$PORT"
PROD_URL="http://localhost:${PORT}"
(sleep 1; open_url "$PROD_URL") &
npm run start
