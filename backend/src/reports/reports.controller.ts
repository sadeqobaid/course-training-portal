// Script name: reports.controller.ts
// Original location: backend/src/reports/reports.controller.ts
// What this script is: NestJS controller exposing admin report endpoints
// What it is used for: Handles HTTP requests for administrative reporting data (course completion report)
// Programming language: TypeScript
// Inputs: HTTP GET requests to /admin/reports/completions with JWT authentication and role claims; DatabaseService injected
// Outputs: Query result set returned as HTTP response (JSON)
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS framework, JWT auth guard, custom Roles guard/decorator, DatabaseService executing SQL
// Downstream scripts/files/processes that consume the output: frontend admin UI or API clients that call /admin/reports/completions
// Risks and safe change note: Modifying SQL, the exposed fields, or access decorators may leak data or break clients; validate behavior in staging and preserve role restrictions
// created by: Sadeq Obaid

// Import NestJS decorators used to define a controller, route handlers, and guard application
import { Controller, Get, UseGuards } from '@nestjs/common';
// Import JWT authentication guard to enforce token-based authentication for requests
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import role-based guard to enforce role authorization checks
import { RolesGuard } from '../common/roles.guard.js';
// Import Roles decorator to annotate allowed roles on controller or handler
import { Roles } from '../common/roles.decorator.js';
// Import DatabaseService used to execute SQL queries against the application's database
import { DatabaseService } from '../database/database.service.js';

// Apply Controller decorator to register this class under the 'admin/reports' route prefix
@Controller('admin/reports')
// Apply guards globally to this controller to require JWT authentication and role checks on all endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
// Restrict access to users with either SYSTEM_ADMIN or TRAINING_ADMIN roles for all handlers in this controller
@Roles('SYSTEM_ADMIN', 'TRAINING_ADMIN')
// Export the ReportsController class so NestJS can instantiate it and inject dependencies
export class ReportsController {
  // Constructor injects DatabaseService and assigns it to a private readonly property for use in handlers
  constructor(private readonly database: DatabaseService) {}

  // Map HTTP GET requests for 'completions' (i.e., /admin/reports/completions) to the following handler
  @Get('completions')
  // Define the handler method that returns course completion reporting data
  completions() {
    // Execute a SQL query via DatabaseService and return its result directly to the caller (HTTP response)
    return this.database.query(
      // The SQL selects course id, title, total and completed enrollments from a reporting view/table, ordered by title
      `SELECT course_id, title, total_enrollments, completed_enrollments FROM course_completion_report ORDER BY title`,
    );
  }
}
