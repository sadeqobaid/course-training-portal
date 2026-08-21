// Script name: health.module.ts
// Original location: backend/src/health/health.module.ts
// What this script is: A NestJS module definition that groups health-related controllers/providers
// What it is used for: Registers the HealthController with NestJS so health endpoints are exposed
// Programming language: TypeScript
// Inputs: None (module metadata consumed by NestJS runtime)
// Outputs: None (module exports a class for framework composition)
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework, Node.js/TypeScript module system
// Downstream scripts/files/processes that consume the output: Imported by application root module (e.g., AppModule) or module loader
// Risks and safe change note: Minimal risk; altering module metadata or controller list changes exposed endpoints — update cautiously and run tests
// created by: Sadeq Obaid

// Import the Module decorator from NestJS common package; used to define module metadata
import { Module } from '@nestjs/common';
// Import the HealthController from the local health controller file; added to the module's controllers array
import { HealthController } from './health.controller.js';

// Apply the @Module decorator with metadata: register controllers (HealthController) for this module
@Module({ controllers: [HealthController] })
// Export the HealthModule class so it can be imported by the application's root module or other modules
export class HealthModule {}
