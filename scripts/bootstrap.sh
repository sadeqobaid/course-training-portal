#!/usr/bin/env bash
# Input: optional first command-line argument containing the project directory name.
# Output: a complete empty directory tree plus safe starter files.
set -euo pipefail

PROJECT_DIR="${1:-course-training-portal}"

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
touch "$PROJECT_DIR/.gitignore" "$PROJECT_DIR/.env.example" "$PROJECT_DIR/README.md"

printf 'Created project structure in: %s\n' "$PROJECT_DIR"
find "$PROJECT_DIR" -maxdepth 3 -type d | sort
