#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "$(dirname "$0")"
exec 9>.deploy.lock
flock 9

export API_IMAGE="${1:?Pass the image digest}"
registry_user="${2:?Pass the GitHub actor}"

# The registry token arrives on stdin and lives only for this pull.
export DOCKER_CONFIG
DOCKER_CONFIG=$(mktemp -d)
trap 'rm -rf "$DOCKER_CONFIG"' EXIT
docker login ghcr.io --username "$registry_user" --password-stdin >/dev/null 2>&1
docker compose pull api
rm -rf "$DOCKER_CONFIG"

docker compose up -d --wait db

# Stop writes while database migrations run.
docker compose stop api
if ! docker compose run --rm --no-deps api alembic upgrade head; then
    docker compose start api
    exit 1
fi

docker compose exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot tangerine_exhibit' < init.sql

docker compose up -d --no-deps --wait api
docker compose up -d --no-recreate caddy
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

if [ -f current-image ]; then
    cp current-image previous-image
fi

printf '%s\n' "$API_IMAGE" > current-image
docker compose ps
