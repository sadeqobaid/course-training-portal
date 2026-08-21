// Script name: notifications.module.ts
// Original location: backend/src/notifications/notifications.module.ts
// What this script is: NestJS module definition for the Notifications feature
// What it is used for: Groups and registers the notifications controller and service so they can participate in NestJS dependency injection and be imported by other modules
// Programming language: TypeScript
// Inputs: Imports of NotificationsController and NotificationsService; consumed by NestJS module loader at runtime
// Outputs: Exports NotificationsService symbol for use by other modules; no direct runtime output produced by this file itself
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework, TypeScript, Node.js, Dependency Injection system
// Downstream scripts/files/processes that consume the output: AppModule or other NestJS modules that import NotificationsModule; any consumers that inject NotificationsService
// Risks and safe change note: Modifying controllers/providers/exports can break DI bindings or public API; changing file paths or exported symbols may cause runtime import errors—validate startup and DI after changes
// created by: Sadeq Obaid

// Import the Module decorator from NestJS; used to declare module metadata for the following class.
import { Module } from '@nestjs/common';
// Import the NotificationsController class so it can be registered in the module's controllers array.
import { NotificationsController } from './notifications.controller.js';
// Import the NotificationsService to register as a provider and export it to other modules.
import { NotificationsService } from './notifications.service.js';

// Apply the @Module decorator to supply metadata: controllers/providers/exports follow in the object literal.
@Module({
// Register the NotificationsController so Nest can instantiate it and route requests to it.
  controllers: [NotificationsController],
// Register NotificationsService as a provider (dependency injection token), allowing it to be injected where needed.
  providers: [NotificationsService],
// Export NotificationsService so other modules that import this module can inject the same provider instance.
  exports: [NotificationsService],
// Close the @Module decorator metadata object.
})
// Define and export the NotificationsModule class; Nest uses this class as the module token and container for the metadata above.
export class NotificationsModule {}
