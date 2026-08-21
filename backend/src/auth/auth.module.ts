// Script name: auth.module.ts
// Original location: backend/src/auth/auth.module.ts
// What this script is: A NestJS module definition for authentication features.
// What it is used for: Configures JWT support, registers the AuthController, AuthService, and JWT guard, and wires in the NotificationsModule dependency.
// Programming language: TypeScript
// Inputs: Environment configuration values (env.jwtAccessSecret, env.jwtAccessTtl) and imported modules/controllers/services.
// Outputs: Provides configured JwtModule and exported JwtAuthGuard for other modules to consume; no direct file/database output.
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework (Module, JwtModule), JWT signing, project NotificationsModule, environment config.
// Downstream scripts/files/processes that consume the output: Other NestJS modules that import AuthModule or expect JwtAuthGuard; controllers/services that depend on AuthService or JwtModule configuration.
// Risks and safe change note: Changes to secrets, TTL, or exported providers can break authentication and authorization across the application; update env variables and dependent modules cautiously and run full integration tests.
// created by: Sadeq Obaid

// Import the Module decorator from NestJS used to declare a module class.
import { Module } from '@nestjs/common';
// Import JwtModule to register and configure JWT signing and validation behavior.
import { JwtModule } from '@nestjs/jwt';
// Import the controller that exposes authentication-related HTTP endpoints.
import { AuthController } from './auth.controller.js';
// Import the service that contains authentication logic and token handling.
import { AuthService } from './auth.service.js';
// Import the guard that enforces JWT-based authentication on protected routes.
import { JwtAuthGuard } from './jwt-auth.guard.js';
// Import the NotificationsModule to enable sending/handling notifications as a dependency.
import { NotificationsModule } from '../notifications/notifications.module.js';
// Import the environment configuration used to source JWT secret and TTL values.
import { env } from '../config/env.js';

// Define the NestJS module and its metadata: imports, controllers, providers, and exports.
@Module({
  // List module imports that will be available in this module's dependency injection context.
  imports: [
    // Register and configure the JwtModule with secret and signing options.
    JwtModule.register({
      // Use the access token secret provided by the environment configuration for signing JWTs.
      secret: env.jwtAccessSecret,
      // Provide token expiration configuration, pulling TTL from environment and casting to satisfy types.
      signOptions: { expiresIn: env.jwtAccessTtl as never },
    }),
    // Include the NotificationsModule so its providers can be injected in this module's services/controllers.
    NotificationsModule,
  ],
  // Declare the controllers that belong to this module; AuthController handles authentication routes.
  controllers: [AuthController],
  // Register providers (injectable classes) for this module: the service and the guard.
  providers: [AuthService, JwtAuthGuard],
  // Export the JwtAuthGuard so other modules can use the same guard instance/type if they import this module.
  exports: [JwtAuthGuard],
})
// Export the AuthModule class so NestJS can include it in the application module tree.
export class AuthModule {}
