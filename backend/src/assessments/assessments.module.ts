// Script name: assessments.module.ts
// Original location: backend/src/assessments/assessments.module.ts
// What this script is: NestJS module definition that groups controller(s), provider(s), and imports for assessments domain
// What it is used for: Registers the AssessmentsController and AssessmentsService with NestJS and declares module dependencies
// Programming language: TypeScript
// Inputs: Imported symbols from NestJS and local feature modules (Module, forwardRef, AssessmentsController, AssessmentsService, EnrollmentsModule, CertificatesModule)
// Outputs: NestJS module metadata (module class exported for runtime DI and composition)
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS, TypeScript, Node.js, dependency injection container; interacts with EnrollmentsModule and CertificatesModule at runtime
// Downstream scripts/files/processes that consume the output: AppModule or other modules that import AssessmentsModule; runtime DI resolves AssessmentsService and routes handled by AssessmentsController
// Risks and safe change note: Changing imports/providers/controllers or removing forwardRef can break dependency injection and create circular dependency issues; modify carefully and run full test suite
// created by: Sadeq Obaid

// Import the Module decorator and forwardRef helper from NestJS to define a module and handle potential circular dependencies
import { Module, forwardRef } from '@nestjs/common';
// Import the controller that handles HTTP routes for assessments; registers routing and request handling logic
import { AssessmentsController } from './assessments.controller.js';
// Import the service that contains business logic and data access for assessments; provided to DI container
import { AssessmentsService } from './assessments.service.js';
// Import the enrollments module to declare it as a dependency so assessments can use enrollment capabilities via DI
import { EnrollmentsModule } from '../enrollments/enrollments.module.js';
// Import the certificates module which has a circular dependency; it will be wrapped with forwardRef in module metadata
import { CertificatesModule } from '../certificates/certificates.module.js';

// Apply the Module decorator to declare imports, controllers, providers, and exports for this NestJS module
@Module({
  // Declare modules required by this module: EnrollmentsModule is included directly; CertificatesModule uses forwardRef to avoid circular dependency at load time
  imports: [EnrollmentsModule, forwardRef(() => CertificatesModule)],
  // Register the controller(s) that handle incoming requests related to assessments
  controllers: [AssessmentsController],
  // Register the provider(s) (services) that implement the assessments domain logic and can be injected where needed
  providers: [AssessmentsService],
  // Export the AssessmentsService so other modules that import AssessmentsModule can inject and use it
  exports: [AssessmentsService],
})
// Define and export the class representing this module; the class itself has no runtime body but its metadata drives Nest's module system
export class AssessmentsModule {}
