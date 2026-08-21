// Script name: notifications.service.ts
// Original location: backend/src/notifications/notifications.service.ts
// What this script is: A NestJS service that manages notifications (in-app and email) and handles persistence + email delivery.
// What it is used for: Creating idempotent notifications, listing and marking in-app notifications as read, and delivering pending email notifications via SMTP.
// Programming language: TypeScript
// Inputs: Function parameters (CreateNotificationInput, userId, notificationId, limit), environment variables (env.*), and database records.
// Outputs: Inserts/updates rows in the notifications database table and sends emails via SMTP.
// Where output is saved or sent: database/table: notifications; filesystem path: None; browser/session storage: None; JSON: None; HTTP/API: None; SMTP: emails sent via configured SMTP; Docker service: None; console: None; other: None
// Technologies and services used or interacted with: NestJS (Injectable), nodemailer (SMTP client), a DatabaseService for PostgreSQL (or similar), env config module.
// Downstream scripts/files/processes that consume the output: Frontend/API endpoints that read notifications, other backend consumers that query the notifications table, and email recipients (via SMTP).
// Risks and safe change note: Changing DB schema, idempotency handling, SMTP configuration, or retry limits can cause duplicate or failed notifications; modifying error handling may hide root causes. Safe changes: add tests, back up DB, validate env vars, and run delivery in a staging environment before production.
// created by: Sadeq Obaid

// Import the Injectable decorator from NestJS to mark the service for dependency injection.
import { Injectable } from '@nestjs/common';
// Import the nodemailer library to create SMTP transport and send emails.
import nodemailer from 'nodemailer';
// Import a DatabaseService wrapper used to run queries against the application's database.
import { DatabaseService } from '../database/database.service.js';
// Import environment configuration values used for SMTP and other settings.
import { env } from '../config/env.js';

export type CreateNotificationInput = {
  // Identifier of the recipient (user id or similar) for whom the notification is created.
  recipientId: string;
  // Notification type string used to classify the notification (e.g., "NEW_MESSAGE").
  type: string;
  // Idempotency key to avoid creating duplicate notifications.
  key: string;
  // Subject line for notifications that have a subject (e.g., emails or in-app titles).
  subject: string;
  // Body text of the notification (plain text).
  body: string;
  // Channel specifying whether notification is in-app or email; optional, defaults to in-app when omitted.
  channel?: 'IN_APP' | 'EMAIL';
};

@Injectable()
// Define the NotificationsService class that encapsulates notification-related operations.
export class NotificationsService {
 // private readonly transport = nodemailer.createTransport({
 //   host: env.smtpHost,
 //   port: env.smtpPort,
 //   secure: false,
 // });
 // Create an SMTP transport using nodemailer and environment-provided SMTP configuration.
private readonly transport = nodemailer.createTransport({
    // SMTP host from environment.
    host: env.smtpHost,
    // SMTP port from environment.
    port: env.smtpPort,
    // Whether to use a secure connection (true for TLS) as provided by env.
    secure: env.smtpSecure,
    // Conditionally include authentication credentials only if both user and password are provided.
    ...(env.smtpUser && env.smtpPassword
      ? {
          // Auth object passed to nodemailer when credentials are present.
          auth: {
            // SMTP username from env.
            user: env.smtpUser,
            // SMTP password from env.
            pass: env.smtpPassword,
          },
        }
      : {}),
  });
  // Inject the DatabaseService dependency for running queries; stored as a private readonly member.
  constructor(private readonly database: DatabaseService) {}

  // Create a single notification if an entry with the same idempotency key does not already exist.
  async createOnce(input: CreateNotificationInput): Promise<void> {
    // Execute an INSERT with ON CONFLICT DO NOTHING to ensure idempotent creation based on idempotency_key.
    await this.database.query(
      // SQL template inserting a notification row with status set to 'PENDING' and avoiding duplicates by idempotency key.
      `INSERT INTO notifications (recipient_id, channel, status, notification_type, idempotency_key, subject, body)
       VALUES ($1, $2, 'PENDING', $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      // Parameter array mapping input properties to the positional parameters in the SQL above.
      [
        // Map recipientId to $1.
        input.recipientId,
        // Map channel to $2; default to 'IN_APP' when undefined.
        input.channel ?? 'IN_APP',
        // Map notification type to $3.
        input.type,
        // Map idempotency key to $4.
        input.key,
        // Map subject to $5.
        input.subject,
        // Map body to $6.
        input.body,
      ],
    );
  }

  // Convenience method to create both an in-app notification and an email notification atomically (idempotently) by using distinct keys.
  async createInAppAndEmailOnce(input: CreateNotificationInput): Promise<void> {
    // Create the in-app notification using the provided input, forcing channel to 'IN_APP'.
    await this.createOnce({ ...input, channel: 'IN_APP' });
    // Create the email notification using the provided input, forcing channel to 'EMAIL' and appending ':email' to the idempotency key.
    await this.createOnce({ ...input, channel: 'EMAIL', key: `${input.key}:email` });
  }

  // List in-app notifications for a given user, returning rows ordered by creation time descending.
  async listForUser(userId: string) {
    // Query the notifications table for rows matching the recipient_id and channel='IN_APP', returning selected columns.
    return this.database.query<{
      // Unique identifier of the notification row.
      id: string;
      // Notification type string stored in the DB.
      notification_type: string;
      // Subject text for the notification.
      subject: string;
      // Body text for the notification.
      body: string;
      // Current status of the notification (e.g., PENDING, SENT, READ, FAILED).
      status: string;
      // Timestamp string when the notification was created.
      created_at: string;
      // Timestamp when the notification was read, or null if unread.
      read_at: string | null;
    }>(
      // SQL selecting the desired columns for in-app notifications for the given user.
      `SELECT id, notification_type, subject, body, status, created_at, read_at
       FROM notifications WHERE recipient_id = $1 AND channel = 'IN_APP' ORDER BY created_at DESC`,
      // Parameter array supplying the userId for $1 in the SQL above.
      [userId],
    );
  }

  // Mark a specific notification as read for a given user, setting status to 'READ' and read_at to current time.
  async markRead(userId: string, notificationId: string): Promise<void> {
    // Execute an UPDATE to change status to 'READ' and set read_at to NOW() for the matching id and recipient.
    await this.database.query(
      `UPDATE notifications SET status = 'READ', read_at = NOW()
       WHERE id = $1 AND recipient_id = $2`,
      // Parameters: first the notification id, then the user id to ensure ownership.
      [notificationId, userId],
    );
  }

  // Deliver pending email notifications up to a configurable limit; returns counts of sent and failed deliveries.
  async deliverPendingEmail(
    limit = 50,
  ): Promise<{ sent: number; failed: number }> {
    // Query pending email notifications joined with user emails, skipping notifications with too many attempts.
    const rows = await this.database.query<{
      // Notification id to update after attempting send.
      id: string;
      // Recipient email address from the users table.
      email: string;
      // Email subject taken from the notification row.
      subject: string;
      // Email body taken from the notification row.
      body: string;
      // Number of previous send attempts for retry logic.
      attempts: number;
    }>(
      // SQL selects pending email notifications with fewer than 3 attempts, ordered oldest first, limited by the provided limit.
      `SELECT n.id, u.email, n.subject, n.body, n.attempts
       FROM notifications n JOIN users u ON u.id = n.recipient_id
       WHERE n.channel = 'EMAIL' AND n.status = 'PENDING' AND n.attempts < 3
       ORDER BY n.created_at ASC LIMIT $1`,
      // Parameter supplying the limit for the SQL query.
      [limit],
    );
    // Initialize counter for successfully sent emails.
    let sent = 0;
    // Initialize counter for failed email attempts.
    let failed = 0;
    // Iterate over each row returned by the query to attempt delivery.
    for (const row of rows) {
      try {
        // Use the configured transport to send a single email to the recipient with both text and HTML content.
        await this.transport.sendMail({
          // Sender address pulled from environment configuration.
          from: env.smtpFrom,
          // Recipient's email address from the joined users table.
          to: row.email,
          // Email subject from the notification row.
          subject: row.subject,
          // Plain-text body for email clients that prefer text.
          text: row.body,
          // Simple HTML representation of the body for HTML-capable clients.
          html: `<p>${row.body}</p>`,
        });
        // On success, update the notification row to mark it as SENT, set sent_at, and increment attempts.
        await this.database.query(
          `UPDATE notifications SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE id = $1`,
          // Use the notification id as the parameter to identify the row to update.
          [row.id],
        );
        // Increment the local success counter.
        sent += 1;
      } catch (error) {
        // Determine a textual error message for storage in the DB, prefer Error.message when available.
        const message =
          error instanceof Error ? error.message : 'Unknown email error';
        // On failure, update the notification to status 'FAILED', increment attempts, and store last_error.
        await this.database.query(
          `UPDATE notifications SET status = 'FAILED', attempts = attempts + 1, last_error = $2 WHERE id = $1`,
          // Parameters: id then message mapped to $1 and $2 respectively.
          [row.id, message],
        );
        // Increment the local failure counter.
        failed += 1;
      }
    }
    // Return aggregated counts of sent and failed deliveries to the caller.
    return { sent, failed };
  }
}
