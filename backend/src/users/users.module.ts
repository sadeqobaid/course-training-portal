// Script name: users.module.ts
// Original location: backend/src/users/users.module.ts
// What this script is: NestJS module definition that groups user-related controllers and providers
// What it is used for: Registers the UsersController and UsersService and imports NotificationsModule into the Nest dependency-injection graph
// Programming language: TypeScript
// Inputs: None directly; it imports other modules/controllers/services and is consumed by NestJS at runtime
// Outputs: Exposes a UsersModule class that NestJS uses to compose the application module graph
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework, NotificationsModule, UsersController, UsersService
// Downstream scripts/files/processes that consume the output: AppModule or other modules that import UsersModule; NestJS runtime for bootstrapping
// Risks and safe change note: Changing imports, controllers, or providers can break dependency injection or runtime startup; modify cautiously and run tests
// created by: Sadeq Obaid

// Import the Module decorator from NestJS which is used to define a module and its metadata
import { Module } from '@nestjs/common';
// Import the NotificationsModule to include its providers/controllers into this module's context via the imports array
import { NotificationsModule } from '../notifications/notifications.module.js';
// Import the UsersController which will handle incoming requests related to users and be registered in controllers array
import { UsersController } from './users.controller.js';
// Import the UsersService which contains user business logic and will be provided via the providers array
import { UsersService } from './users.service.js';

// Apply the @Module decorator to declare module metadata: imports, controllers, and providers for NestJS DI
@Module({
// Specify modules to import so their exported providers/controllers are available in this module
  imports: [NotificationsModule],
// Register controllers that handle incoming requests; UsersController is listed here
  controllers: [UsersController],
// Register providers (services) that can be injected into controllers or other providers; UsersService is listed here
  providers: [UsersService],
})
// Declare and export the UsersModule class so it can be imported by other modules (e.g., AppModule) by the NestJS runtime
export class UsersModule {}
