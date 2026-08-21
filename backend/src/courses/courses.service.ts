// Script name: courses.service.ts
// Original location: backend/src/courses/courses.service.ts
// What this script is: Service layer implementing course and lesson management logic for a NestJS backend.
// What it is used for: Creating, listing, finding, detailing, adding lessons to, and publishing courses; interacts with the database.
// Programming language: TypeScript
// Inputs: AuthenticatedUser, CreateCourseDto, CreateLessonDto, courseId strings, PoolClient for transaction-aware queries.
// Outputs: CourseRow and LessonRow objects returned from methods; database rows affected via SQL statements.
// Where output is saved or sent: database/table (PostgreSQL tables: courses, lessons)
// Technologies and services used or interacted with: NestJS (Injectable, Exceptions), pg (PoolClient), custom DatabaseService, PostgreSQL.
// Downstream scripts/files/processes that consume the output: Controllers that call this service, API responses sent to clients, any other services using DatabaseService results.
// Risks and safe change note: Changing SQL, permission checks, or exception types can alter runtime behavior or security; preserve SQL, role checks, and return shapes when making safe changes.
// created by: Sadeq Obaid

// Import commonly used NestJS exceptions and Injectable decorator from the common module to annotate and throw HTTP-related errors and mark service as injectable.
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
// Import PoolClient type from 'pg' for transaction-aware database operations using client.query.
import { PoolClient } from 'pg';
// Import DatabaseService wrapper to execute queries against PostgreSQL; this service is injected into the constructor.
import { DatabaseService } from '../database/database.service.js';
// Import type representing an authenticated user passed to methods for authorization checks.
import { AuthenticatedUser } from '../common/types.js';
// Import DTO types used to validate and type incoming data when creating courses and lessons.
import { CreateCourseDto, CreateLessonDto } from './courses.dto.js';

// Define the shape of a course row returned from the database; fields are represented as strings to match how DB driver returns them.
type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  objectives: string;
  prerequisites: string;
  status: string;
  passing_score_percent: string;
  created_by: string;
  published_at: string | null;
  created_at: string;
};
// Define the shape of a lesson row returned from the database; includes publication flag and position ordering.
type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  body_markdown: string;
  position: number;
  is_published: boolean;
};

// Mark the service as injectable so NestJS can inject it where needed.
@Injectable()
export class CoursesService {
  // Inject DatabaseService instance for executing parameterized queries and transactions.
  constructor(private readonly database: DatabaseService) {}

  // Create a new course: accept the author for created_by and a DTO for course fields; returns the inserted course row.
  async create(
    author: AuthenticatedUser,
    dto: CreateCourseDto,
  ): Promise<CourseRow> {
    // Normalize and derive slug from incoming DTO by trimming and lowercasing for uniqueness checks and URL usage.
    const slug = dto.slug.trim().toLowerCase();
    // Attempt to insert the course row and handle unique constraint or other DB errors.
    try {
      // Execute an INSERT query that returns the inserted course fields; uses parameterized values to avoid SQL injection.
      const course = await this.database.one<CourseRow>(
        `INSERT INTO courses (title, slug, description, objectives, prerequisites, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at`,
        [
          dto.title.trim(),
          slug,
          dto.description.trim(),
          dto.objectives.trim(),
          dto.prerequisites?.trim() ?? '',
          author.id,
        ],
      );
      // Verify the DatabaseService returned a row; otherwise throw to signal unexpected DB behavior.
      if (!course) throw new Error('Course creation did not return a row.');
      // Return the newly created course row to the caller.
      return course;
    } catch (error) {
      // Detect unique constraint violation on slug (Postgres error code 23505) and convert to HTTP Conflict.
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('Course slug already exists.');
      // Re-throw unknown errors for higher-level handling/logging by NestJS.
      throw error;
    }
  }

  // List published courses ordered by published_at descending to show newest first.
  async listPublished(): Promise<CourseRow[]> {
    // Query the courses table for rows where status is PUBLISHED and return them as CourseRow[].
    return this.database.query<CourseRow>(
      `SELECT id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at
       FROM courses WHERE status = 'PUBLISHED' ORDER BY published_at DESC`,
    );
  }

  // Find a course by its ID and return the row or throw NotFoundException if missing.
  async findCourse(courseId: string): Promise<CourseRow> {
    // Query for a single course by id; expect DatabaseService.one to return a single row or null/undefined.
    const course = await this.database.one<CourseRow>(
      `SELECT id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at
       FROM courses WHERE id = $1`,
      [courseId],
    );
    // If no row found, throw a 404 NotFound to signal the caller that the resource doesn't exist.
    if (!course) throw new NotFoundException('Course not found.');
    // Return the found course row.
    return course;
  }

  // Return detailed view of a course including its published lessons.
  async detail(courseId: string) {
    // Reuse findCourse to ensure course exists and to leverage NotFound handling.
    const course = await this.findCourse(courseId);
    // Query published lessons for this course, ordered by position ascending to present the intended sequence.
    const lessons = await this.database.query<LessonRow>(
      `SELECT id, course_id, title, body_markdown, position, is_published
       FROM lessons WHERE course_id = $1 AND is_published = TRUE ORDER BY position ASC`,
      [courseId],
    );
    // Return an object containing the course and its associated published lessons.
    return { course, lessons };
  }

  // Add a new lesson to a course after authorization check; returns the created lesson row.
  async addLesson(
    author: AuthenticatedUser,
    courseId: string,
    dto: CreateLessonDto,
  ): Promise<LessonRow> {
    // Ensure the target course exists before attempting to insert a lesson.
    const course = await this.findCourse(courseId);
    // Enforce that only the course owner or specific admin roles can modify the course.
    if (
      course.created_by !== author.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(author.role)
    ) {
      // Throw UnprocessableEntity when the actor is not authorized to modify the course.
      throw new UnprocessableEntityException(
        'Only the owner or training administration can edit this course.',
      );
    }
    // Attempt to insert the lesson and handle unique constraint on position or other DB errors.
    try {
      // Insert the lesson row using parameterized values and return the inserted fields.
      const lesson = await this.database.one<LessonRow>(
        `INSERT INTO lessons (course_id, title, body_markdown, position, is_published)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, course_id, title, body_markdown, position, is_published`,
        [
          courseId,
          dto.title.trim(),
          dto.bodyMarkdown.trim(),
          dto.position,
          dto.isPublished,
        ],
      );
      // Ensure a row was returned to confirm insertion succeeded.
      if (!lesson) throw new Error('Lesson creation did not return a row.');
      // Return the newly created lesson row to the caller.
      return lesson;
    } catch (error) {
      // If the DB reports a unique constraint violation (e.g., duplicate position), translate to ConflictException.
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('A lesson already uses this position.');
      // Re-throw unexpected errors for higher-level handling.
      throw error;
    }
  }

  // Publish a course after ensuring authorization and that there's at least one published lesson.
  async publish(
    author: AuthenticatedUser,
    courseId: string,
  ): Promise<CourseRow> {
    // Confirm the course exists and retrieve its metadata.
    const course = await this.findCourse(courseId);
    // Enforce that only the course owner or training admins can publish the course.
    if (
      course.created_by !== author.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(author.role)
    ) {
      // Throw UnprocessableEntity when the actor lacks publish permissions.
      throw new UnprocessableEntityException(
        'Only the owner or training administration can publish this course.',
      );
    }
    // Count published lessons for the course to ensure at least one exists before publishing.
    const lessons = await this.database.one<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM lessons WHERE course_id = $1 AND is_published = TRUE`,
      [courseId],
    );
    // If there are no published lessons, publishing is not allowed; throw detailed error.
    if (!lessons || Number(lessons.count) < 1)
      throw new UnprocessableEntityException(
        'At least one published lesson is required before publishing.',
      );
    // Update the course status to PUBLISHED and set published_at/updated_at timestamps; return the updated row.
    const updated = await this.database.one<CourseRow>(
      `UPDATE courses SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at`,
      [courseId],
    );
    // If update did not return a row, treat as not found to keep behavior consistent.
    if (!updated) throw new NotFoundException('Course not found.');
    // Return the updated course row to the caller.
    return updated;
  }

  // Retrieve published lessons for a course using a provided PoolClient for transaction context.
  async courseLessons(
    client: PoolClient,
    courseId: string,
  ): Promise<LessonRow[]> {
    // Execute a parameterized client.query to fetch published lessons ordered by position; returns QueryResult with rows.
    const result = await client.query<LessonRow>(
      `SELECT id, course_id, title, body_markdown, position, is_published FROM lessons WHERE course_id = $1 AND is_published = TRUE ORDER BY position`,
      [courseId],
    );
    // Return only the rows array from the QueryResult to the caller.
    return result.rows;
  }
}
