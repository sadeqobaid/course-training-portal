import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AuthenticatedUser } from '../common/types.js';

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

@Injectable()
export class EnrollmentsService {
  constructor(private readonly database: DatabaseService) {}

  async enroll(
    user: AuthenticatedUser,
    courseId: string,
  ): Promise<EnrollmentRow> {
    return this.database.transaction(async (client) => {
      const course = await client.query<{
        id: string;
        title: string;
        status: string;
      }>('SELECT id, title, status FROM courses WHERE id = $1 FOR UPDATE', [
        courseId,
      ]);
      if (!course.rows[0] || course.rows[0].status !== 'PUBLISHED')
        throw new UnprocessableEntityException(
          'Course is not available for enrollment.',
        );
      try {
        const result = await client.query<EnrollmentRow>(
          `INSERT INTO enrollments (learner_id, course_id) VALUES ($1, $2)
           RETURNING id, learner_id, course_id, status, enrolled_at, completed_at`,
          [user.id, courseId],
        );
        const enrollment = result.rows[0];
        if (!enrollment)
          throw new Error('Enrollment creation did not return a row.');
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
        return enrollment;
      } catch (error) {
        if ((error as { code?: string }).code === '23505')
          throw new ConflictException(
            'You are already enrolled in this course.',
          );
        throw error;
      }
    });
  }

  async myEnrollments(user: AuthenticatedUser): Promise<EnrollmentRow[]> {
    return this.database.query<EnrollmentRow>(
      `SELECT e.id, e.learner_id, e.course_id, e.status, e.enrolled_at, e.completed_at, c.title, c.description
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.learner_id = $1 ORDER BY e.enrolled_at DESC`,
      [user.id],
    );
  }

  async ownedEnrollment(
    user: AuthenticatedUser,
    enrollmentId: string,
  ): Promise<EnrollmentRow> {
    const enrollment = await this.database.one<EnrollmentRow>(
      `SELECT id, learner_id, course_id, status, enrolled_at, completed_at FROM enrollments WHERE id = $1`,
      [enrollmentId],
    );
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (
      enrollment.learner_id !== user.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
    )
      throw new UnprocessableEntityException('You do not own this enrollment.');
    return enrollment;
  }
}
