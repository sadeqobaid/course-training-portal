// Script name: database.module.ts
// Original location: backend/src/database/database.module.ts
// What this script is: A NestJS module definition that registers and exports the application's DatabaseService.
// What it is used for: To provide a centralized DatabaseService to other parts of the application via NestJS dependency injection and optionally make it globally available.
// Programming language: TypeScript
// Inputs: None at definition time; at runtime it depends on NestJS module system and consumers that import this module or inject DatabaseService.
// Outputs: Exposes/exports the DatabaseService provider to NestJS modules that import this module or to the global DI container when decorated with @Global.
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework (Module and Global decorators), TypeScript, Node.js runtime; interacts with './database.service.js' implementation.
// Downstream scripts/files/processes that consume the output: Any NestJS modules or services that import DatabaseModule or inject DatabaseService (e.g., application modules, feature modules, controllers, other providers).
// Risks and safe change note: Modifying exports/providers or removing the @Global decorator can change DI behavior and break consumers; ensure integration tests and DI resolution are validated before changes. Keep DatabaseService API stable or perform coordinated updates across consumers.
// created by: Sadeq Obaid

// Import the Global and Module decorators from the NestJS common package so we can annotate and configure this module.
import { Global, Module } from '@nestjs/common';
// Import the DatabaseService implementation from the local file so it can be registered as a provider and exported by this module.
import { DatabaseService } from './database.service.js';

// Apply the @Global decorator to make the module's exported providers available across the entire application without explicit imports.
@Global()
// Configure the module metadata: register DatabaseService as a provider and also export it so other modules (or the global container) can access it.
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
// Define and export the DatabaseModule class which serves as the NestJS module container for the DatabaseService; the class body is intentionally empty.
export class DatabaseModule {}
