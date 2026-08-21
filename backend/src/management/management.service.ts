import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types.js';
import { DatabaseService } from '../database/database.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateAnnouncementDto } from './management.dto.js';

@Injectable()
export class ManagementService {
  constructor(
    private readonly database: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  coursesFor(actor: AuthenticatedUser) {
    const canSeeAll = ['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(actor.role);
    return this.database.query<{
      id: string;
      title: string;
      slug: string;
      status: string;
      created_by: string;
      lesson_count: string;
      assessment_count: string;
      enrollment_count: string;
      completed_count: string;
    }>(
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
      [canSeeAll, actor.id],
    );
  }

  async announce(dto: CreateAnnouncementDto): Promise<{ recipients: number }> {
    const recipientRole = dto.recipientRole ?? 'LEARNER';
    const recipients = await this.database.query<{ id: string }>(
      `SELECT id FROM users WHERE is_active = TRUE AND role = $1`,
      [recipientRole],
    );
    await Promise.all(
      recipients.map((recipient) =>
        this.notifications.createInAppAndEmailOnce({
          recipientId: recipient.id,
          type: 'ANNOUNCEMENT',
          key: `announcement:${Date.now()}:${recipient.id}`,
          subject: dto.subject.trim(),
          body: dto.body.trim(),
        }),
      ),
    );
    return { recipients: recipients.length };
  }
}
