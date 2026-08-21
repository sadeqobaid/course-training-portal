// Script name: enrollments.controller.ts
// Original location: backend/src/enrollments/enrollments.controller.ts
// What this script is: A NestJS controller that defines HTTP endpoints related to course enrollments and progress.
// What it is used for: Exposes API routes for enrolling in courses, listing a user's enrollments, marking lessons complete, and retrieving progress summaries.
// Programming language: TypeScript
// Inputs: HTTP requests authenticated via JWT; route parameters (courseId, enrollmentId, lessonId); decorated CurrentUser providing AuthenticatedUser.
// Outputs: Service return values (typically JSON payloads) sent as HTTP responses.
// Where output is saved or sent: HTTP/API (JSON responses to clients); downstream services may persist changes to a database via service layers (not directly by this file).
// Technologies and services used or interacted with: NestJS framework, JwtAuthGuard for authentication, EnrollmentsService, ProgressService, decorator-based routing.
// Downstream scripts/files/processes that consume the output: Frontend clients or API consumers receive JSON responses; persistence and further processing occur in service and repository layers (EnrollmentsService, ProgressService).
// Risks and safe change note: Changes to routes, authentication guards, or parameter handling can break client integrations and authorization checks; ensure unit/integration tests cover access control and service interactions before modifying.
// created by: Sadeq Obaid

// Import NestJS decorators and utilities used to define controllers, route handlers, and parameter decorators.
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
// Import the JWT authentication guard to protect routes and require authenticated users.
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import a decorator that injects the current authenticated user into handler parameters.
import { CurrentUser } from '../common/current-user.decorator.js';
// Import the type describing the authenticated user shape used by handler signatures.
import { AuthenticatedUser } from '../common/types.js';
// Import the service responsible for enrollment operations (enroll, list user enrollments, ownership checks).
import { EnrollmentsService } from './enrollments.service.js';
// Import the service responsible for progress-related operations (complete lessons, summaries).
import { ProgressService } from '../progress/progress.service.js';

// Apply the Controller decorator to define this class as a NestJS controller with default route prefix (none here).
@Controller()
// Apply the JWT guard to all routes in this controller to require authentication on every endpoint.
@UseGuards(JwtAuthGuard)
// Export the controller class that groups enrollment-related route handlers and injects required services.
export class EnrollmentsController {
  // Define the constructor where service dependencies are injected by NestJS's DI container.
  constructor(
    // Inject the EnrollmentsService as a private readonly member for enrollment operations.
    private readonly enrollments: EnrollmentsService,
    // Inject the ProgressService as a private readonly member for progress operations.
    private readonly progress: ProgressService,
  ) {}
  // Define a POST route at 'courses/:courseId/enroll' to enroll the authenticated user into a course.
  @Post('courses/:courseId/enroll')
  // Handler method for enrolling a user; parameters are the current user and the courseId route parameter.
  enroll(
    // Inject the currently authenticated user into the handler using the CurrentUser decorator.
    @CurrentUser() user: AuthenticatedUser,
    // Extract the 'courseId' route parameter as a string for the enrollment operation.
    @Param('courseId') courseId: string,
  ) {
    // Delegate the enrollment operation to the EnrollmentsService and return its result as the HTTP response.
    return this.enrollments.enroll(user, courseId);
  }

  // Define a GET route at 'me/enrollments' to return the authenticated user's enrollments.
  @Get('me/enrollments')
  // Handler method to fetch the authenticated user's enrollments; takes the current user as input.
  mine(@CurrentUser() user: AuthenticatedUser) {
    // Delegate retrieval of the user's enrollments to the EnrollmentsService and return the result.
    return this.enrollments.myEnrollments(user);
  }

  // Define a POST route to mark a lesson complete for a specific enrollment and lesson.
  @Post('enrollments/:enrollmentId/lessons/:lessonId/complete')
  // Handler method for completing a lesson; parameters include the current user and route params for enrollment and lesson IDs.
  complete(
    // Inject the currently authenticated user into the handler.
    @CurrentUser() user: AuthenticatedUser,
    // Extract the 'enrollmentId' route parameter as a string.
    @Param('enrollmentId') enrollmentId: string,
    // Extract the 'lessonId' route parameter as a string.
    @Param('lessonId') lessonId: string,
  ) {
    // Delegate the completion operation to the ProgressService and return its result as the HTTP response.
    return this.progress.completeLesson(user, enrollmentId, lessonId);
  }

  // Define a GET route to retrieve a progress summary for a specific enrollment.
  @Get('enrollments/:enrollmentId/progress')
  // Asynchronous handler method that validates ownership and then returns progress summary for an enrollment.
  async summary(
    // Inject the current authenticated user into the handler.
    @CurrentUser() user: AuthenticatedUser,
    // Extract the 'enrollmentId' route parameter for which the summary is requested.
    @Param('enrollmentId') enrollmentId: string,
  ) {
    // Ensure the authenticated user owns the requested enrollment by delegating to EnrollmentsService; await the check.
    await this.enrollments.ownedEnrollment(user, enrollmentId);
    // After ownership is confirmed, delegate summary computation to ProgressService and return the result.
    return this.progress.summary(enrollmentId);
  }
}
