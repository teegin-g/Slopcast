# Shared env + venv activation for local FastAPI (sourced by dev-backend.sh and start-backend.sh).
# Do not run directly.

load_env_file() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

BACKEND_ENV_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$BACKEND_ENV_ROOT/.venv"

if [ -d "$VENV_DIR" ]; then
  # shellcheck disable=SC1090,SC1091
  source "$VENV_DIR/bin/activate"
fi

load_env_file "$BACKEND_ENV_ROOT/.env.local"
load_env_file "$BACKEND_ENV_ROOT/.env.backend.local"

export BACKEND_ENV_ROOT
