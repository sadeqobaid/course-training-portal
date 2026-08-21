if (-not (Test-Path .env)) {
  Write-Error "Missing required project configuration: $((Get-Location).Path)\.env"
  Write-Host "Create it first: Copy-Item .env.example .env"
  Write-Host "Also create browser configuration: Copy-Item frontend/.env.example frontend/.env"
  exit 1
}

docker compose --env-file .env -f infra/docker-compose.yml up -d
for ($attempt = 1; $attempt -le 30; $attempt++) {
  $postgresHealth = docker inspect -f '{{.State.Health.Status}}' course-training-portal-postgres 2>$null
  $mailpitHealth = docker inspect -f '{{.State.Health.Status}}' course-training-portal-mailpit 2>$null
  if ($postgresHealth -eq 'healthy' -and $mailpitHealth -eq 'healthy') {
    Write-Host 'Infrastructure is healthy. Start API, frontend, and worker in separate terminals as described in the manual.'
    exit 0
  }
  Start-Sleep -Seconds 2
}

Write-Error 'Infrastructure containers started but did not become healthy within 60 seconds. Run: docker ps'
exit 1
