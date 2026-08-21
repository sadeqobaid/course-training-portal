// Script name: courses.controller.ts
// Original location: backend/src/courses/courses.controller.ts
// What this script is: NestJS controller defining HTTP endpoints for courses and lessons.
// What it is used for: Exposes routes to list, view, create, add lessons to, and publish courses.
// Programming language: TypeScript
// Inputs: HTTP requests (path params, request body), authenticated user from JWT guard.
// Outputs: HTTP responses produced by service methods (JSON payloads / status codes).
// Where output is saved or sent: HTTP/API (and persisted via CoursesService to underlying storage as applicable).
// Technologies and services used or interacted with: NestJS framework, JWT authentication guard, custom Roles guard/decorator, CoursesService.
// Downstream scripts/files/processes that consume the output: API clients, frontend applications, other backend services that call these endpoints.
// Risks and safe change note: Modifying route signatures, guard usage, or role lists can break authorization and client integrations; change only with coordinated API versioning and tests.
// created by: Sadeq Obaid

// Import NestJS decorators and types used to define routes, extract params/body, and apply guards.
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
// Import JWT authentication guard to enforce authenticated access where applied.
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import a guard that enforces role-based access control.
import { RolesGuard } from '../common/roles.guard.js';
// Import a decorator used to annotate which roles can access a route.
import { Roles } from '../common/roles.decorator.js';
// Import a decorator to resolve the current authenticated user from the request.
import { CurrentUser } from '../common/current-user.decorator.js';
// Import a type describing the authenticated user object shape.
import { AuthenticatedUser } from '../common/types.js';
// Import DTO types used for validating and typing incoming request bodies for courses and lessons.
import { CreateCourseDto, CreateLessonDto } from './courses.dto.js';
// Import the service that contains business logic for courses; controller delegates to it.
import { CoursesService } from './courses.service.js';

// Apply the 'courses' base route to all handlers in this controller.
@Controller('courses')
export class CoursesController {
  // Constructor injects the CoursesService instance for use in handler methods.
  constructor(private readonly courses: CoursesService) {}

  // Map HTTP GET /courses to this handler to list published courses.
  @Get()
  list() {
    // Delegate to the service to retrieve published courses and return the result as the response.
    return this.courses.listPublished();
  }

  // Map HTTP GET /courses/:id to this handler to get course details by id.
  @Get(':id')
  detail(@Param('id') id: string) {
    // Delegate to the service to fetch a single course detail using the path parameter id.
    return this.courses.detail(id);
  }

  // Map HTTP POST /courses to this handler to create a new course.
  @Post()
  // Apply JWT and Roles guards to protect this route and enforce authentication/authorization.
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Allow only system/training admins and instructors to access this create route.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourseDto) {
    // Pass the authenticated user and validated DTO to the service to create a course and return the result.
    return this.courses.create(user, dto);
  }

  // Map HTTP POST /courses/:id/lessons to this handler to add a lesson to a course.
  @Post(':id/lessons')
  // Protect this endpoint with JWT and Roles guards.
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Restrict access to admins and instructors for adding lessons.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  addLesson(
    // Resolve the current authenticated user from the request.
    @CurrentUser() user: AuthenticatedUser,
    // Get the course id from the request path parameters.
    @Param('id') id: string,
    // Validate and type the incoming lesson creation payload from the request body.
    @Body() dto: CreateLessonDto,
  ) {
    // Delegate to the service to add the lesson to the given course and return the updated or created resource.
    return this.courses.addLesson(user, id, dto);
  }

  // Map HTTP POST /courses/:id/publish to this handler to publish a course.
  @Post(':id/publish')
  // Apply guards to ensure only authenticated and appropriately authorized users can publish.
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Restrict publishing to system and training administrators.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN')
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    // Delegate to the service to perform publish action and return the result (status or updated course).
    return this.courses.publish(user, id);
  }
  // End of CoursesController class definition.
}
