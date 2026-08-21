# Input: optional first PowerShell argument containing the project directory name.
# Output: a complete empty directory tree plus safe starter files.
param(
  [string]$ProjectDirectory = "course-training-portal"
)

$directories = @(
  "backend/src/auth", "backend/src/common", "backend/src/config",
  "backend/src/courses", "backend/src/database", "backend/src/enrollments",
  "backend/src/health", "backend/src/notifications", "backend/src/progress",
  "backend/src/assessments", "backend/src/certificates", "backend/src/reports",
  "backend/src/automation", "backend/database", "backend/scripts",
  "backend/tests/api", "backend/tests/e2e", "backend/tests/integration",
  "backend/tests/unit", "frontend/src/api",
  "frontend/src/auth", "frontend/src/components", "frontend/src/pages",
  "frontend/src/types", "infra", "scripts", "docs"
)

foreach ($directory in $directories) {
  $directoryPath = Join-Path $ProjectDirectory $directory
  New-Item -ItemType Directory -Force -Path $directoryPath | Out-Null
}

foreach ($file in @(".gitignore", ".env.example", "README.md")) {
  $filePath = Join-Path $ProjectDirectory $file
  New-Item -ItemType File -Force -Path $filePath | Out-Null
}

Write-Host "Created project structure in: $ProjectDirectory"
Get-ChildItem -Path $ProjectDirectory -Directory -Recurse | Select-Object FullName
