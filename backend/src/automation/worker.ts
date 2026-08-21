// Script name: worker.ts
// Original location: backend/src/automation/worker.ts
// What this script is: Background automation worker that schedules and runs automated jobs and delivers pending notifications.
// What it is used for: Executes an "inactive learner" reminder job daily, inserts notifications, records automation run state, and delivers EMAIL/IN_APP notifications via SMTP and the database.
// Programming language: TypeScript
// Inputs: Environment variables (loaded via ../config/load-env.js and ../config/env.js) and database contents (Postgres notifications, enrollments, users, courses, automation_runs).
// Outputs: Inserts/updates records in Postgres (notifications, automation_runs), sends emails via SMTP, and logs JSON job results to console.
// Where output is saved or sent: database/table (Postgres tables: notifications, automation_runs), SMTP (emails sent), console (JSON logs).
// Technologies and services used or interacted with: node-cron (scheduling), nodemailer (SMTP), pg (Postgres Client), environment config module.
// Downstream scripts/files/processes that consume the output: Any services reading notifications or automation_runs from the database, monitoring/logging systems consuming console logs, and email recipients/smtp service.
// Risks and safe change note: Modifying DB queries, idempotency keys, or SMTP behavior can duplicate notifications or fail deliveries; changing schedule affects job frequency. Test in staging with a safe SMTP sink and a copy of DB. Keep idempotency and retry logic intact.
// created by: Sadeq Obaid

// Ensure environment variables are loaded before anything else runs.
import '../config/load-env.js';
// Import the cron scheduler to schedule recurring tasks.
import * as cron from 'node-cron';
// Import nodemailer to construct and send SMTP emails.
import nodemailer from 'nodemailer';
// Import the Postgres client to query and update the database.
import { Client } from 'pg';
// Import typed env values used for DB and SMTP configuration.
import { env } from '../config/env.js';

type JobResult = {
  // Status indicates whether the job was run, already ran, or failed.
  status: 'already-ran' | 'succeeded' | 'failed';
  // Number of candidate enrollments considered for reminders.
  candidates: number;
  // Number of notifications created.
  created: number;
  // Number of emails successfully sent.
  emailSent: number;
  // Number of emails that failed to send.
  emailFailed: number;
  // Optional error message when status is 'failed'.
  error?: string;
};

// Define a helper to fetch pending email notifications and attempt delivery via SMTP.
async function deliverPendingEmail(client: Client): Promise<{ sent: number; failed: number }> {
  // Query up to 50 pending EMAIL notifications joined with recipient email address in ascending creation order.
  const pending = await client.query<{
    id: string;
    email: string;
    subject: string;
    body: string;
  }>(
    `SELECT n.id, u.email, n.subject, n.body
     FROM notifications n JOIN users u ON u.id = n.recipient_id
     WHERE n.channel = 'EMAIL' AND n.status = 'PENDING' AND n.attempts < 3
     ORDER BY n.created_at ASC LIMIT 50`,
  );
 // const transport = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: false });
    // Create an SMTP transport using env configuration, including optional auth only when both user and password are present.
    const transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    ...(env.smtpUser && env.smtpPassword
      ? {
          auth: {
            user: env.smtpUser,
            pass: env.smtpPassword,
          },
        }
      : {}),
  });

  // Counter of successful sends.
  let sent = 0;
  // Counter of failed sends.
  let failed = 0;
  // Iterate over the pending rows and attempt to send each email.
  for (const email of pending.rows) {
    try {
      // Send the email via the transport with both text and simple html body.
      await transport.sendMail({ from: env.smtpFrom, to: email.email, subject: email.subject, text: email.body, html: `<p>${email.body}</p>` });
      // On success, update notification status to SENT, record sent_at, and increment attempts.
      await client.query(`UPDATE notifications SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE id = $1`, [email.id]);
      // Increment local success counter.
      sent += 1;
    } catch (error) {
      // Determine a string message for the caught error.
      const message = error instanceof Error ? error.message : 'Unknown email error';
      // On failure, mark notification as FAILED, increment attempts, and persist last_error.
      await client.query(`UPDATE notifications SET status = 'FAILED', attempts = attempts + 1, last_error = $2 WHERE id = $1`, [email.id, message]);
      // Increment local failure counter.
      failed += 1;
    }
  }
  // Return aggregated send/fail counts for reporting.
  return { sent, failed };
}

// Define the main automation job to create reminders for inactive learners, with a provided default current time.
async function runInactiveLearnerReminder(
  now = new Date(),
): Promise<JobResult> {
  // Create a day-specific idempotency key using YYYY-MM-DD format.
  const day = now.toISOString().slice(0, 10);
  // Construct the idempotency key for this run so it only runs once per day.
  const runKey = `inactive-reminder:${day}`;
  // Initialize a Postgres client using the configured database URL.
  const client = new Client({ connectionString: env.databaseUrl });
  // Connect the client to the database.
  await client.connect();
  try {
    // Attempt to insert an automation_runs row for this idempotency key; do nothing if it already exists.
    const started = await client.query(
      `INSERT INTO automation_runs (job_name, idempotency_key, status) VALUES ('inactive-reminder', $1, 'STARTED') ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
      [runKey],
    );
    // Extract the inserted run id, if any, to detect whether this run should proceed.
    const runId = started.rows[0]?.id as string | undefined;
    // If no runId was returned, the job already ran for this day; however still deliver pending emails.
    if (!runId) {
      const email = await deliverPendingEmail(client);
      // Return with 'already-ran' and counts from email deliveries.
      return { status: 'already-ran', candidates: 0, created: 0, emailSent: email.sent, emailFailed: email.failed };
    }
    // Query enrollments that qualify for an inactive reminder based on configured thresholds and absence of recent reminders.
    const candidates = await client.query<{
      enrollment_id: string;
      learner_id: string;
      title: string;
    }>(
      `SELECT e.id AS enrollment_id, e.learner_id, c.title
       FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = e.learner_id
       WHERE e.status = 'ACTIVE' AND u.is_active = TRUE AND e.enrolled_at <= NOW() - ($1 || ' days')::interval
       AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.recipient_id = e.learner_id AND n.notification_type = 'INACTIVE_LEARNER_REMINDER' AND n.created_at >= NOW() - ($2 || ' days')::interval)`,
      [String(env.reminderAfterDays), String(env.reminderCooldownDays)],
    );
    // Counter for how many notification pairs were created.
    let created = 0;
    // For each eligible enrollment candidate, insert both IN_APP and EMAIL pending notifications with idempotency key.
    for (const candidate of candidates.rows) {
      const notification = await client.query(
        `INSERT INTO notifications (recipient_id, channel, status, notification_type, idempotency_key, subject, body)
         VALUES ($1, 'IN_APP', 'PENDING', 'INACTIVE_LEARNER_REMINDER', $2, $3, $4),
                ($1, 'EMAIL', 'PENDING', 'INACTIVE_LEARNER_REMINDER', $2 || ':email', $3, $4)
         ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
        [
          candidate.learner_id,
          `reminder:${candidate.enrollment_id}:${day}`,
          `Continue ${candidate.title}`,
          'Your course is still active. Continue with your next lesson.',
        ],
      );
      // If the insert returned a row id, we created notifications for this candidate.
      if (notification.rows[0]) created += 1;
    }
    // Mark the automation run as succeeded and record finished_at timestamp.
    await client.query(
      `UPDATE automation_runs SET status = 'SUCCEEDED', finished_at = NOW() WHERE id = $1`,
      [runId],
    );
    // After creating notifications, attempt to deliver pending emails and include their report.
    const email = await deliverPendingEmail(client);
    // Return a successful JobResult including counts.
    return { status: 'succeeded', candidates: candidates.rows.length, created, emailSent: email.sent, emailFailed: email.failed };
  } catch (error) {
    // On any uncaught error, capture a textual message for reporting.
    const message =
      error instanceof Error ? error.message : 'Unknown worker failure';
    // Return a failed JobResult with the error message.
    return { status: 'failed', candidates: 0, created: 0, emailSent: 0, emailFailed: 0, error: message };
  } finally {
    // Ensure the database client is closed regardless of success or failure.
    await client.end();
  }
}

// Define the program entrypoint: run once immediately, then schedule daily runs at 08:00.
async function main(): Promise<void> {
  // Execute one run immediately when the worker starts and capture the result.
  const firstRun = await runInactiveLearnerReminder();
  // Log the first run result as JSON to stdout for observability.
  console.log(JSON.stringify({ job: 'inactive-reminder', ...firstRun }));
  // Schedule a recurring cron job to run at 08:00 every day and log each run's result.
  cron.schedule('0 8 * * *', async () => {
    const result = await runInactiveLearnerReminder();
    console.log(JSON.stringify({ job: 'inactive-reminder', ...result }));
  });
}

// Invoke main and intentionally ignore its returned promise.
void main();
