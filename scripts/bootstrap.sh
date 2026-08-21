# Script name: bootstrap.sh
# Original location: scripts/bootstrap.sh
# What this script is: A small Bash initializer that creates a project skeleton directory tree and safe starter files for a course/training portal repository.
# What it is used for: Quickly create an empty, well-structured repository layout (backend, frontend, infra, tests, docs, scripts) to begin development or testing.
# Programming language: Bash (POSIX-style shell with Bashisms)
# Inputs: optional first command-line argument containing the project directory name (default: course-training-portal)
# Outputs: a complete empty directory tree plus safe starter files (README.md, .gitignore, .env.example)
# Where output is saved or sent: filesystem path (the newly created project directory and its files)
# Technologies and services used or interacted with: bash shell, coreutils (mkdir, touch, printf, find, sort)
# Downstream scripts/files/processes that consume the output: CI scripts, build tooling, local development scripts, repository scaffolding and other team members who clone/use the created layout
# Risks and safe change note: This script creates directories and files non-destructively (uses mkdir -p and touch). Be cautious when modifying path lists or adding destructive operations; changing directory names may break downstream scripts that rely on exact paths. Use small, reviewed updates and test on a disposable path before running against important locations.
# created by: Sadeq Obaid
#!/usr/bin/env bash
# Input: optional first command-line argument containing the project directory name.
# Output: a complete empty directory tree plus safe starter files.
# Ensure the script exits on any error, treats unset variables as errors, and fails on pipeline errors.
set -euo pipefail

# Determine the target project directory name from the first argument, or use the default.
PROJECT_DIR="${1:-course-training-portal}"

# Create the complete directory tree for backend, frontend, infra, scripts, docs and test folders.
# This single mkdir command uses -p to create parent directories as needed and includes many continuation lines
# that are part of the same command; do not insert comments between these continued lines.
mkdir -p \
  "$PROJECT_DIR"/backend/src/auth \
  "$PROJECT_DIR"/backend/src/common \
  "$PROJECT_DIR"/backend/src/config \
  "$PROJECT_DIR"/backend/src/courses \
  "$PROJECT_DIR"/backend/src/database \
  "$PROJECT_DIR"/backend/src/enrollments \
  "$PROJECT_DIR"/backend/src/health \
  "$PROJECT_DIR"/backend/src/notifications \
  "$PROJECT_DIR"/backend/src/progress \
  "$PROJECT_DIR"/backend/src/assessments \
  "$PROJECT_DIR"/backend/src/certificates \
  "$PROJECT_DIR"/backend/src/reports \
  "$PROJECT_DIR"/backend/src/automation \
  "$PROJECT_DIR"/backend/database \
  "$PROJECT_DIR"/backend/scripts \
  "$PROJECT_DIR"/backend/tests/api \
  "$PROJECT_DIR"/backend/tests/e2e \
  "$PROJECT_DIR"/backend/tests/integration \
  "$PROJECT_DIR"/backend/tests/unit \
  "$PROJECT_DIR"/frontend/src/api \
  "$PROJECT_DIR"/frontend/src/auth \
  "$PROJECT_DIR"/frontend/src/components \
  "$PROJECT_DIR"/frontend/src/pages \
  "$PROJECT_DIR"/frontend/src/types \
  "$PROJECT_DIR"/infra \
  "$PROJECT_DIR"/scripts \
  "$PROJECT_DIR"/docs
# Create safe starter files if they don't exist: .gitignore, example env file, and README.
touch "$PROJECT_DIR/.gitignore" "$PROJECT_DIR/.env.example" "$PROJECT_DIR/README.md"

# Print a concise success message indicating where the project structure was created.
printf 'Created project structure in: %s\n' "$PROJECT_DIR"
# List the created directories up to a depth of 3, sort for readability; useful to verify structure quickly.
find "$PROJECT_DIR" -maxdepth 3 -type d | sort
