import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AuthenticatedUser } from '../common/types.js';
import { EnrollmentsService } from '../enrollments/enrollments.service.js';

@Injectable()
export class ProgressService {
  constructor(
    private readonly database: DatabaseService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  async completeLesson(
    user: AuthenticatedUser,
    enrollmentId: string,
    lessonId: string,
  ) {
    const enrollment = await this.enrollments.ownedEnrollment(
      user,
      enrollmentId,
    );
    const lesson = await this.database.one<{ id: string }>(
      `SELECT id FROM lessons WHERE id = $1 AND course_id = $2 AND is_published = TRUE`,
      [lessonId, enrollment.course_id],
    );
    if (!lesson)
      throw new NotFoundException(
        'Published lesson does not belong to this enrollment course.',
      );
    await this.database.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, completed_at, last_viewed_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (enrollment_id, lesson_id)
       DO UPDATE SET completed_at = COALESCE(lesson_progress.completed_at, NOW()), last_viewed_at = NOW()`,
      [enrollmentId, lessonId],
    );
    return this.summary(enrollmentId);
  }

  async summary(enrollmentId: string) {
    const row = await this.database.one<{ total: string; completed: string }>(
      `SELECT COUNT(l.id)::text AS total,
              COUNT(lp.id) FILTER (WHERE lp.completed_at IS NOT NULL)::text AS completed
       FROM enrollments e
       JOIN lessons l ON l.course_id = e.course_id AND l.is_published = TRUE
       LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
       WHERE e.id = $1 GROUP BY e.id`,
      [enrollmentId],
    );
    if (!row) throw new NotFoundException('Enrollment not found.');
    const total = Number(row.total);
    const completed = Number(row.completed);
    return {
      totalLessons: total,
      completedLessons: completed,
      progressPercent: total === 0 ? 0 : Math.floor((completed / total) * 100),
    };
  }

  async markCompletedIfEligible(
    enrollmentId: string,
    hasPassingAttempt: boolean,
  ): Promise<boolean> {
    const progress = await this.summary(enrollmentId);
    if (
      progress.totalLessons === 0 ||
      progress.completedLessons !== progress.totalLessons ||
      !hasPassingAttempt
    )
      return false;
    await this.database.query(
      `UPDATE enrollments SET status = 'COMPLETED', completed_at = COALESCE(completed_at, NOW()) WHERE id = $1`,
      [enrollmentId],
    );
    return true;
  }
}
