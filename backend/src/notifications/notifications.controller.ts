// Script name: notifications.controller.ts
// Original location: backend/src/notifications/notifications.controller.ts
// What this script is: A NestJS controller providing HTTP endpoints for notification operations.
// What it is used for: Exposes routes to list notifications for the authenticated user and mark a notification as read.
// Programming language: TypeScript
// Inputs: HTTP requests (GET /notifications, PATCH /notifications/:id/read), authenticated user context via JWT, route parameters (notification id).
// Outputs: HTTP JSON responses and calls to the NotificationsService that update persistence.
// Where output is saved or sent: Database (notifications table) via NotificationsService; HTTP/API responses to clients.
// Technologies and services used or interacted with: NestJS framework, JWT authentication guard, custom CurrentUser decorator, NotificationsService.
// Downstream scripts/files/processes that consume the output: Frontend clients consuming the API responses; persistence layer implemented in NotificationsService and its underlying repositories/databases.
// Risks and safe change note: Changing route signatures, authentication guard usage, or service calls can affect security and data integrity; review auth behavior, access control, and tests when modifying.
// created by: Sadeq Obaid

// Import NestJS decorators used to define controller, route handlers, parameter decorators, and guards.
import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
// Import custom decorator that resolves and injects the current authenticated user into handler parameters.
import { CurrentUser } from '../common/current-user.decorator.js';
// Import the AuthenticatedUser type which describes the shape of the user object provided by CurrentUser.
import { AuthenticatedUser } from '../common/types.js';
// Import the JWT authentication guard to enforce authentication on controller routes.
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import the NotificationsService which contains business logic and persistence operations for notifications.
import { NotificationsService } from './notifications.service.js';

// Declare this class as a NestJS controller handling routes under the '/notifications' path.
@Controller('notifications')
// Apply the JwtAuthGuard to all endpoints in this controller so only authenticated requests are allowed.
@UseGuards(JwtAuthGuard)
// Define and export the NotificationsController class which groups notification-related HTTP handlers.
export class NotificationsController {
  // Inject the NotificationsService into the controller via the constructor and store it as a private readonly member for use in handlers.
  constructor(private readonly notifications: NotificationsService) {}

  // Map HTTP GET requests on the controller root (GET /notifications) to the following handler method.
  @Get()
  // Define the 'list' handler which receives the authenticated user via the CurrentUser decorator.
  list(@CurrentUser() user: AuthenticatedUser) {
    // Delegate to NotificationsService.listForUser to fetch notifications for the provided user id and return the result to the caller.
    return this.notifications.listForUser(user.id);
  }
  // End of 'list' method.

  // Map HTTP PATCH requests on '/notifications/:id/read' to the following handler to mark a notification as read.
  @Patch(':id/read')
  // Define the async 'read' handler which receives the authenticated user and the route parameter 'id' for the notification to mark as read.
  async read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    // Call NotificationsService.markRead to mark the specified notification as read for the authenticated user and wait for it to complete.
    await this.notifications.markRead(user.id, id);
    // Return a simple JSON payload indicating success to the client.
    return { success: true };
  }
  // End of 'read' method.
}
// End of NotificationsController class.
