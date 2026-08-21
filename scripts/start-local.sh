#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  printf 'Missing required project configuration: %s/.env\n' "$(pwd)" >&2
  printf 'Create it first: cp .env.example .env\n' >&2
  printf 'Also create browser configuration: cp frontend/.env.example frontend/.env\n' >&2
  exit 1
fi

POSTGRES_HOST_PORT="$(awk -F= '/^POSTGRES_HOST_PORT=/{print $2; exit}' .env || true)"
POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-5432}"

if command -v lsof >/dev/null 2>&1; then
  non_docker_listener="$(lsof -nP -iTCP:"$POSTGRES_HOST_PORT" -sTCP:LISTEN 2>/dev/null | grep -v 'com.docke' || true)"
  if [[ -n "$non_docker_listener" ]]; then
    printf 'Host port %s is already used by a non-Docker process:\n%s\n' "$POSTGRES_HOST_PORT" "$non_docker_listener" >&2
    printf 'Do not start the portal on this host port. On macOS, run: lsof -nP -iTCP:%s -sTCP:LISTEN\n' "$POSTGRES_HOST_PORT" >&2
    printf 'Then choose an unused port such as 5433, add POSTGRES_HOST_PORT=5433 to .env, and set DATABASE_URL to use 127.0.0.1:5433.\n' >&2
    exit 1
  fi
fi

docker compose --env-file .env -f infra/docker-compose.yml up -d

for attempt in {1..30}; do
  postgres_health="$(docker inspect -f '{{.State.Health.Status}}' course-training-portal-postgres 2>/dev/null || true)"
  mailpit_health="$(docker inspect -f '{{.State.Health.Status}}' course-training-portal-mailpit 2>/dev/null || true)"
  if [[ "$postgres_health" == 'healthy' && "$mailpit_health" == 'healthy' ]]; then
    printf 'Infrastructure is healthy. PostgreSQL host port: %s; Mailpit inbox: http://localhost:8025\n' "$POSTGRES_HOST_PORT"
    printf 'Start API, frontend, and worker in separate terminals as described in the manual.\n'
    exit 0
  fi
  sleep 2
done

printf 'Infrastructure containers started but did not become healthy within 60 seconds. Run: docker ps\n' >&2
exit 1
