// Script name: management.controller.ts
// Original location: backend/src/management/management.controller.ts
// What this script is: A NestJS controller defining management-related HTTP endpoints and access controls.
// What it is used for: Exposes HTTP routes for fetching courses for an authenticated actor and creating announcements.
// Programming language: TypeScript
// Inputs: HTTP requests to /management/courses (GET) and /management/announcements (POST); authenticated user information and request body (CreateAnnouncementDto).
// Outputs: HTTP responses containing course lists or announcement creation results.
// Where output is saved or sent: HTTP/API (responses returned to the client); underlying persistence handled by ManagementService (database) — this file itself does not directly access the database.
// Technologies and services used or interacted with: NestJS framework, JWT authentication guard, custom RolesGuard, decorators for dependency injection and request handling, ManagementService.
// Downstream scripts/files/processes that consume the output: frontend clients consuming the API responses, ManagementService for business logic and persistence layers.
// Risks and safe change note: Changes to routes, guards, or role annotations can alter security boundaries; do not modify role lists or remove guards without thorough security review and tests. Keep endpoints and injected service signatures consistent with ManagementService.
// created by: Sadeq Obaid

// Import NestJS decorators and utilities required to define controllers and handle request bodies and HTTP verbs.
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
// Import the JWT authentication guard to enforce authenticated requests.
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import a custom decorator to extract the current authenticated user from the request.
import { CurrentUser } from '../common/current-user.decorator.js';
// Import a decorator to declare role-based access control metadata on handlers.
import { Roles } from '../common/roles.decorator.js';
// Import the RolesGuard implementation that enforces role-based access control based on metadata.
import { RolesGuard } from '../common/roles.guard.js';
// Import the type describing the shape of an authenticated user within the application.
import { AuthenticatedUser } from '../common/types.js';
// Import the DTO type used to validate and type the announcement payload from the request body.
import { CreateAnnouncementDto } from './management.dto.js';
// Import the service that contains the business logic for management operations; this controller delegates to it.
import { ManagementService } from './management.service.js';

// Declare a controller whose routes are prefixed with 'management'.
@Controller('management')
// Apply guards to all endpoints in this controller: both JWT authentication and role-based authorization.
@UseGuards(JwtAuthGuard, RolesGuard)
// Export the ManagementController class so NestJS can instantiate and use it.
export class ManagementController {
  // Constructor injects the ManagementService instance via NestJS dependency injection.
  constructor(private readonly management: ManagementService) {}

  // Define a GET handler for the 'courses' sub-route of this controller.
  @Get('courses')
  // Restrict access to users with any of these roles.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR')
  // Define the handler method that receives the currently authenticated user and returns courses applicable to them.
  courses(@CurrentUser() actor: AuthenticatedUser) {
    // Delegate to ManagementService.coursesFor to obtain the list of courses for the provided actor and return it as the HTTP response.
    return this.management.coursesFor(actor);
  }

  // Define a POST handler for the 'announcements' sub-route of this controller.
  @Post('announcements')
  // Restrict access to users with system or training admin roles.
  @Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN')
  // Define the handler method that receives the parsed request body as a CreateAnnouncementDto and delegates creation to the service.
  announce(@Body() dto: CreateAnnouncementDto) {
    // Delegate to ManagementService.announce to create an announcement using the DTO and return the result to the HTTP response.
    return this.management.announce(dto);
  }
}
