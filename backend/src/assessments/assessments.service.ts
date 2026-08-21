// Script name: assessments.service.ts
// Original location: backend/src/assessments/assessments.service.ts
// What this script is: A NestJS service implementing business logic for assessments, questions, attempts, and related interactions.
// What it is used for: Creating and managing published assessments and questions, validating submissions, recording attempts, and coordinating progress/certificate issuance.
// Programming language: TypeScript
// Inputs: AuthenticatedUser, courseId, assessmentId, enrollmentId, CreateAssessmentDto, CreateQuestionDto, SubmitAttemptDto, database rows/queries.
// Outputs: Database records (assessments, questions, options, attempts), returned objects to callers (assessment info, questions, submission results).
// Where output is saved or sent: database/table: Postgres tables (assessments, assessment_questions, answer_options, assessment_attempts, etc.), filesystem path: None, browser/session storage: None, JSON: returned DTO-like objects, HTTP/API: exposed via controllers, SMTP: None, Docker service: None, console: None
// Technologies and services used or interacted with: NestJS, Postgres accessed via DatabaseService, EnrollmentsService, ProgressService, CertificatesService.
// Downstream scripts/files/processes that consume the output: API controllers that call this service, reporting modules, progress/certificates services, client applications consuming API responses.
// Risks and safe change note: Changing SQL, permission checks, or scoring logic may break data integrity or allow unauthorized actions; update DB migrations and unit/integration tests and validate permission flows before making changes.
// created by: Sadeq Obaid

// Import NestJS exceptions and Injectable decorator used throughout the service.
import {
  // Import BadRequestException to indicate invalid client inputs.
  BadRequestException,
  // Import Injectable to mark the service as injectable into NestJS DI.
  Injectable,
  // Import NotFoundException to signal missing resources.
  NotFoundException,
  // Import UnprocessableEntityException for domain validation failures.
  UnprocessableEntityException,
} from '@nestjs/common';
// Import a DatabaseService wrapper used for querying and transactions against the DB.
import { DatabaseService } from '../database/database.service.js';
// Import the authenticated user type used to enforce ownership and roles.
import { AuthenticatedUser } from '../common/types.js';
// Import EnrollmentsService to resolve and validate enrollment ownership and associations.
import { EnrollmentsService } from '../enrollments/enrollments.service.js';
// Import ProgressService to mark course/module progress/completion as part of submission handling.
import { ProgressService } from '../progress/progress.service.js';
// Import CertificatesService to issue certificates when completion criteria are met.
import { CertificatesService } from '../certificates/certificates.service.js';
// Import DTO types that define the shapes of inputs accepted by methods in this service.
import {
  CreateAssessmentDto,
  CreateQuestionDto,
  SubmitAttemptDto,
} from './assessments.dto.js';

// Mark the class as injectable so NestJS can provide its dependencies.
@Injectable()
export class AssessmentsService {
  // Construct the service with required dependencies injected by NestJS.
  constructor(
    // Database wrapper used for queries and transactions.
    private readonly database: DatabaseService,
    // EnrollmentsService for verifying ownership and enrollment data.
    private readonly enrollments: EnrollmentsService,
    // ProgressService used to mark course progress/completion.
    private readonly progress: ProgressService,
    // CertificatesService used to issue certificates upon completion.
    private readonly certificates: CertificatesService,
  ) {}
  
  // Private helper to ensure the caller is allowed to author content for the given course.
  private async assertCanAuthorCourse(user: AuthenticatedUser, courseId: string) {
    // Query the courses table to get the creator id for authorization checks.
    const course = await this.database.one<{ created_by: string }>(
      // Select the creator of the course to compare against the requesting user.
      'SELECT created_by FROM courses WHERE id = $1',
      // Pass courseId as parameter to avoid SQL injection and bind properly.
      [courseId],
    );
    // If no course row was returned, throw a 404 Not Found to the caller.
    if (!course) throw new NotFoundException('Course not found.');
    // Check that the requesting user either created the course or has an admin role.
    if (
      course.created_by !== user.id &&
      !['SYSTEM_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
    ) {
      // If the user is not authorized, surface a domain-specific validation error.
      throw new UnprocessableEntityException(
        'Instructors can author assessments only for courses they created.',
      );
    }
  }

  // Create a new assessment for a course after asserting authoring rights.
  async create(user: AuthenticatedUser, courseId: string, dto: CreateAssessmentDto) {
    // Ensure the caller has permission to author this course.
    await this.assertCanAuthorCourse(user, courseId);
    // Insert a published assessment row and return its identifying columns.
    const assessment = await this.database.one<{
      id: string;
      course_id: string;
      title: string;
    }>(
      // SQL to insert a new assessment and return id, course_id, and title.
      `INSERT INTO assessments (course_id, title, is_published) VALUES ($1, $2, TRUE) RETURNING id, course_id, title`,
      // Parameters: courseId and trimmed title from the DTO to avoid surrounding whitespace.
      [courseId, dto.title.trim()],
    );
    // If insertion did not return a row, escalate as an internal error.
    if (!assessment) throw new Error('Assessment creation failed.');
    // Return the newly created assessment record to the caller.
    return assessment;
  }

  // Add a question to an existing assessment after verifying author rights and DTO constraints.
  async addQuestion(user: AuthenticatedUser, assessmentId: string, dto: CreateQuestionDto) {
    // Fetch the assessment's course_id to verify the caller can author its course.
    const assessment = await this.database.one<{ course_id: string }>(
      // Select course_id for the provided assessment id.
      'SELECT course_id FROM assessments WHERE id = $1',
      // Bind the assessmentId parameter.
      [assessmentId],
    );
    // If no assessment was found, report a 404 Not Found.
    if (!assessment) throw new NotFoundException('Assessment not found.');
    // Assert the caller is authorized to author content for the associated course.
    await this.assertCanAuthorCourse(user, assessment.course_id);
    // Count correct options in the provided DTO to enforce exactly-one-correct rule.
    const correctCount = dto.options.filter(
      // Filter options array for those flagged as correct.
      (option) => option.isCorrect,
    ).length;
    // If the DTO does not mark exactly one option correct, bail with a 400.
    if (correctCount !== 1)
      throw new BadRequestException(
        'Exactly one answer option must be marked correct.',
      );
    // Use a DB transaction to insert the question and its options atomically.
    return this.database.transaction(async (client) => {
      // Insert the question row and return its id.
      const question = await client.query<{ id: string }>(
        // SQL to insert a question with assessment_id, prompt, and position.
        `INSERT INTO assessment_questions (assessment_id, prompt, position) VALUES ($1, $2, $3) RETURNING id`,
        // Bind assessmentId, trimmed prompt, and position.
        [assessmentId, dto.prompt.trim(), dto.position],
      );
      // Extract the inserted question id from the returned rows.
      const questionId = question.rows[0]?.id;
      // If no id was returned, raise an error indicating failure to create the question.
      if (!questionId) throw new Error('Question creation failed.');
      // Prepare an array to collect the inserted options with normalized keys.
      const options: { id: string; optionText: string; isCorrect: boolean }[] =
        [];
      // Iterate through DTO options to insert each answer option row.
      for (const option of dto.options) {
        // Insert an answer option row and return id, option_text, and is_correct.
        const inserted = await client.query<{
          id: string;
          option_text: string;
          is_correct: boolean;
        }>(
          // SQL to insert an answer option linked to the question id.
          `INSERT INTO answer_options (question_id, option_text, is_correct)
           VALUES ($1, $2, $3) RETURNING id, option_text, is_correct`,
          // Bind questionId, trimmed option text, and boolean isCorrect flag.
          [questionId, option.optionText.trim(), option.isCorrect],
        );
        // Take the first returned row describing the inserted option.
        const row = inserted.rows[0];
        // If the insertion failed to return a row, escalate as an error.
        if (!row) throw new Error('Answer option creation failed.');
        // Push a normalized representation of the option into the options array.
        options.push({
          id: row.id,
          optionText: row.option_text,
          isCorrect: row.is_correct,
        });
      }
      // Return the created question id together with its inserted options.
      return { id: questionId, options };
    });
  }

  // Expose the published assessment and its questions/options for a course for public consumption.
  async publicAssessment(courseId: string) {
    // Query for a published assessment associated with the course id.
    const assessment = await this.database.one<{
      id: string;
      title: string;
      passing_score_percent: string;
    }>(
      // Select id, title, and passing threshold for published assessment for the course.
      `SELECT id, title, passing_score_percent FROM assessments WHERE course_id = $1 AND is_published = TRUE`,
      // Bind the courseId parameter.
      [courseId],
    );
    // If no published assessment exists for the course, throw NotFound.
    if (!assessment)
      throw new NotFoundException('Published assessment not found.');
    // Query all questions and their answer options for the assessment, ordering by question position and option text.
    const questions = await this.database.query<{
      id: string;
      prompt: string;
      position: number;
      option_id: string;
      option_text: string;
    }>(
      // SQL joins assessment_questions with answer_options to return each option row alongside its question.
      `SELECT q.id, q.prompt, q.position, o.id AS option_id, o.option_text
       FROM assessment_questions q JOIN answer_options o ON o.question_id = q.id
       WHERE q.assessment_id = $1 ORDER BY q.position, o.option_text`,
      // Bind assessment.id to the query to filter options for this assessment.
      [assessment.id],
    );
    // Return an object containing assessment metadata and the flattened questions/options.
    return { assessment, questions };
  }

  // Handle submission of an assessment attempt: validate, score, persist, and trigger progress/certificate flows.
  async submit(
    user: AuthenticatedUser,
    enrollmentId: string,
    assessmentId: string,
    dto: SubmitAttemptDto,
  ) {
    // Ensure the enrollment belongs to the authenticated user and retrieve it.
    const enrollment = await this.enrollments.ownedEnrollment(
      user,
      enrollmentId,
    );
    // Fetch the published assessment and its course association for validation.
    const assessment = await this.database.one<{
      id: string;
      course_id: string;
      passing_score_percent: string;
    }>(
      // Select assessment ensuring it is published to allow submissions.
      `SELECT id, course_id, passing_score_percent FROM assessments WHERE id = $1 AND is_published = TRUE`,
      // Bind the assessmentId parameter.
      [assessmentId],
    );
    // If assessment missing or not part of the enrollment's course, return a domain validation error.
    if (!assessment || assessment.course_id !== enrollment.course_id)
      throw new UnprocessableEntityException(
        'Assessment does not belong to this enrollment course.',
      );
    // Query all question-option rows for the assessment including correctness flag.
    const rows = await this.database.query<{
      question_id: string;
      option_id: string;
      is_correct: boolean;
    }>(
      // SQL to retrieve every option per question for computing correct answers per question.
      `SELECT q.id AS question_id, o.id AS option_id, o.is_correct
       FROM assessment_questions q JOIN answer_options o ON o.question_id = q.id WHERE q.assessment_id = $1`,
      // Bind assessmentId to scope the query.
      [assessmentId],
    );
    // Build a map of the correct option id per question id from the queried rows.
    const correctByQuestion = new Map(
      rows
        .filter((row) => row.is_correct)
        .map((row) => [row.question_id, row.option_id]),
    );
    // If there are no correct answers (assessment malformed), reject the submission.
    if (correctByQuestion.size === 0)
      throw new UnprocessableEntityException(
        'Assessment has no valid questions.',
      );
    // Normalize submitted answers into a map questionId -> optionId for quick lookup.
    const submitted = new Map(
      dto.answers.map((answer) => [answer.questionId, answer.optionId]),
    );
    // Ensure the submission provided exactly one answer per question present in the assessment.
    if (submitted.size !== correctByQuestion.size)
      throw new BadRequestException(
        'One answer is required for each question.',
      );
    // Count correct answers by comparing submitted option ids to the correct ones per question.
    const correct = [...correctByQuestion.entries()].filter(
      ([questionId, optionId]) => submitted.get(questionId) === optionId,
    ).length;
    // Compute the percentage score with two decimal precision.
    const scorePercent = Number(
      ((correct / correctByQuestion.size) * 100).toFixed(2),
    );
    // Determine pass/fail by comparing against assessment's passing_score_percent.
    const passed = scorePercent >= Number(assessment.passing_score_percent);
    // Persist the attempt row and return its id for response.
    const attempt = await this.database.one<{ id: string }>(
      `INSERT INTO assessment_attempts (assessment_id, enrollment_id, score_percent, passed) VALUES ($1, $2, $3, $4) RETURNING id`,
      // Bind assessmentId, enrollmentId, numeric scorePercent, and passed boolean.
      [assessmentId, enrollmentId, scorePercent, passed],
    );
    // If attempt insert failed to return a row, escalate as an internal error.
    if (!attempt) throw new Error('Attempt creation failed.');
    // Notify ProgressService to mark course/module completed if eligible based on passed status.
    const completed = await this.progress.markCompletedIfEligible(
      enrollmentId,
      passed,
    );
    // If completion occurred, attempt to issue a certificate via CertificatesService; otherwise null.
    const certificate = completed
      ? await this.certificates.issueIfEligible(enrollmentId)
      : null;
    // Return a structured result containing attempt id, score, pass status, and completion/certificate info.
    return {
      attemptId: attempt.id,
      scorePercent,
      passed,
      courseCompleted: completed,
      certificate,
    };
  }

  // Query whether an enrollment already has a passing assessment attempt.
  async hasPassingAttempt(enrollmentId: string): Promise<boolean> {
    // Execute an EXISTS query to check for any passed attempt rows for the enrollment.
    const row = await this.database.one<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM assessment_attempts WHERE enrollment_id = $1 AND passed = TRUE) AS exists`,
      // Bind the enrollmentId parameter for the EXISTS check.
      [enrollmentId],
    );
    // Return the boolean result coerced from the query row (handles null/undefined defensively).
    return Boolean(row?.exists);
  }
}
