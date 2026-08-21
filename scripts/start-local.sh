# Script name: start-local.sh
# Original location: scripts/start-local.sh
# What this script is: A helper shell script to start local infrastructure dependencies (PostgreSQL, Mailpit) for development using Docker Compose.
# What it is used for: Brings up required containers, checks port availability, waits for container health, and instructs developer to start services.
# Programming language: Bash
# Inputs: .env file in project root, infra/docker-compose.yml, system tools (docker, docker compose, awk, lsof optionally)
# Outputs: Console messages (stdout/stderr)
# Where output is saved or sent: console
# Technologies and services used or interacted with: Docker Compose, Docker Engine, PostgreSQL container, Mailpit container, lsof, awk, shell utilities
# Downstream scripts/files/processes that consume the output: API, frontend, and worker processes started manually by developer; docker containers (postgres, mailpit)
# Risks and safe change note: Modifying behavior can affect local development environment startup and port configuration; avoid changing defaults without testing; preserves exit codes and side effects to Docker.
# created by: Sadeq Obaid
# Shebang: specifies interpreter for the script (bash); preserved exactly to maintain original execution environment.
#!/usr/bin/env bash
# Enable strict mode: exit on error, unset variables are errors, and propagate errors through pipelines.
set -euo pipefail

# Check if the required .env file exists in the current working directory; if not, print instructions and exit non-zero.
if [[ ! -f .env ]]; then
  # Print an error message indicating the missing .env file and show the current working directory; send to stderr.
  printf 'Missing required project configuration: %s/.env\n' "$(pwd)" >&2
  # Inform the user how to create the .env file from the example; sent to stderr.
  printf 'Create it first: cp .env.example .env\n' >&2
  # Inform the user to create frontend browser config from example; sent to stderr.
  printf 'Also create browser configuration: cp frontend/.env.example frontend/.env\n' >&2
  # Exit with failure status because required configuration is missing.
  exit 1
fi

# Read POSTGRES_HOST_PORT from .env using awk; fall back to empty if not found (|| true prevents non-zero exit).
POSTGRES_HOST_PORT="$(awk -F= '/^POSTGRES_HOST_PORT=/{print $2; exit}' .env || true)"
# Default POSTGRES_HOST_PORT to 5432 if it was not set in .env.
POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-5432}"

# If lsof is available on the host, use it to detect any non-Docker process listening on the desired PostgreSQL host port.
if command -v lsof >/dev/null 2>&1; then
  # Use lsof to list listeners on the target TCP port, filter out typical Docker processes, and capture output (or empty on error).
  non_docker_listener="$(lsof -nP -iTCP:"$POSTGRES_HOST_PORT" -sTCP:LISTEN 2>/dev/null | grep -v 'com.docke' || true)"
  # If any non-Docker process is found listening on that port, warn the user and exit to avoid port conflict.
  if [[ -n "$non_docker_listener" ]]; then
    # Print a message explaining that the host port is already used and show the lsof output; send to stderr.
    printf 'Host port %s is already used by a non-Docker process:\n%s\n' "$POSTGRES_HOST_PORT" "$non_docker_listener" >&2
    # Suggest a diagnostic lsof command for macOS to help the user identify the process; send to stderr.
    printf 'Do not start the portal on this host port. On macOS, run: lsof -nP -iTCP:%s -sTCP:LISTEN\n' "$POSTGRES_HOST_PORT" >&2
    # Provide remediation steps: choose a different port, update .env, and adjust DATABASE_URL to use 127.0.0.1 with the new port; send to stderr.
    printf 'Then choose an unused port such as 5433, add POSTGRES_HOST_PORT=5433 to .env, and set DATABASE_URL to use 127.0.0.1:5433.\n' >&2
    # Exit with failure to avoid starting Docker Compose with a conflicting host port.
    exit 1
  fi
fi

# Start the Docker Compose infrastructure in detached mode using the project's .env and the infra/docker-compose.yml file.
docker compose --env-file .env -f infra/docker-compose.yml up -d

# Loop up to 30 attempts, checking health of the postgres and mailpit containers, waiting for them to become healthy.
for attempt in {1..30}; do
  # Query Docker for the health status of the postgres container; silence errors and default to empty string if inspect fails.
  postgres_health="$(docker inspect -f '{{.State.Health.Status}}' course-training-portal-postgres 2>/dev/null || true)"
  # Query Docker for the health status of the mailpit container; silence errors and default to empty string if inspect fails.
  mailpit_health="$(docker inspect -f '{{.State.Health.Status}}' course-training-portal-mailpit 2>/dev/null || true)"
  # If both containers report 'healthy', print success messages and exit zero to indicate ready state.
  if [[ "$postgres_health" == 'healthy' && "$mailpit_health" == 'healthy' ]]; then
    # Inform the user that infrastructure is healthy and show the PostgreSQL host port and Mailpit inbox URL.
    printf 'Infrastructure is healthy. PostgreSQL host port: %s; Mailpit inbox: http://localhost:8025\n' "$POSTGRES_HOST_PORT"
    # Remind the user to start API, frontend, and worker processes separately as per project manual.
    printf 'Start API, frontend, and worker in separate terminals as described in the manual.\n'
    # Exit successfully to indicate completion.
    exit 0
  fi
  # Wait 2 seconds before the next health check attempt to allow containers to initialize.
  sleep 2
done

# After all attempts, if containers did not become healthy in time, print a diagnostic message to stderr and exit with failure.
printf 'Infrastructure containers started but did not become healthy within 60 seconds. Run: docker ps\n' >&2
exit 1
