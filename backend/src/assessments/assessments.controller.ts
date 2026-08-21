// Script name: assessments.controller.ts
// Original location: backend/src/assessments/assessments.controller.ts
// What this script is: A NestJS controller that defines HTTP endpoints for assessment-related actions.
// What it is used for: Exposes routes to create assessments, add questions, retrieve public assessments, and submit attempts; delegates business logic to AssessmentsService.
// Programming language: TypeScript
// Inputs: HTTP requests with path parameters, JSON bodies (DTOs), and authenticated user context injected by guards/decorators.
// Outputs: Service responses (objects/promises) returned to the HTTP caller as responses.
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS framework, JWT authentication guard, role-based guard, AssessmentsService, DTOs for validation.
// Downstream scripts/files/processes that consume the output: Frontend clients, other backend services, and persistence layer accessed by AssessmentsService.
// Risks and safe change note: Modifying routes, guards, or DTO shapes can break API contracts and security; ensure tests and compatibility checks before changes; keep role restrictions and authentication intact.
// created by: Sadeq Obaid

// Import NestJS decorators and parameter decorators used for routing and request binding.
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
// Import JWT auth guard to protect endpoints requiring authentication.
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import decorator to extract current authenticated user from request.
import { CurrentUser } from '../common/current-user.decorator.js';
// Import Roles decorator to declare required roles for endpoints.
import { Roles } from '../common/roles.decorator.js';
// Import guard that enforces role-based access control.
import { RolesGuard } from '../common/roles.guard.js';
// Import type representing the authenticated user payload.
import { AuthenticatedUser } from '../common/types.js';
// Import service providing business logic for assessments.
import { AssessmentsService } from './assessments.service.js';
// Import DTO types for request validation and payload shapes.
import {
  // DTO for creating an assessment resource.
  CreateAssessmentDto,
  // DTO for creating a question under an assessment.
  CreateQuestionDto,
  // DTO for submitting an assessment attempt payload.
  SubmitAttemptDto,
} from './assessments.dto.js';

// Define this class as a NestJS controller (no global route prefix specified here).
@Controller()
// Export controller class that maps HTTP routes to service methods.
export class AssessmentsController {
  // Constructor with AssessmentsService injected via Nest's DI; stored as a private readonly property for use by handlers.
  constructor(private readonly assessments: AssessmentsService) {}

  // Map POST /courses/:courseId/assessments to the following handler to create a new assessment for a course.
  @Post('courses/:courseId/assessments')
  // Apply JwtAuthGuard and RolesGuard to require authenticated user and role checks on this route.
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Restrict access to users with one of these administrative or instructor roles.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  // Handler method named create that will receive injected parameters and body for creating an assessment.
  create(
    // Inject the currently authenticated user into the handler; typed as AuthenticatedUser.
    @CurrentUser() user: AuthenticatedUser,
    // Extract the courseId path parameter from the request URL.
    @Param('courseId') courseId: string,
    // Bind the request body to the CreateAssessmentDto shape for validation and use.
    @Body() dto: CreateAssessmentDto,
  ) {
    // Delegate creation logic to AssessmentsService.create and return its result to the HTTP caller.
    return this.assessments.create(user, courseId, dto);
  }

  // Map POST /assessments/:assessmentId/questions to add a question to an existing assessment.
  @Post('assessments/:assessmentId/questions')
  // Require authenticated user and role checks on this route as well.
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Only allow specified roles to add questions.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  // Handler method addQuestion to accept the assessment id and question payload.
  addQuestion(
    // Inject the currently authenticated user into the handler.
    @CurrentUser() user: AuthenticatedUser,
    // Extract assessmentId from the path to identify which assessment to update.
    @Param('assessmentId') assessmentId: string,
    // Bind the request body to CreateQuestionDto representing the new question data.
    @Body() dto: CreateQuestionDto,
  ) {
    // Delegate question addition to the AssessmentsService and return its result.
    return this.assessments.addQuestion(user, assessmentId, dto);
  }

  // Map GET /courses/:courseId/assessment to retrieve a public view of the course assessment.
  @Get('courses/:courseId/assessment')
  // Require authentication for accessing this route (JWT guard only).
  @UseGuards(JwtAuthGuard)
  // Handler method get to fetch the public assessment data for a course.
  get(@Param('courseId') courseId: string) {
    // Delegate to service method publicAssessment which retrieves the assessment for the given courseId.
    return this.assessments.publicAssessment(courseId);
  }

  // Map POST /enrollments/:enrollmentId/assessments/:assessmentId/attempts to submit an assessment attempt for an enrollment.
  @Post('enrollments/:enrollmentId/assessments/:assessmentId/attempts')
  // Require authentication for submitting attempts.
  @UseGuards(JwtAuthGuard)
  // Handler method submit to process an attempt submission with enrollment context and assessment identifier.
  submit(
    // Inject the authenticated user submitting the attempt.
    @CurrentUser() user: AuthenticatedUser,
    // Extract the enrollmentId path parameter to bind the attempt to a specific enrollment.
    @Param('enrollmentId') enrollmentId: string,
    // Extract the assessmentId path parameter to identify which assessment the attempt targets.
    @Param('assessmentId') assessmentId: string,
    // Bind the submission payload to SubmitAttemptDto for processing and validation.
    @Body() dto: SubmitAttemptDto,
  ) {
    // Delegate attempt submission to AssessmentsService.submit and return its outcome to the caller.
    return this.assessments.submit(user, enrollmentId, assessmentId, dto);
  }
}
