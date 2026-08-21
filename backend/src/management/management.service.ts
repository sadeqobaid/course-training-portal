// Script name: management.service.ts
// Original location: backend/src/management/management.service.ts
// What this script is: A NestJS service class that provides management-related data access and announcement functionality.
// What it is used for: Fetching course summary info for management views and sending announcements to user groups via in-app and email notifications.
// Programming language: TypeScript
// Inputs: AuthenticatedUser objects for permission-scoped queries; CreateAnnouncementDto for announcement creation; DB query parameters.
// Outputs: Query results (course summaries) and an object containing the number of announcement recipients; side-effect: notifications created in-app and via email.
// Where output is saved or sent: HTTP/API (service responses), Notifications persisted/processed via NotificationsService and DatabaseService; console: None.
// Technologies and services used or interacted with: NestJS (Injectable), a DatabaseService (Postgres queries), NotificationsService (in-app + email), TypeScript types.
// Downstream scripts/files/processes that consume the output: controllers that call ManagementService, frontend management UI that displays course summaries, notification delivery subsystems.
// Risks and safe change note: Changing SQL, role checks, or notification payloads may change data surfaced to admins and recipients; ensure tests cover query correctness, role permissions, and de-duplication of notifications before modifying.
// created by: Sadeq Obaid

// Import the Injectable decorator from NestJS to mark this class as a provider.
import { Injectable } from '@nestjs/common';
// Import the AuthenticatedUser type used to type the actor parameter in methods.
import { AuthenticatedUser } from '../common/types.js';
// Import the DatabaseService which is used to run SQL queries.
import { DatabaseService } from '../database/database.service.js';
// Import the NotificationsService which is used to create in-app and email notifications.
import { NotificationsService } from '../notifications/notifications.service.js';
// Import the DTO type for creating announcements.
import { CreateAnnouncementDto } from './management.dto.js';

// Apply the Injectable decorator so NestJS can inject dependencies into this service.
@Injectable()
// Export the ManagementService class which contains methods for management operations.
export class ManagementService {
  // Constructor declares injected dependencies; DatabaseService and NotificationsService are provided by NestJS DI.
  constructor(
    // DatabaseService is injected and stored as a private readonly property for running queries.
    private readonly database: DatabaseService,
    // NotificationsService is injected and stored as a private readonly property to send notifications.
    private readonly notifications: NotificationsService,
  ) {}

  // Define a method to retrieve a list of courses visible to the provided actor.
  coursesFor(actor: AuthenticatedUser) {
    // Determine if the actor has a role that can view all courses (system or training admins).
    const canSeeAll = ['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(actor.role);
    // Execute a database query to fetch course summaries with counts of lessons, assessments, enrollments, and completions.
    return this.database.query<{
      // Define the expected shape of each returned row: course id.
      id: string;
      // course title.
      title: string;
      // course slug.
      slug: string;
      // course status.
      status: string;
      // who created the course.
      created_by: string;
      // lesson count as text.
      lesson_count: string;
      // assessment count as text.
      assessment_count: string;
      // enrollment count as text.
      enrollment_count: string;
      // completed enrollment count as text.
      completed_count: string;
    }>(
      // SQL query selects course fields and aggregates counts, applying a permission filter and ordering by creation date.
      `SELECT c.id, c.title, c.slug, c.status, c.created_by,
              COUNT(DISTINCT l.id)::text AS lesson_count,
              COUNT(DISTINCT a.id)::text AS assessment_count,
              COUNT(DISTINCT e.id)::text AS enrollment_count,
              COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'COMPLETED')::text AS completed_count
       FROM courses c
       LEFT JOIN lessons l ON l.course_id = c.id
       LEFT JOIN assessments a ON a.course_id = c.id
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE ($1::boolean = TRUE OR c.created_by = $2)
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      // Bind parameters: first indicates whether to ignore creator filtering, second is the actor's id used when filter applies.
      [canSeeAll, actor.id],
    );
  }

  // Define an async method to create an announcement and notify recipients; returns the number of recipients notified.
  async announce(dto: CreateAnnouncementDto): Promise<{ recipients: number }> {
    // Determine recipient role from DTO or default to 'LEARNER' if not provided.
    const recipientRole = dto.recipientRole ?? 'LEARNER';
    // Query the database for active users who have the target role; returns rows with id fields.
    const recipients = await this.database.query<{ id: string }>(
      `SELECT id FROM users WHERE is_active = TRUE AND role = $1`,
      // Bind the target role to the query.
      [recipientRole],
    );
    // For each recipient, create an in-app and email notification; run all creations in parallel and await completion.
    await Promise.all(
      // Map over recipient rows to create a notification promise for each.
      recipients.map((recipient) =>
        // Call NotificationsService to create both in-app and email notification once per recipient.
        this.notifications.createInAppAndEmailOnce({
          // Set recipientId to the current recipient's id.
          recipientId: recipient.id,
          // Notification type is 'ANNOUNCEMENT'.
          type: 'ANNOUNCEMENT',
          // Use a unique key incorporating timestamp and recipient id to identify this announcement instance.
          key: `announcement:${Date.now()}:${recipient.id}`,
          // Trim and set the subject from the DTO.
          subject: dto.subject.trim(),
          // Trim and set the body from the DTO.
          body: dto.body.trim(),
        }),
      ),
    );
    // Return an object with the number of recipients processed.
    return { recipients: recipients.length };
  }
}
