#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../server"

# Rebuild the exhibition database from the original migration chain.
alembic upgrade head
MYSQL_PWD="$DB_PASSWORD" mysql --protocol=TCP \
    -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_DATABASE" < ../infra/init.sql

# Start the API against the normal CI database.
api_log=$(mktemp)
python -m uvicorn carrot.main:app --host 127.0.0.1 --no-access-log > "$api_log" 2>&1 &
api_pid=$!

cleanup() {
    kill "$api_pid" 2>/dev/null || true
    rm -f "$api_log"
}
trap cleanup EXIT

# Check the original HTTP login, products, auctions, and polling chat.
curl --fail --silent --show-error --output /dev/null \
    --retry 20 --retry-connrefused --retry-delay 2 \
    http://127.0.0.1:8000/

if ! python ../infra/smoke.py http://127.0.0.1:8000 https://yabsed.github.io --ci; then
    awk '
        /^  File / { print }
        /^[a-zA-Z_][a-zA-Z0-9_.]*Error:/ {
            sub(/:.*/, ": details omitted")
            print
        }
    ' "$api_log"
    exit 1
fi
