import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { AuthenticatedUser } from '../common/types.js';
import { CreateCourseDto, CreateLessonDto } from './courses.dto.js';

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  objectives: string;
  prerequisites: string;
  status: string;
  passing_score_percent: string;
  created_by: string;
  published_at: string | null;
  created_at: string;
};
type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  body_markdown: string;
  position: number;
  is_published: boolean;
};

@Injectable()
export class CoursesService {
  constructor(private readonly database: DatabaseService) {}

  async create(
    author: AuthenticatedUser,
    dto: CreateCourseDto,
  ): Promise<CourseRow> {
    const slug = dto.slug.trim().toLowerCase();
    try {
      const course = await this.database.one<CourseRow>(
        `INSERT INTO courses (title, slug, description, objectives, prerequisites, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at`,
        [
          dto.title.trim(),
          slug,
          dto.description.trim(),
          dto.objectives.trim(),
          dto.prerequisites?.trim() ?? '',
          author.id,
        ],
      );
      if (!course) throw new Error('Course creation did not return a row.');
      return course;
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('Course slug already exists.');
      throw error;
    }
  }

  async listPublished(): Promise<CourseRow[]> {
    return this.database.query<CourseRow>(
      `SELECT id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at
       FROM courses WHERE status = 'PUBLISHED' ORDER BY published_at DESC`,
    );
  }

  async findCourse(courseId: string): Promise<CourseRow> {
    const course = await this.database.one<CourseRow>(
      `SELECT id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at
       FROM courses WHERE id = $1`,
      [courseId],
    );
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }

  async detail(courseId: string) {
    const course = await this.findCourse(courseId);
    const lessons = await this.database.query<LessonRow>(
      `SELECT id, course_id, title, body_markdown, position, is_published
       FROM lessons WHERE course_id = $1 AND is_published = TRUE ORDER BY position ASC`,
      [courseId],
    );
    return { course, lessons };
  }

  async addLesson(
    author: AuthenticatedUser,
    courseId: string,
    dto: CreateLessonDto,
  ): Promise<LessonRow> {
    const course = await this.findCourse(courseId);
    if (
      course.created_by !== author.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(author.role)
    ) {
      throw new UnprocessableEntityException(
        'Only the owner or training administration can edit this course.',
      );
    }
    try {
      const lesson = await this.database.one<LessonRow>(
        `INSERT INTO lessons (course_id, title, body_markdown, position, is_published)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, course_id, title, body_markdown, position, is_published`,
        [
          courseId,
          dto.title.trim(),
          dto.bodyMarkdown.trim(),
          dto.position,
          dto.isPublished,
        ],
      );
      if (!lesson) throw new Error('Lesson creation did not return a row.');
      return lesson;
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('A lesson already uses this position.');
      throw error;
    }
  }

  async publish(
    author: AuthenticatedUser,
    courseId: string,
  ): Promise<CourseRow> {
    const course = await this.findCourse(courseId);
    if (
      course.created_by !== author.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(author.role)
    ) {
      throw new UnprocessableEntityException(
        'Only the owner or training administration can publish this course.',
      );
    }
    const lessons = await this.database.one<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM lessons WHERE course_id = $1 AND is_published = TRUE`,
      [courseId],
    );
    if (!lessons || Number(lessons.count) < 1)
      throw new UnprocessableEntityException(
        'At least one published lesson is required before publishing.',
      );
    const updated = await this.database.one<CourseRow>(
      `UPDATE courses SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, slug, description, objectives, prerequisites, status, passing_score_percent, created_by, published_at, created_at`,
      [courseId],
    );
    if (!updated) throw new NotFoundException('Course not found.');
    return updated;
  }

  async courseLessons(
    client: PoolClient,
    courseId: string,
  ): Promise<LessonRow[]> {
    const result = await client.query<LessonRow>(
      `SELECT id, course_id, title, body_markdown, position, is_published FROM lessons WHERE course_id = $1 AND is_published = TRUE ORDER BY position`,
      [courseId],
    );
    return result.rows;
  }
}
