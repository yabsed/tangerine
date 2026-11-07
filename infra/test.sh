#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../server"

# Test the API contract, then migrate the CI database.
python -m unittest discover -s tests
alembic upgrade head

# Start the API against the normal CI database.
api_log=$(mktemp)
python -m uvicorn carrot.main:app --host 127.0.0.1 --no-access-log > "$api_log" 2>&1 &
api_pid=$!

cleanup() {
    kill "$api_pid" 2>/dev/null || true
    rm -f "$api_log"
}
trap cleanup EXIT

# Check the same HTTP and WebSocket behavior as production.
curl --fail --silent --show-error --output /dev/null \
    --retry 20 --retry-connrefused --retry-delay 2 \
    http://127.0.0.1:8000/api/health

if ! python ../infra/smoke.py http://127.0.0.1:8000 https://yabsed.github.io; then
    awk '
        /^  File / { print }
        /^[a-zA-Z_][a-zA-Z0-9_.]*Error:/ {
            sub(/:.*/, ": details omitted")
            print
        }
    ' "$api_log"
    exit 1
fi
