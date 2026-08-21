// Script name: users.controller.ts
// Original location: backend/src/users/users.controller.ts
// What this script is: NestJS controller class exposing admin user management HTTP endpoints
// What it is used for: Defines routes and handlers for listing, creating, and updating managed users in the admin area
// Programming language: TypeScript
// Inputs: HTTP requests (route params, request body), current authenticated user via decorators
// Outputs: HTTP responses returned by UsersService methods (typically JSON); status codes managed by NestJS
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS, JWT authentication, role-based guard, UsersService, DTOs
// Downstream scripts/files/processes that consume the output: frontend admin UI, other backend services consuming admin user data, UsersService persists to database
// Risks and safe change note: Changing routes, guards, or role names can break access control; modifying DTOs or UsersService calls can affect persistence and validation—test auth, role checks, and database interactions when altering this file
// created by: Sadeq Obaid

// Import NestJS route and parameter decorators used to define controller handlers and to extract request data.
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
// Import a JWT authentication guard to protect routes by verifying tokens and attaching user info.
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import a custom decorator that injects the currently authenticated user into handler parameters.
import { CurrentUser } from '../common/current-user.decorator.js';
// Import a decorator to declare required roles on controller handlers.
import { Roles } from '../common/roles.decorator.js';
// Import a guard that enforces role checks specified by the Roles decorator.
import { RolesGuard } from '../common/roles.guard.js';
// Import the type that represents an authenticated user object provided by authentication.
import { AuthenticatedUser } from '../common/types.js';
// Import DTO classes that define the shape of incoming request bodies for create/update operations.
import { CreateManagedUserDto, UpdateManagedUserDto } from './users.dto.js';
// Import the UsersService which contains the business logic for user management and persistence.
import { UsersService } from './users.service.js';

// Apply the base route path to this controller so all handlers are under /admin/users.
@Controller('admin/users')
// Apply the JWT auth guard and roles guard to protect all routes in this controller.
@UseGuards(JwtAuthGuard, RolesGuard)
// Require the SYSTEM_ADMIN role for all handlers in this controller.
@Roles('SYSTEM_ADMIN')
// Declare and export the UsersController class that groups admin user management routes.
export class UsersController {
  // Inject UsersService via constructor for use in handler methods; stored as private readonly property.
  constructor(private readonly users: UsersService) {}

  // Map HTTP GET requests on the base controller route to this handler to list users.
  @Get()
  // Handler that returns the result of UsersService.list(); no input parameters required.
  list() {
    return this.users.list();
  }

  // Map HTTP POST requests on the base controller route to this handler to create a new managed user.
  @Post()
  // Handler that accepts a request body validated against CreateManagedUserDto and delegates creation to UsersService.
  create(@Body() dto: CreateManagedUserDto) {
    return this.users.create(dto);
  }

  // Map HTTP PATCH requests for a specific user id (/:id) to this handler to update a managed user.
  @Patch(':id')
  // Begin handler signature for update: accepts the current authenticated user, route param id, and request body dto.
  update(
    // Inject the currently authenticated user into the actor parameter to record who is performing the update.
    @CurrentUser() actor: AuthenticatedUser,
    // Extract the 'id' route parameter as a string identifying which managed user to update.
    @Param('id') id: string,
    // Extract the request body and validate it against UpdateManagedUserDto; passed to service for partial update.
    @Body() dto: UpdateManagedUserDto,
  ) {
    // Delegate the update operation to UsersService, forwarding actor, id, and dto; return its result (HTTP response).
    return this.users.update(actor, id, dto);
  }
}
