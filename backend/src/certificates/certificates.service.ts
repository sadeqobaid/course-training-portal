import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class CertificatesService {
  constructor(private readonly database: DatabaseService) {}

  async issueIfEligible(enrollmentId: string) {
    return this.database.transaction(async (client) => {
      const existing = await client.query<{
        id: string;
        certificate_number: string;
        verification_code: string;
        issued_at: string;
      }>(
        `SELECT id, certificate_number, verification_code, issued_at FROM certificates WHERE enrollment_id = $1`,
        [enrollmentId],
      );
      if (existing.rows[0]) return existing.rows[0];
      const enrollment = await client.query<{
        learner_id: string;
        status: string;
        title: string;
      }>(
        `SELECT e.learner_id, e.status, c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.id = $1 FOR UPDATE`,
        [enrollmentId],
      );
      if (!enrollment.rows[0] || enrollment.rows[0].status !== 'COMPLETED')
        return null;
      const certificateNumber = `CTP-${new Date().getUTCFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
      const verificationCode = randomBytes(18).toString('hex');
      const certificate = await client.query<{
        id: string;
        certificate_number: string;
        verification_code: string;
        issued_at: string;
      }>(
        `INSERT INTO certificates (enrollment_id, certificate_number, verification_code)
         VALUES ($1, $2, $3) RETURNING id, certificate_number, verification_code, issued_at`,
        [enrollmentId, certificateNumber, verificationCode],
      );
      await client.query(
        `INSERT INTO notifications (recipient_id, channel, status, notification_type, idempotency_key, subject, body)
         VALUES ($1, 'IN_APP', 'PENDING', 'CERTIFICATE_ISSUED', $2, $3, $4),
                ($1, 'EMAIL', 'PENDING', 'CERTIFICATE_ISSUED', $2 || ':email', $3, $4)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          enrollment.rows[0].learner_id,
          `certificate:${enrollmentId}`,
          'Certificate available',
          `Your certificate for ${enrollment.rows[0].title} is ready.`,
        ],
      );
      return certificate.rows[0] ?? null;
    });
  }

  async mine(userId: string) {
    return this.database.query<{
      certificate_number: string;
      verification_code: string;
      issued_at: string;
      title: string;
    }>(
      `SELECT c.certificate_number, c.verification_code, c.issued_at, course.title
       FROM certificates c JOIN enrollments e ON e.id = c.enrollment_id JOIN courses course ON course.id = e.course_id
       WHERE e.learner_id = $1 ORDER BY c.issued_at DESC`,
      [userId],
    );
  }

  async verify(code: string) {
    return this.database.one<{
      certificate_number: string;
      issued_at: string;
      title: string;
      full_name: string;
    }>(
      `SELECT c.certificate_number, c.issued_at, course.title, u.full_name
       FROM certificates c JOIN enrollments e ON e.id = c.enrollment_id
       JOIN courses course ON course.id = e.course_id JOIN users u ON u.id = e.learner_id
       WHERE c.verification_code = $1`,
      [code],
    );
  }
}
