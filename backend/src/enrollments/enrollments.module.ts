// - Script name: enrollments.module.ts
// - Original location: backend/src/enrollments/enrollments.module.ts
// - What this script is: NestJS module declaration that groups enrollment-related controllers and services
// - What it is used for: Registers the enrollments controller, associated services, and module dependencies so NestJS can wire them via dependency injection
// - Programming language: TypeScript
// - Inputs: ES module imports for Module decorator, controller, services, and dependent modules; NestJS runtime supplies DI context at bootstrap
// - Outputs: Exposes EnrollmentsService and ProgressService for consumption by other modules; no direct file/console/HTTP outputs here
// - Where output is saved or sent: None
// - Technologies and services used or interacted with: NestJS framework, TypeScript, Node.js; interacts with NotificationsModule, EnrollmentsController, EnrollmentsService, ProgressService
// - Downstream scripts/files/processes that consume the output: Other NestJS modules that import EnrollmentsModule or request the exported services
// - Risks and safe change note: Modifying imports/providers/controllers/exports can break dependency injection, runtime resolution, or consumers; change carefully and run integration tests
// created by: Sadeq Obaid

// Import the Module decorator from NestJS which is used to define a module and its metadata.
import { Module } from '@nestjs/common';
// Import the controller responsible for handling HTTP requests related to enrollments.
import { EnrollmentsController } from './enrollments.controller.js';
// Import the service that contains business logic for enrollments; will be provided in the module's DI container.
import { EnrollmentsService } from './enrollments.service.js';
// Import an additional service (ProgressService) used by enrollment logic and also provided here for DI.
import { ProgressService } from '../progress/progress.service.js';
// Import a dependent NotificationsModule which is included in this module's imports array to satisfy dependencies.
import { NotificationsModule } from '../notifications/notifications.module.js';

// Apply the NestJS Module decorator to declare metadata (imports, controllers, providers, exports) for this module.
@Module({
// Register module-level imports: include NotificationsModule so its exported providers are available to this module.
  imports: [NotificationsModule],
// Register controllers handled by this module; NestJS will instantiate EnrollmentsController and route requests to it.
  controllers: [EnrollmentsController],
// Register providers (services) which will be instantiated by NestJS and available for injection within this module.
  providers: [EnrollmentsService, ProgressService],
// Export specific providers so other modules that import EnrollmentsModule can inject EnrollmentsService and ProgressService.
  exports: [EnrollmentsService, ProgressService],
})
// Export the class that represents the module; class body is empty because all configuration is provided by the decorator metadata.
export class EnrollmentsModule {}
