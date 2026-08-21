# Script name: start-local.ps1
# Original location: scripts/start-local.ps1
# What this script is: A small PowerShell orchestrator that starts local infrastructure containers and verifies their health.
# What it is used for: Brings up infrastructure via Docker Compose, polls health status of Postgres and Mailpit, and instructs the developer to start application services.
# Programming language: PowerShell
# Inputs: .env file in repository root, Docker daemon accessible, infra/docker-compose.yml
# Outputs: Console messages and process exit code; starts Docker containers (infrastructure services).
# Where output is saved or sent: console; Docker service (containers are started). 
# Technologies and services used or interacted with: Docker, Docker Compose, Postgres container, Mailpit container, PowerShell runtime.
# Downstream scripts/files/processes that consume the output: Developer-run API/frontend/worker startup procedures (manual); docker ps for diagnostics.
# Risks and safe change note: Modifying container names, health-check queries, retry counts, or exit codes can break local setup and dependant scripts; test changes locally and ensure compatibility with infra/docker-compose.yml and any automation or documentation referencing these container names.
# created by: Sadeq Obaid

# Check whether a .env file exists in the current working directory; if not, run the error path inside the if-block.
if (-not (Test-Path .env)) {
  # Print an error indicating the required .env is missing, showing the full current path for clarity.
  Write-Error "Missing required project configuration: $((Get-Location).Path)\.env"
  # Suggest the exact command the user should run to create .env from the example; purely informational output to the console.
  Write-Host "Create it first: Copy-Item .env.example .env"
  # Provide an additional hint to create the frontend browser configuration file from its example.
  Write-Host "Also create browser configuration: Copy-Item frontend/.env.example frontend/.env"
  # Exit with a non-zero status to indicate failure; this stops further script execution.
  exit 1
}
# Start infrastructure containers defined in infra/docker-compose.yml using variables from .env, running in detached mode.
docker compose --env-file .env -f infra/docker-compose.yml up -d
# Begin a loop that will attempt health checks up to 30 times; $attempt increments each iteration.
for ($attempt = 1; $attempt -le 30; $attempt++) {
  # Query the Postgres container's health status via docker inspect; suppress stderr to avoid noisy output when container does not exist yet.
  $postgresHealth = docker inspect -f '{{.State.Health.Status}}' course-training-portal-postgres 2>$null
  # Query the Mailpit container's health status with the same mechanism; also suppress stderr.
  $mailpitHealth = docker inspect -f '{{.State.Health.Status}}' course-training-portal-mailpit 2>$null
  # If both containers report 'healthy', consider the infrastructure ready and notify the user.
  if ($postgresHealth -eq 'healthy' -and $mailpitHealth -eq 'healthy') {
    # Inform the user that the infrastructure is healthy and remind them to start the API, frontend, and worker in separate terminals.
    Write-Host 'Infrastructure is healthy. Start API, frontend, and worker in separate terminals as described in the manual.'
    # Exit with a zero status to indicate success.
    exit 0
  }
  # End of the health-check if-block.
  # Wait 2 seconds before the next attempt to allow containers time to initialize and for health checks to change.
  Start-Sleep -Seconds 2
}
# End of the for-loop after exhausting all attempts without seeing healthy statuses.
# Report an error that containers did not become healthy within the expected timeframe and suggest using docker ps for investigation.
Write-Error 'Infrastructure containers started but did not become healthy within 60 seconds. Run: docker ps'
# Exit with a non-zero status to indicate the overall operation failed.
exit 1
