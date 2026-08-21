// Script name: main.ts
// Original location: backend/src/main.ts
// What this script is: Entry point that bootstraps and starts the NestJS HTTP server for the application
// What it is used for: Creates the NestJS app, registers security and validation middleware, sets global filters/prefixes, enables CORS, and listens on a configured port
// Programming language: TypeScript
// Inputs: Environment configuration (env), AppModule, incoming HTTP requests
// Outputs: Application listening on HTTP port; console log message indicating server start
// Where output is saved or sent: HTTP/API, console
// Technologies and services used or interacted with: NestJS, helmet middleware, class-validator via ValidationPipe, custom HttpExceptionFilter, CORS
// Downstream scripts/files/processes that consume the output: HTTP clients, internal modules/controllers within AppModule, monitoring/logging systems
// Risks and safe change note: Modifying middleware order, CORS policy, validation settings, or port configuration can introduce security issues or break clients; test changes in staging and coordinate deployments
// created by: Sadeq Obaid

// Import reflect-metadata to enable decorators metadata required by NestJS and class-transformer/validator
import 'reflect-metadata';
// Import ValidationPipe to validate and transform incoming request DTOs globally
import { ValidationPipe } from '@nestjs/common';
// Import NestFactory to create the NestJS application context and HTTP server
import { NestFactory } from '@nestjs/core';
// Import helmet middleware to set secure HTTP headers for responses
import helmet from 'helmet';
// Import the root application module that composes controllers and providers
import { AppModule } from './app.module.js';
// Import a custom HTTP exception filter to format and handle exceptions across the app
import { HttpExceptionFilter } from './common/http-exception.filter.js';
// Import environment configuration values such as port and CORS origin
import { env } from './config/env.js';

// Define an async bootstrap function that will build and start the NestJS application
async function bootstrap(): Promise<void> {
  // Create the NestJS application instance from the root AppModule; this returns an application context
  const app = await NestFactory.create(AppModule);
  // Set a global route prefix so all controllers are served under /api/v1
  app.setGlobalPrefix('api/v1');
  // Apply helmet middleware to add various HTTP headers for basic security hardening
  app.use(helmet());
  // Enable CORS with the provided options to allow cross-origin requests from configured origins
  app.enableCors({
    // Use the configured CORS origin value from environment to restrict allowed origins
    origin: env.corsOrigin,
    // Limit allowed HTTP methods for cross-origin requests to these verbs
    methods: ['GET', 'POST', 'PATCH'],
    // Allow these request headers in cross-origin requests (e.g., Authorization and x-request-id)
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });
  // Register global validation pipes to enforce DTO validation and transformation on incoming requests
  app.useGlobalPipes(
    // Instantiate ValidationPipe with strict options to whitelist, forbid unknown properties, and transform payloads
    new ValidationPipe({
      // whitelist: strip properties that are not defined in the DTO class
      whitelist: true,
      // forbidNonWhitelisted: throw an error if unknown properties are provided
      forbidNonWhitelisted: true,
      // transform: automatically transform payloads to the expected DTO types
      transform: true,
    }),
  );
  // Register a global HTTP exception filter instance to handle and format exceptions consistently
  app.useGlobalFilters(new HttpExceptionFilter());
  // Start listening for incoming HTTP requests on the configured port (async)
  await app.listen(env.port);
  // Log a console message indicating the server is running and the port it's bound to
  console.log(`Course Training Portal API listening on port ${env.port}`);
}
// End of bootstrap function

// Invoke bootstrap and ignore the returned promise; starts the application (fire-and-forget)
void bootstrap();
