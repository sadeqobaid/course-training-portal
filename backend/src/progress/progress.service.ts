// Script name: progress.service.ts
// Original location: backend/src/progress/progress.service.ts
// What this script is: A NestJS service for tracking and updating student progress in lessons and enrollments.
// What it is used for: Provides methods to mark lessons complete, compute progress summaries, and finalize enrollments when criteria are met.
// Programming language: TypeScript
// Inputs: Authenticated user objects, enrollmentId strings, lessonId strings, boolean hasPassingAttempt, and database records via DatabaseService.
// Outputs: Progress summary objects (totalLessons, completedLessons, progressPercent), boolean indicating enrollment completion; side-effectful database updates and inserts.
// Where output is saved or sent: database/table: lesson_progress and enrollments tables; also returned to callers over HTTP/API via higher-level controllers.
// Technologies and services used or interacted with: NestJS (Injectable, exceptions), a DatabaseService abstraction (PostgreSQL assumed), EnrollmentsService for ownership checks.
// Downstream scripts/files/processes that consume the output: controllers exposing progress endpoints, frontend clients consuming API responses, and other services that may trigger enrollment finalization.
// Risks and safe change note: Changing SQL, transactionality, or conflict-handling may lead to data inconsistencies or race conditions; ensure tests and DB backups before modifying queries or side effects.
// created by: Sadeq Obaid

// Import NestJS Injectable decorator and NotFoundException used for error signaling to requesters.
import { Injectable, NotFoundException } from '@nestjs/common';
// Import DatabaseService which provides query and single-row helpers to interact with the DB.
import { DatabaseService } from '../database/database.service.js';
// Import the AuthenticatedUser type to type-check user input to methods.
import { AuthenticatedUser } from '../common/types.js';
// Import EnrollmentsService to verify enrollment ownership and related enrollment operations.
import { EnrollmentsService } from '../enrollments/enrollments.service.js';

// Apply the Injectable decorator to allow NestJS to inject dependencies into this service.
@Injectable()
export class ProgressService {
  // Constructor injects DatabaseService and EnrollmentsService; these are stored as readonly private fields for use in methods.
  constructor(
    // DatabaseService instance used for running queries and fetching rows.
    private readonly database: DatabaseService,
    // EnrollmentsService instance used to verify that the provided enrollment belongs to the user.
    private readonly enrollments: EnrollmentsService,
  ) {}

  // Method to mark a lesson as completed for a user's enrollment; it validates ownership and published status, updates progress, and returns updated summary.
  async completeLesson(
    // The authenticated user performing the action; used to check enrollment ownership.
    user: AuthenticatedUser,
    // The enrollment id to which the lesson completion should be applied.
    enrollmentId: string,
    // The lesson id to mark as completed.
    lessonId: string,
  ) {
    // Retrieve the enrollment and ensure it belongs to the requesting user; may throw if not owned.
    const enrollment = await this.enrollments.ownedEnrollment(
      user,
      enrollmentId,
    );
    // Query the database for the lesson existence, ensuring it belongs to the enrollment's course and is published.
    const lesson = await this.database.one<{ id: string }>(
      `SELECT id FROM lessons WHERE id = $1 AND course_id = $2 AND is_published = TRUE`,
      [lessonId, enrollment.course_id],
    );
    // If the lesson was not found or is not published for the enrollment's course, signal a NotFound error to callers.
    if (!lesson)
      throw new NotFoundException(
        'Published lesson does not belong to this enrollment course.',
      );
    // Insert or update the lesson_progress row to record completion and last viewed timestamps atomically using ON CONFLICT.
    await this.database.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, completed_at, last_viewed_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (enrollment_id, lesson_id)
       DO UPDATE SET completed_at = COALESCE(lesson_progress.completed_at, NOW()), last_viewed_at = NOW()`,
      [enrollmentId, lessonId],
    );
    // After updating progress, return a fresh summary of progress for the enrollment.
    return this.summary(enrollmentId);
  }

  // Method to compute and return a summarized progress object for an enrollment: total lessons, completed lessons, and percent complete.
  async summary(enrollmentId: string) {
    // Run a query that counts published lessons for the enrollment's course and counts completed progress rows joined by enrollment.
    const row = await this.database.one<{ total: string; completed: string }>(
      `SELECT COUNT(l.id)::text AS total,
              COUNT(lp.id) FILTER (WHERE lp.completed_at IS NOT NULL)::text AS completed
       FROM enrollments e
       JOIN lessons l ON l.course_id = e.course_id AND l.is_published = TRUE
       LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
       WHERE e.id = $1 GROUP BY e.id`,
      [enrollmentId],
    );
    // If no row was returned, the enrollment id does not exist; throw NotFoundException.
    if (!row) throw new NotFoundException('Enrollment not found.');
    // Convert the textual counts returned by the query into numeric values for calculation.
    const total = Number(row.total);
    const completed = Number(row.completed);
    // Return a structured object containing totals and a computed integer percentage (floor).
    return {
      totalLessons: total,
      completedLessons: completed,
      progressPercent: total === 0 ? 0 : Math.floor((completed / total) * 100),
    };
  }

  // Method that marks an enrollment as COMPLETED if all lessons are completed and a passing attempt exists; returns true when status changed.
  async markCompletedIfEligible(
    // Enrollment id to check and possibly update.
    enrollmentId: string,
    // Whether the user has a passing attempt in the course (precondition for completion).
    hasPassingAttempt: boolean,
  ): Promise<boolean> {
    // Fetch current progress summary for the enrollment to determine if all lessons are completed.
    const progress = await this.summary(enrollmentId);
    // If there are no lessons, not all completed, or no passing attempt, do not mark as completed and return false.
    if (
      progress.totalLessons === 0 ||
      progress.completedLessons !== progress.totalLessons ||
      !hasPassingAttempt
    )
      return false;
    // Update the enrollments table to set status to COMPLETED and set completed_at if not already present; this is a side-effecting DB update.
    await this.database.query(
      `UPDATE enrollments SET status = 'COMPLETED', completed_at = COALESCE(completed_at, NOW()) WHERE id = $1`,
      [enrollmentId],
    );
    // Indicate that the enrollment was marked completed.
    return true;
  }
}
