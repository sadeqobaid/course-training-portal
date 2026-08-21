import '../config/load-env.js';
import * as cron from 'node-cron';
import nodemailer from 'nodemailer';
import { Client } from 'pg';
import { env } from '../config/env.js';

type JobResult = {
  status: 'already-ran' | 'succeeded' | 'failed';
  candidates: number;
  created: number;
  emailSent: number;
  emailFailed: number;
  error?: string;
};

async function deliverPendingEmail(client: Client): Promise<{ sent: number; failed: number }> {
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

  let sent = 0;
  let failed = 0;
  for (const email of pending.rows) {
    try {
      await transport.sendMail({ from: env.smtpFrom, to: email.email, subject: email.subject, text: email.body, html: `<p>${email.body}</p>` });
      await client.query(`UPDATE notifications SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE id = $1`, [email.id]);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      await client.query(`UPDATE notifications SET status = 'FAILED', attempts = attempts + 1, last_error = $2 WHERE id = $1`, [email.id, message]);
      failed += 1;
    }
  }
  return { sent, failed };
}

async function runInactiveLearnerReminder(
  now = new Date(),
): Promise<JobResult> {
  const day = now.toISOString().slice(0, 10);
  const runKey = `inactive-reminder:${day}`;
  const client = new Client({ connectionString: env.databaseUrl });
  await client.connect();
  try {
    const started = await client.query(
      `INSERT INTO automation_runs (job_name, idempotency_key, status) VALUES ('inactive-reminder', $1, 'STARTED') ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
      [runKey],
    );
    const runId = started.rows[0]?.id as string | undefined;
    if (!runId) {
      const email = await deliverPendingEmail(client);
      return { status: 'already-ran', candidates: 0, created: 0, emailSent: email.sent, emailFailed: email.failed };
    }
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
    let created = 0;
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
      if (notification.rows[0]) created += 1;
    }
    await client.query(
      `UPDATE automation_runs SET status = 'SUCCEEDED', finished_at = NOW() WHERE id = $1`,
      [runId],
    );
    const email = await deliverPendingEmail(client);
    return { status: 'succeeded', candidates: candidates.rows.length, created, emailSent: email.sent, emailFailed: email.failed };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown worker failure';
    return { status: 'failed', candidates: 0, created: 0, emailSent: 0, emailFailed: 0, error: message };
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const firstRun = await runInactiveLearnerReminder();
  console.log(JSON.stringify({ job: 'inactive-reminder', ...firstRun }));
  cron.schedule('0 8 * * *', async () => {
    const result = await runInactiveLearnerReminder();
    console.log(JSON.stringify({ job: 'inactive-reminder', ...result }));
  });
}

void main();
