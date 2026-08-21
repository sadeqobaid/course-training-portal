# Script name: bootstrap.ps1
# Original location: scripts/bootstrap.ps1
# What this script is: A PowerShell bootstrap script that creates a starter project directory tree and placeholder files.
# What it is used for: Initializes an empty project structure with common backend/frontend/infra/docs folders and basic starter files.
# Programming language: PowerShell
# Inputs: Optional first PowerShell argument specifying the project directory name (defaults to "course-training-portal").
# Outputs: Created directory tree and empty starter files (filesystem entities).
# Where output is saved or sent: filesystem path (the project directory on the local filesystem)
# Technologies and services used or interacted with: PowerShell, local filesystem (file and directory creation)
# Downstream scripts/files/processes that consume the output: repository build/test/deploy scripts, CI pipelines, developer workflows that expect this project layout
# Risks and safe change note: This script uses -Force when creating items and may overwrite or modify existing files/directories without prompt; run in a safe/non-production location, review paths before running, and back up existing data if necessary.
# created by: Sadeq Obaid

# Input: optional first PowerShell argument containing the project directory name.
# Output: a complete empty directory tree plus safe starter files.
# Start a parameter block to define script inputs accepted from the command line or caller.
param(
# Define the ProjectDirectory parameter as a string and provide a default value used when no argument is supplied.
  [string]$ProjectDirectory = "course-training-portal"
# End of the parameter block; closes the param(...) statement.
)

# Initialize an array variable $directories that will contain all relative directory paths to create under the project root.
$directories = @(
# Add backend authentication source directory to the list of directories to create.
  "backend/src/auth", "backend/src/common", "backend/src/config",
# Add backend courses, database and enrollments related directories.
  "backend/src/courses", "backend/src/database", "backend/src/enrollments",
# Add backend health, notifications and progress related directories.
  "backend/src/health", "backend/src/notifications", "backend/src/progress",
# Add backend assessments, certificates and reports directories.
  "backend/src/assessments", "backend/src/certificates", "backend/src/reports",
# Add backend automation and top-level backend database/scripts directories.
  "backend/src/automation", "backend/database", "backend/scripts",
# Add backend test directories for API, end-to-end and integration tests.
  "backend/tests/api", "backend/tests/e2e", "backend/tests/integration",
# Add unit test directory and a frontend API directory.
  "backend/tests/unit", "frontend/src/api",
# Add frontend auth, components and pages directories.
  "frontend/src/auth", "frontend/src/components", "frontend/src/pages",
# Add frontend types and other top-level infra/scripts/docs directories.
  "frontend/src/types", "infra", "scripts", "docs"
# Close the array literal for $directories.
)

# Iterate over each directory path stored in $directories to create them on disk under the project root.
foreach ($directory in $directories) {
# Compute the full path by joining the base ProjectDirectory with the relative directory path from the list.
  $directoryPath = Join-Path $ProjectDirectory $directory
# Create the directory (and any missing parent directories) on the filesystem; use -Force to avoid errors if it already exists and suppress the cmdlet output.
  New-Item -ItemType Directory -Force -Path $directoryPath | Out-Null
# End of the foreach loop that creates directories.
}

# Iterate over a small list of starter filenames to create empty placeholder files in the project root.
foreach ($file in @(".gitignore", ".env.example", "README.md")) {
# Compute the full file path by joining the project root with the filename.
  $filePath = Join-Path $ProjectDirectory $file
# Create or overwrite the file at the computed path and suppress output; -Force allows creation even if the file exists.
  New-Item -ItemType File -Force -Path $filePath | Out-Null
# End of the foreach loop that creates files.
}

# Output a message to the console stating where the project structure was created; this is a side-effect visible to the user/session.
Write-Host "Created project structure in: $ProjectDirectory"
# List all directories under the project path recursively and output their full paths (used to confirm what was created).
Get-ChildItem -Path $ProjectDirectory -Directory -Recurse | Select-Object FullName
