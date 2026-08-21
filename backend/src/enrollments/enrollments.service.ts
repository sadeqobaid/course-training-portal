// Script name: enrollments.service.ts
// Original location: backend/src/enrollments/enrollments.service.ts
// What this script is: Service layer for managing enrollments in courses within the backend.
// What it is used for: Provides methods to enroll a user, list a user's enrollments, and fetch an enrollment the user owns; performs DB transactions and creates notifications.
// Programming language: TypeScript
// Inputs: AuthenticatedUser objects, courseId and enrollmentId strings provided by controllers or other services.
// Outputs: EnrollmentRow objects and arrays, DB rows inserted/queried, notifications enqueued; errors via exceptions.
// Where output is saved or sent: database/table (enrollments, notifications, courses), HTTP/API (via thrown exceptions handled by controllers)
// Technologies and services used or interacted with: NestJS, PostgreSQL (via DatabaseService), SQL queries, in-app and email notifications
// Downstream scripts/files/processes that consume the output: API controllers that call this service, notification processing jobs, frontend clients reading API responses.
// Risks and safe change note: Changing SQL, transaction boundaries, or idempotency keys can cause duplicate notifications or enrollment race conditions; altering exception types affects HTTP error codes. Test DB transactions and concurrency when modifying.
// created by: Sadeq Obaid

// Import NestJS exceptions and decorator used below to signal HTTP error conditions and to mark the service as injectable.
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
// Import DatabaseService which provides database querying and transactional helpers.
import { DatabaseService } from '../database/database.service.js';
// Import the AuthenticatedUser type used to type the caller/user parameter for methods.
import { AuthenticatedUser } from '../common/types.js';

// Define a TypeScript type describing the shape of an enrollment row returned from queries.
type EnrollmentRow = {
  id: string;
  learner_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  title?: string;
  description?: string;
};

// Mark the service as injectable so NestJS can create and inject it where needed.
@Injectable()
// Export the EnrollmentsService class that encapsulates enrollment-related operations.
export class EnrollmentsService {
  // Constructor receives a DatabaseService instance injected by NestJS; stored as a readonly private member.
  constructor(private readonly database: DatabaseService) {}

  // Public async method to enroll the authenticated user in a course, returning the created EnrollmentRow.
  async enroll(
    user: AuthenticatedUser,
    courseId: string,
  ): Promise<EnrollmentRow> {
    // Execute the enrollment within a database transaction to ensure atomicity and to lock the course row.
    return this.database.transaction(async (client) => {
      // Query the course row for the given courseId with a FOR UPDATE lock to prevent concurrent changes while enrolling.
      const course = await client.query<{
        id: string;
        title: string;
        status: string;
      }>('SELECT id, title, status FROM courses WHERE id = $1 FOR UPDATE', [
        courseId,
      ]);
      // Check whether the course exists and is in the 'PUBLISHED' state; if not, raise an UnprocessableEntityException.
      if (!course.rows[0] || course.rows[0].status !== 'PUBLISHED')
        throw new UnprocessableEntityException(
          'Course is not available for enrollment.',
        );
      // Attempt to insert the enrollment and related notifications, catching unique-constraint errors to translate to 409 Conflict.
      try {
        // Insert an enrollment row for the user and return the inserted columns; this is the core side-effect creating the enrollment.
        const result = await client.query<EnrollmentRow>(
          `INSERT INTO enrollments (learner_id, course_id) VALUES ($1, $2)
           RETURNING id, learner_id, course_id, status, enrolled_at, completed_at`,
          [user.id, courseId],
        );
        // Extract the first row from the INSERT result which should be the created enrollment.
        const enrollment = result.rows[0];
        // If no row was returned from the INSERT, treat it as an unexpected error and throw.
        if (!enrollment)
          throw new Error('Enrollment creation did not return a row.');
        // Insert notification records for both in-app and email channels using an idempotency key to avoid duplicates.
        await client.query(
          `INSERT INTO notifications (recipient_id, channel, status, notification_type, idempotency_key, subject, body)
           VALUES ($1, 'IN_APP', 'PENDING', 'ENROLLMENT_CREATED', $2, $3, $4),
                  ($1, 'EMAIL', 'PENDING', 'ENROLLMENT_CREATED', $2 || ':email', $3, $4)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [
            user.id,
            `enrollment:${enrollment.id}`,
            'Enrollment confirmed',
            `You are enrolled in ${course.rows[0].title}.`,
          ],
        );
        // Return the created enrollment row to the caller.
        return enrollment;
      } catch (error) {
        // If the error corresponds to a unique-violation (Postgres code 23505), map it to a ConflictException indicating the user is already enrolled.
        if ((error as { code?: string }).code === '23505')
          throw new ConflictException(
            'You are already enrolled in this course.',
          );
        // Re-throw any other unexpected errors to be handled upstream.
        throw error;
      }
    });
  }

  // Public async method to fetch all enrollments for the authenticated user, including course title and description.
  async myEnrollments(user: AuthenticatedUser): Promise<EnrollmentRow[]> {
    // Query the enrollments joined with courses and return rows ordered by enrollment time descending.
    return this.database.query<EnrollmentRow>(
      `SELECT e.id, e.learner_id, e.course_id, e.status, e.enrolled_at, e.completed_at, c.title, c.description
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.learner_id = $1 ORDER BY e.enrolled_at DESC`,
      [user.id],
    );
  }

  // Public async method to retrieve a single enrollment by id and ensure the requesting user owns it or has admin roles.
  async ownedEnrollment(
    user: AuthenticatedUser,
    enrollmentId: string,
  ): Promise<EnrollmentRow> {
    // Fetch exactly one enrollment row by id; database.one is expected to return a single row or undefined/null.
    const enrollment = await this.database.one<EnrollmentRow>(
      `SELECT id, learner_id, course_id, status, enrolled_at, completed_at FROM enrollments WHERE id = $1`,
      [enrollmentId],
    );
    // If no enrollment was found, throw a NotFoundException.
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    // Enforce ownership: allow access if the enrollment belongs to the user or the user has an administrative role.
    if (
      enrollment.learner_id !== user.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
    )
      // If the caller is neither the owner nor an admin, throw UnprocessableEntityException to indicate lack of permission.
      throw new UnprocessableEntityException('You do not own this enrollment.');
    // Return the enrollment row after ownership and existence checks pass.
    return enrollment;
  }
}
