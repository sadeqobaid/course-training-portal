// Script name: management.module.ts
// Original location: backend/src/management/management.module.ts
// What this script is: NestJS module definition that groups related providers/controllers for management features.
// What it is used for: Registers ManagementController and ManagementService and imports NotificationsModule into NestJS DI container.
// Programming language: TypeScript
// Inputs: Imported modules/classes: Module decorator from '@nestjs/common', NotificationsModule, ManagementController, ManagementService
// Outputs: Exports ManagementModule class to be used by NestJS application
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS (Module decorator), internal Notifications module
// Downstream scripts/files/processes that consume the output: AppModule or other modules that import ManagementModule; runtime DI and HTTP controllers route handling
// Risks and safe change note: Modifying providers/controllers or imports can change DI wiring and application behavior; ensure compatibility and tests when updating.
// created by: Sadeq Obaid

// Import the Module decorator from NestJS used to declare a module and provide metadata.
import { Module } from '@nestjs/common';
// Import NotificationsModule to be included in this module's imports, making its exported providers available here.
import { NotificationsModule } from '../notifications/notifications.module.js';
// Import the controller that handles HTTP requests for management-related endpoints; it will be registered below.
import { ManagementController } from './management.controller.js';
// Import the service that contains business logic used by the ManagementController; it will be provided below.
import { ManagementService } from './management.service.js';

// Apply the NestJS Module decorator to define metadata: imports, controllers, and providers for this module.
@Module({
  // Register NotificationsModule in this module's imports so its exported providers are available via DI to this module.
  imports: [NotificationsModule],
  // Register ManagementController so NestJS can instantiate it and route incoming HTTP requests to its handlers.
  controllers: [ManagementController],
  // Register ManagementService so it can be injected into controllers/providers and handle business logic.
  providers: [ManagementService],
})
// Export the ManagementModule class so it can be imported by other modules (e.g., AppModule) and included in the application.
export class ManagementModule {}
