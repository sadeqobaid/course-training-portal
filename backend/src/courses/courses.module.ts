// Script name: courses.module.ts
// Original location: backend/src/courses/courses.module.ts
// What this script is: A NestJS module definition that groups the courses-related controller and service.
// What it is used for: Registers the CoursesController and CoursesService with NestJS's DI container and makes the service available for import by other modules.
// Programming language: TypeScript
// Inputs: Imports of Module decorator from @nestjs/common and local CoursesController and CoursesService classes.
// Outputs: Exports the CoursesModule class and makes CoursesService available for other modules via the exports array.
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework, TypeScript, Node.js, ECMAScript modules, Nest dependency injection.
// Downstream scripts/files/processes that consume the output: AppModule (or other Nest modules) that import CoursesModule; unit/integration tests that import this module; NestJS runtime which composes the application graph.
// Risks and safe change note: Changing provider/controller registrations, export lists, or class names can break dependency injection and module imports; renaming files or using different file extensions may break imports; adding side-effectful code here can alter application startup order. Make minimal changes and run tests and the NestJS application to verify behavior.
// created by: Sadeq Obaid

// Import the Module decorator which is used to define a NestJS module and attach metadata.
// This decorator shapes how controllers and providers are registered with the Nest dependency injection container.
import { Module } from '@nestjs/common';

// Import the CoursesController class to be registered in this module's controllers array.
// The controller handles incoming HTTP requests related to "courses".
import { CoursesController } from './courses.controller.js';

// Import the CoursesService class to be registered as a provider in this module.
// The service contains the business logic and data access for courses and will be injected where needed.
import { CoursesService } from './courses.service.js';

// Apply the Module decorator to the following class, providing metadata to NestJS.
// This line opens the module metadata object where controllers, providers, and exports are defined.
@Module({
  // Register CoursesController in this module so Nest can route requests to it.
  controllers: [CoursesController],
  // Register CoursesService as a provider so it can be injected into controllers or other providers.
  providers: [CoursesService],
  // Export CoursesService so other modules that import this module can use the same provider instance.
  exports: [CoursesService],
})
// Export the CoursesModule class so it can be imported by other modules (e.g., AppModule).
// The class itself is empty because all configuration is provided via the @Module decorator.
export class CoursesModule {}
