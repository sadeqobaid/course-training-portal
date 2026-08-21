import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AuthenticatedUser } from '../common/types.js';
import { EnrollmentsService } from '../enrollments/enrollments.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { CertificatesService } from '../certificates/certificates.service.js';
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  SubmitAttemptDto,
} from './assessments.dto.js';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly enrollments: EnrollmentsService,
    private readonly progress: ProgressService,
    private readonly certificates: CertificatesService,
  ) {}

  private async assertCanAuthorCourse(user: AuthenticatedUser, courseId: string) {
    const course = await this.database.one<{ created_by: string }>(
      'SELECT created_by FROM courses WHERE id = $1',
      [courseId],
    );
    if (!course) throw new NotFoundException('Course not found.');
    if (
      course.created_by !== user.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
    ) {
      throw new UnprocessableEntityException(
        'Instructors can author assessments only for courses they created.',
      );
    }
  }

  async create(user: AuthenticatedUser, courseId: string, dto: CreateAssessmentDto) {
    await this.assertCanAuthorCourse(user, courseId);
    const assessment = await this.database.one<{
      id: string;
      course_id: string;
      title: string;
    }>(
      `INSERT INTO assessments (course_id, title, is_published) VALUES ($1, $2, TRUE) RETURNING id, course_id, title`,
      [courseId, dto.title.trim()],
    );
    if (!assessment) throw new Error('Assessment creation failed.');
    return assessment;
  }

  async addQuestion(user: AuthenticatedUser, assessmentId: string, dto: CreateQuestionDto) {
    const assessment = await this.database.one<{ course_id: string }>(
      'SELECT course_id FROM assessments WHERE id = $1',
      [assessmentId],
    );
    if (!assessment) throw new NotFoundException('Assessment not found.');
    await this.assertCanAuthorCourse(user, assessment.course_id);
    const correctCount = dto.options.filter(
      (option) => option.isCorrect,
    ).length;
    if (correctCount !== 1)
      throw new BadRequestException(
        'Exactly one answer option must be marked correct.',
      );
    return this.database.transaction(async (client) => {
      const question = await client.query<{ id: string }>(
        `INSERT INTO assessment_questions (assessment_id, prompt, position) VALUES ($1, $2, $3) RETURNING id`,
        [assessmentId, dto.prompt.trim(), dto.position],
      );
      const questionId = question.rows[0]?.id;
      if (!questionId) throw new Error('Question creation failed.');
      const options: { id: string; optionText: string; isCorrect: boolean }[] =
        [];
      for (const option of dto.options) {
        const inserted = await client.query<{
          id: string;
          option_text: string;
          is_correct: boolean;
        }>(
          `INSERT INTO answer_options (question_id, option_text, is_correct)
           VALUES ($1, $2, $3) RETURNING id, option_text, is_correct`,
          [questionId, option.optionText.trim(), option.isCorrect],
        );
        const row = inserted.rows[0];
        if (!row) throw new Error('Answer option creation failed.');
        options.push({
          id: row.id,
          optionText: row.option_text,
          isCorrect: row.is_correct,
        });
      }
      return { id: questionId, options };
    });
  }

  async publicAssessment(courseId: string) {
    const assessment = await this.database.one<{
      id: string;
      title: string;
      passing_score_percent: string;
    }>(
      `SELECT id, title, passing_score_percent FROM assessments WHERE course_id = $1 AND is_published = TRUE`,
      [courseId],
    );
    if (!assessment)
      throw new NotFoundException('Published assessment not found.');
    const questions = await this.database.query<{
      id: string;
      prompt: string;
      position: number;
      option_id: string;
      option_text: string;
    }>(
      `SELECT q.id, q.prompt, q.position, o.id AS option_id, o.option_text
       FROM assessment_questions q JOIN answer_options o ON o.question_id = q.id
       WHERE q.assessment_id = $1 ORDER BY q.position, o.option_text`,
      [assessment.id],
    );
    return { assessment, questions };
  }

  async submit(
    user: AuthenticatedUser,
    enrollmentId: string,
    assessmentId: string,
    dto: SubmitAttemptDto,
  ) {
    const enrollment = await this.enrollments.ownedEnrollment(
      user,
      enrollmentId,
    );
    const assessment = await this.database.one<{
      id: string;
      course_id: string;
      passing_score_percent: string;
    }>(
      `SELECT id, course_id, passing_score_percent FROM assessments WHERE id = $1 AND is_published = TRUE`,
      [assessmentId],
    );
    if (!assessment || assessment.course_id !== enrollment.course_id)
      throw new UnprocessableEntityException(
        'Assessment does not belong to this enrollment course.',
      );
    const rows = await this.database.query<{
      question_id: string;
      option_id: string;
      is_correct: boolean;
    }>(
      `SELECT q.id AS question_id, o.id AS option_id, o.is_correct
       FROM assessment_questions q JOIN answer_options o ON o.question_id = q.id WHERE q.assessment_id = $1`,
      [assessmentId],
    );
    const correctByQuestion = new Map(
      rows
        .filter((row) => row.is_correct)
        .map((row) => [row.question_id, row.option_id]),
    );
    if (correctByQuestion.size === 0)
      throw new UnprocessableEntityException(
        'Assessment has no valid questions.',
      );
    const submitted = new Map(
      dto.answers.map((answer) => [answer.questionId, answer.optionId]),
    );
    if (submitted.size !== correctByQuestion.size)
      throw new BadRequestException(
        'One answer is required for each question.',
      );
    const correct = [...correctByQuestion.entries()].filter(
      ([questionId, optionId]) => submitted.get(questionId) === optionId,
    ).length;
    const scorePercent = Number(
      ((correct / correctByQuestion.size) * 100).toFixed(2),
    );
    const passed = scorePercent >= Number(assessment.passing_score_percent);
    const attempt = await this.database.one<{ id: string }>(
      `INSERT INTO assessment_attempts (assessment_id, enrollment_id, score_percent, passed) VALUES ($1, $2, $3, $4) RETURNING id`,
      [assessmentId, enrollmentId, scorePercent, passed],
    );
    if (!attempt) throw new Error('Attempt creation failed.');
    const completed = await this.progress.markCompletedIfEligible(
      enrollmentId,
      passed,
    );
    const certificate = completed
      ? await this.certificates.issueIfEligible(enrollmentId)
      : null;
    return {
      attemptId: attempt.id,
      scorePercent,
      passed,
      courseCompleted: completed,
      certificate,
    };
  }

  async hasPassingAttempt(enrollmentId: string): Promise<boolean> {
    const row = await this.database.one<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM assessment_attempts WHERE enrollment_id = $1 AND passed = TRUE) AS exists`,
      [enrollmentId],
    );
    return Boolean(row?.exists);
  }
}
