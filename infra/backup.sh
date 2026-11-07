#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "$(dirname "$0")"
exec 9>.deploy.lock
flock 9
export API_IMAGE
API_IMAGE=$(cat current-image)

# Upload only after mysqldump completes; remove the private temporary file on exit.
backup=$(mktemp)
trap 'rm -f "$backup"' EXIT

docker compose exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --no-tablespaces tangerine_exhibit' \
    | gzip > "$backup"

docker compose run --rm -T --no-deps api python infra/backup.py < "$backup"
