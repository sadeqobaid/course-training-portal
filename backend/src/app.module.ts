// Script name: app.module.ts
// Original location: backend/src/app.module.ts
// What this script is: NestJS application root module declaration that aggregates feature modules and configures global providers
// What it is used for: Registers Database, JWT, Throttler, feature modules, and applies global middleware for the application
// Programming language: TypeScript
// Inputs: env configuration (env.jwtAccessSecret, env.jwtAccessTtl) and the imported modules listed below
// Outputs: None
// Where output is saved or sent: None
// Technologies and services used or interacted with: NestJS framework, @nestjs/jwt, @nestjs/throttler, custom DatabaseModule, middleware, and multiple feature modules
// Downstream scripts/files/processes that consume the output: application bootstrap (e.g., main.ts) which imports AppModule; runtime Nest application that uses AppModule for DI and routing
// Risks and safe change note: Changes can alter the dependency injection graph, authentication behavior, or middleware application; modify carefully and run integration tests before deployment
// created by: Sadeq Obaid

// Import NestJS types used to define a module and to configure middleware application
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// Import JWT module to configure token signing and verification options
import { JwtModule } from '@nestjs/jwt';
// Import rate-limiting (throttling) module to protect endpoints from excessive requests
import { ThrottlerModule } from '@nestjs/throttler';
// Import environment configuration values used to configure JWT (secrets, TTL)
import { env } from './config/env.js';
// Import a middleware that assigns/request-traces requests with an identifier
import { RequestIdMiddleware } from './common/request-id.middleware.js';
// Import the DatabaseModule to provide database connectivity and repositories
import { DatabaseModule } from './database/database.module.js';
// Import health-check related endpoints and providers
import { HealthModule } from './health/health.module.js';
// Import authentication feature module (routes, services related to auth)
import { AuthModule } from './auth/auth.module.js';
// Import courses feature module
import { CoursesModule } from './courses/courses.module.js';
// Import enrollments feature module
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
// Import notifications feature module
import { NotificationsModule } from './notifications/notifications.module.js';
// Import assessments feature module
import { AssessmentsModule } from './assessments/assessments.module.js';
// Import certificates feature module
import { CertificatesModule } from './certificates/certificates.module.js';
// Import reports feature module
import { ReportsModule } from './reports/reports.module.js';
// Import users feature module
import { UsersModule } from './users/users.module.js';
// Import management/administration feature module
import { ManagementModule } from './management/management.module.js';

// Declare a NestJS module and provide metadata for imports and global configuration
@Module({
  // Begin list of modules and configured providers that AppModule bundles together
  imports: [
    // Register DatabaseModule to initialize database connections and provide repositories
    DatabaseModule,
    // Configure JwtModule with application-wide options (registered here so JwtService is available)
    JwtModule.register({
      // The JWT module is made global so JwtService injection is available application-wide without re-import
      global: true,
      // Use the secret from env configuration to sign and verify access tokens
      secret: env.jwtAccessSecret,
      // Set token expiration using configured TTL; 'as never' preserves original typing usage in source
      signOptions: { expiresIn: env.jwtAccessTtl as never },
    }),
    // Initialize ThrottlerModule with a TTL and request limit to protect endpoints (rate limiting)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // HealthModule provides health-check endpoints consumed by monitoring systems
    HealthModule,
    // AuthModule handles authentication routes, guards, and related services
    AuthModule,
    // CoursesModule contains course-related controllers and providers
    CoursesModule,
    // EnrollmentsModule contains enrollment-related controllers and providers
    EnrollmentsModule,
    // NotificationsModule manages notification logic and delivery
    NotificationsModule,
    // AssessmentsModule contains assessment-related features
    AssessmentsModule,
    // CertificatesModule handles certificate issuance and management
    CertificatesModule,
    // ReportsModule provides reporting features and endpoints
    ReportsModule,
    // UsersModule manages user entities, controllers, and services
    UsersModule,
    // ManagementModule contains admin/management features
    ManagementModule,
  ],
})
// Export the AppModule class which Nest uses as the root module; it implements NestModule to configure middleware
export class AppModule implements NestModule {
  // configure is called by Nest to allow registering middleware for routes using the provided consumer
  configure(consumer: MiddlewareConsumer): void {
    // Apply RequestIdMiddleware globally (for all routes) so every request receives a request identifier
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
  // end of AppModule class body
}
