import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { DatabaseService } from '../database/database.service.js';
import { env } from '../config/env.js';

export type CreateNotificationInput = {
  recipientId: string;
  type: string;
  key: string;
  subject: string;
  body: string;
  channel?: 'IN_APP' | 'EMAIL';
};

@Injectable()
export class NotificationsService {
 // private readonly transport = nodemailer.createTransport({
 //   host: env.smtpHost,
 //   port: env.smtpPort,
 //   secure: false,
 // });
private readonly transport = nodemailer.createTransport({
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
  constructor(private readonly database: DatabaseService) {}

  async createOnce(input: CreateNotificationInput): Promise<void> {
    await this.database.query(
      `INSERT INTO notifications (recipient_id, channel, status, notification_type, idempotency_key, subject, body)
       VALUES ($1, $2, 'PENDING', $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        input.recipientId,
        input.channel ?? 'IN_APP',
        input.type,
        input.key,
        input.subject,
        input.body,
      ],
    );
  }

  async createInAppAndEmailOnce(input: CreateNotificationInput): Promise<void> {
    await this.createOnce({ ...input, channel: 'IN_APP' });
    await this.createOnce({ ...input, channel: 'EMAIL', key: `${input.key}:email` });
  }

  async listForUser(userId: string) {
    return this.database.query<{
      id: string;
      notification_type: string;
      subject: string;
      body: string;
      status: string;
      created_at: string;
      read_at: string | null;
    }>(
      `SELECT id, notification_type, subject, body, status, created_at, read_at
       FROM notifications WHERE recipient_id = $1 AND channel = 'IN_APP' ORDER BY created_at DESC`,
      [userId],
    );
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.database.query(
      `UPDATE notifications SET status = 'READ', read_at = NOW()
       WHERE id = $1 AND recipient_id = $2`,
      [notificationId, userId],
    );
  }

  async deliverPendingEmail(
    limit = 50,
  ): Promise<{ sent: number; failed: number }> {
    const rows = await this.database.query<{
      id: string;
      email: string;
      subject: string;
      body: string;
      attempts: number;
    }>(
      `SELECT n.id, u.email, n.subject, n.body, n.attempts
       FROM notifications n JOIN users u ON u.id = n.recipient_id
       WHERE n.channel = 'EMAIL' AND n.status = 'PENDING' AND n.attempts < 3
       ORDER BY n.created_at ASC LIMIT $1`,
      [limit],
    );
    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await this.transport.sendMail({
          from: env.smtpFrom,
          to: row.email,
          subject: row.subject,
          text: row.body,
          html: `<p>${row.body}</p>`,
        });
        await this.database.query(
          `UPDATE notifications SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE id = $1`,
          [row.id],
        );
        sent += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown email error';
        await this.database.query(
          `UPDATE notifications SET status = 'FAILED', attempts = attempts + 1, last_error = $2 WHERE id = $1`,
          [row.id, message],
        );
        failed += 1;
      }
    }
    return { sent, failed };
  }
}
