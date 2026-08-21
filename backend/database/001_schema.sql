-- Script name: 001_schema.sql
-- Original location: backend/database/001_schema.sql
-- What this script is: SQL schema definition creating types, tables, indexes, and a view for the learning management system.
-- What it is used for: Initializes or verifies required database objects (extensions, enums, tables, indexes, view) for the application.
-- Programming language: SQL (PostgreSQL dialect)
-- Inputs: None (executes against an active PostgreSQL database connection)
-- Outputs: Database schema changes (types, tables, indexes, view) applied to the connected PostgreSQL database
-- Where output is saved or sent: database/table (PostgreSQL database)
-- Technologies and services used or interacted with: PostgreSQL, pgcrypto extension (gen_random_uuid)
-- Downstream scripts/files/processes that consume the output: application backend, migration tooling, reporting queries, API services that rely on these tables and view
-- Risks and safe change note: Running against production may modify schema; statements mostly use IF NOT EXISTS and safe checks but verify compatibility and backups before changes. Avoid altering enums or dropping columns without migration planning.
-- created by: Sadeq Obaid

-- Ensure the pgcrypto extension is available so gen_random_uuid() can be used for UUID defaults.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum type user_role if it does not already exist; wrapped in DO block to ignore duplicate_object errors.
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR', 'LEARNER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Create enum type course_status if it does not already exist; values represent lifecycle of a course.
DO $$ BEGIN CREATE TYPE course_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Create enum type enrollment_status if it does not already exist; used to track learner enrollment state.
DO $$ BEGIN CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Create enum type notification_channel if it does not already exist; specifies delivery channel for notifications.
DO $$ BEGIN CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Create enum type notification_status if it does not already exist; tracks notification lifecycle.
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create the users table with basic authentication and role information if it does not already exist.
CREATE TABLE IF NOT EXISTS users (
  -- Primary key UUID for the user; default generated using pgcrypto's gen_random_uuid()
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Email address, constrained to 320 chars per RFC and unique
  email VARCHAR(320) NOT NULL UNIQUE,
  -- Hashed password storage
  password_hash TEXT NOT NULL,
  -- User's full name
  full_name VARCHAR(200) NOT NULL,
  -- Role column using the user_role enum with default LEARNER
  role user_role NOT NULL DEFAULT 'LEARNER',
  -- Active flag to soft-disable accounts
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- Timestamps for creation and last update; use NOW() as default
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the courses table storing course metadata and settings.
CREATE TABLE IF NOT EXISTS courses (
  -- Primary key UUID for course
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Human-readable title
  title VARCHAR(200) NOT NULL,
  -- URL-friendly unique slug
  slug VARCHAR(220) NOT NULL UNIQUE,
  -- Full description stored as text
  description TEXT NOT NULL,
  -- Learning objectives stored as text
  objectives TEXT NOT NULL,
  -- Prerequisites text with empty default
  prerequisites TEXT NOT NULL DEFAULT '',
  -- Status of the course using course_status enum with default DRAFT
  status course_status NOT NULL DEFAULT 'DRAFT',
  -- Passing score for assessments in this course, constrained between 0 and 100
  passing_score_percent NUMERIC(5, 2) NOT NULL DEFAULT 70.00 CHECK (passing_score_percent >= 0 AND passing_score_percent <= 100),
  -- Reference to the creating user
  created_by UUID NOT NULL REFERENCES users(id),
  -- Optional published and archived timestamps
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  -- Auditing timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the lessons table linking to courses and enforcing ordering and publication state.
CREATE TABLE IF NOT EXISTS lessons (
  -- Primary key UUID for lesson
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Foreign key to parent course; cascade delete to remove lessons when a course is deleted
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Lesson title
  title VARCHAR(200) NOT NULL,
  -- Body content stored in Markdown
  body_markdown TEXT NOT NULL,
  -- Position/order within the course, must be positive
  position INTEGER NOT NULL CHECK (position > 0),
  -- Publication flag for the lesson
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  -- Auditing timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique position per course to maintain ordering without gaps conflicts
  UNIQUE (course_id, position)
);

-- Create enrollments table to track which learners are enrolled in which courses and their status.
CREATE TABLE IF NOT EXISTS enrollments (
  -- Primary key UUID for enrollment
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Reference to learner (user)
  learner_id UUID NOT NULL REFERENCES users(id),
  -- Reference to course
  course_id UUID NOT NULL REFERENCES courses(id),
  -- Enrollment status using enum with default ACTIVE
  status enrollment_status NOT NULL DEFAULT 'ACTIVE',
  -- Timestamp when enrollment occurred
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Optional completed timestamp
  completed_at TIMESTAMPTZ,
  -- Prevent duplicate enrollments for same learner and course
  UNIQUE (learner_id, course_id)
);

-- Create lesson_progress table tracking per-enrollment lesson completion and viewing times.
CREATE TABLE IF NOT EXISTS lesson_progress (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Foreign key to enrollment; cascade to remove progress when enrollment removed
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  -- Foreign key to lesson; cascade to remove progress when lesson removed
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  -- When the lesson was completed (nullable)
  completed_at TIMESTAMPTZ,
  -- Most recent view timestamp with default NOW()
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one progress record per enrollment/lesson combination
  UNIQUE (enrollment_id, lesson_id)
);

-- Create assessments table for course-level assessments and passing score rule.
CREATE TABLE IF NOT EXISTS assessments (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Parent course, cascade deletes assessments with the course
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Assessment title
  title VARCHAR(200) NOT NULL,
  -- Passing score for the assessment, constrained between 0 and 100
  passing_score_percent NUMERIC(5, 2) NOT NULL DEFAULT 70.00 CHECK (passing_score_percent >= 0 AND passing_score_percent <= 100),
  -- Publication flag
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  -- Created timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create assessment_questions table to store prompts and ordering for assessment questions.
CREATE TABLE IF NOT EXISTS assessment_questions (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Parent assessment; cascade to remove questions when assessment removed
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  -- Question prompt text
  prompt TEXT NOT NULL,
  -- Position within the assessment, must be positive
  position INTEGER NOT NULL CHECK (position > 0),
  -- Ensure unique position per assessment for ordering
  UNIQUE (assessment_id, position)
);

-- Create answer_options table for multiple-choice options tied to questions.
CREATE TABLE IF NOT EXISTS answer_options (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Foreign key to question; cascade deletion with question
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  -- Option text shown to learner
  option_text TEXT NOT NULL,
  -- Flag indicating whether this option is correct
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create assessment_attempts table to record each learner attempt on assessments.
CREATE TABLE IF NOT EXISTS assessment_attempts (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Associated assessment
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  -- Associated enrollment; cascade remove attempts if enrollment removed
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  -- Score achieved as percentage between 0 and 100
  score_percent NUMERIC(5, 2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  -- Whether attempt passed according to passing criteria
  passed BOOLEAN NOT NULL,
  -- When the attempt was submitted
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create certificates table mapping enrollments to issued certificates, with unique numbers and verification codes.
CREATE TABLE IF NOT EXISTS certificates (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- One-to-one link to enrollment, unique constraint ensures single certificate per enrollment
  enrollment_id UUID NOT NULL UNIQUE REFERENCES enrollments(id),
  -- Certificate number exposed externally, unique
  certificate_number VARCHAR(64) NOT NULL UNIQUE,
  -- Verification code for validating certificates, unique
  verification_code VARCHAR(64) NOT NULL UNIQUE,
  -- Issued timestamp
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table to queue and record delivery attempts to users.
CREATE TABLE IF NOT EXISTS notifications (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Recipient user reference; cascade delete to remove notifications when user removed
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Channel enum (IN_APP or EMAIL) with default IN_APP
  channel notification_channel NOT NULL DEFAULT 'IN_APP',
  -- Delivery status using notification_status enum with default PENDING
  status notification_status NOT NULL DEFAULT 'PENDING',
  -- Type of notification for application-level routing
  notification_type VARCHAR(100) NOT NULL,
  -- Optional idempotency key to prevent duplicate sends
  idempotency_key VARCHAR(250) UNIQUE,
  -- Subject line for notifications
  subject VARCHAR(250) NOT NULL,
  -- Body content for notification
  body TEXT NOT NULL,
  -- Number of send attempts, non-negative
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- Last error message captured from delivery attempts
  last_error TEXT,
  -- Timestamps: created, when sent, when read
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- Create automation_runs table to track background job idempotency and status.
CREATE TABLE IF NOT EXISTS automation_runs (
  -- Primary key UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Name of the job being run
  job_name VARCHAR(100) NOT NULL,
  -- Idempotency key to ensure job uniqueness, unique constraint
  idempotency_key VARCHAR(250) NOT NULL UNIQUE,
  -- Status constrained to specific values via CHECK
  status VARCHAR(20) NOT NULL CHECK (status IN ('STARTED', 'SUCCEEDED', 'FAILED')),
  -- Start and optional finish timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  -- Error message if job failed
  error_message TEXT
);

-- Add index on courses.status to efficiently query by status.
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
-- Add composite index on lessons(course_id, position) to support ordered lesson retrieval per course.
CREATE INDEX IF NOT EXISTS idx_lessons_course_position ON lessons(course_id, position);
-- Add index on enrollments by learner and status for lookup of learner's current enrollments.
CREATE INDEX IF NOT EXISTS idx_enrollments_learner_status ON enrollments(learner_id, status);
-- Add index to speed retrieval of notifications for a recipient ordered by newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
-- Add index to optimize lookup of assessment attempts per enrollment by most recent submission.
CREATE INDEX IF NOT EXISTS idx_attempts_enrollment ON assessment_attempts(enrollment_id, submitted_at DESC);

-- Create a view summarizing course completion counts to be used in reporting.
CREATE OR REPLACE VIEW course_completion_report AS
-- Select course id and title and aggregate enrollments with completed counts.
SELECT c.id AS course_id,
       c.title,
       -- Total enrollments per course
       COUNT(e.id) AS total_enrollments,
       -- Count of enrollments where status is COMPLETED using FILTER
       COUNT(*) FILTER (WHERE e.status = 'COMPLETED') AS completed_enrollments
FROM courses c
-- Left join enrollments to include courses with zero enrollments
LEFT JOIN enrollments e ON e.course_id = c.id
-- Group by course id and title to produce one row per course
GROUP BY c.id, c.title;
