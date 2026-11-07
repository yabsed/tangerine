#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "$(dirname "$0")/.."
target="ubuntu@${SSH_HOST:?}"

# Runner credentials exist only in this private directory.
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

printf '%s\n' "${SSH_PRIVATE_KEY:?}" > "$work/key"
printf '%s\n' "${SSH_KNOWN_HOSTS:?}" > "$work/known_hosts"
printf '%s\n' "${PRODUCTION_ENV:?}" > "$work/production.env"
printf 'S3_IMAGE_BUCKET=%s\n' "${S3_IMAGE_BUCKET:?}" >> "$work/production.env"

ssh_options=(
    -i "$work/key"
    -o "UserKnownHostsFile=$work/known_hosts"
    -o StrictHostKeyChecking=yes
    -o IdentitiesOnly=yes
    -o BatchMode=yes
)

# Deliver configuration; replace the environment file atomically.
scp "${ssh_options[@]}" \
    infra/compose.yaml infra/Caddyfile infra/deploy.sh infra/backup.sh \
    "$target:/opt/dangeun/"

scp "${ssh_options[@]}" "$work/production.env" "$target:/opt/dangeun/.env.next"
ssh "${ssh_options[@]}" "$target" \
    'chmod 600 /opt/dangeun/.env.next && mv /opt/dangeun/.env.next /opt/dangeun/.env'

# Registry authentication travels on stdin, never in command arguments.
printf '%s' "${GHCR_TOKEN:?}" | ssh "${ssh_options[@]}" "$target" \
    "bash /opt/dangeun/deploy.sh '${IMAGE:?}' '${GITHUB_ACTOR:?}'"
