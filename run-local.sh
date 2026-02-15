#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="8080"
HOT_RELOAD="1"

usage() {
  echo "Usage: ./run-local.sh [port] [--hot|--no-hot]"
  echo
  echo "Starts a local static server for this site."
  echo "Hot reload is enabled by default."
  echo
  echo "Options:"
  echo "  [port]        Port number (default: 8080)"
  echo "  --hot         Enable hot reload mode"
  echo "  --no-hot      Run plain static server without hot reload"
  echo "  -h, --help    Show this help message"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --hot)
      HOT_RELOAD="1"
      shift
      ;;
    --no-hot)
      HOT_RELOAD="0"
      shift
      ;;
    --port)
      if [[ $# -lt 2 ]]; then
        echo "Error: --port requires a value." >&2
        exit 1
      fi
      PORT="$2"
      shift 2
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        PORT="$1"
        shift
      else
        echo "Error: unknown argument '$1'" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  echo "Error: port must be a number." >&2
  exit 1
fi

if (( PORT < 1 || PORT > 65535 )); then
  echo "Error: port must be between 1 and 65535." >&2
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Error: python3 (or python) is required to run the local server." >&2
  exit 1
fi

cd "$SCRIPT_DIR"

if [[ "$HOT_RELOAD" == "1" ]]; then
  echo "Serving $SCRIPT_DIR at http://localhost:$PORT (hot reload enabled)"
  exec "$PYTHON_BIN" "$SCRIPT_DIR/scripts/dev_server.py" --root "$SCRIPT_DIR" --port "$PORT"
fi

echo "Serving $SCRIPT_DIR at http://localhost:$PORT"
exec "$PYTHON_BIN" -m http.server "$PORT"
