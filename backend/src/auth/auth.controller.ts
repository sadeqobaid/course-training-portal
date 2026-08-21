// Script name: auth.controller.ts
// Original location: backend/src/auth/auth.controller.ts
// What this script is: A NestJS controller that defines HTTP endpoints for authentication.
// What it is used for: Exposes register, login, and current-user endpoints and delegates business logic to AuthService.
// Programming language: TypeScript
// Inputs: HTTP requests with JSON bodies matching RegisterDto or LoginDto; authenticated requests include a JWT.
// Outputs: HTTP responses produced by AuthService methods or plain objects (e.g., { user }).
// Where output is saved or sent: HTTP/API
// Technologies and services used or interacted with: NestJS framework, JWT guard, AuthService, DTO validation/types.
// Downstream scripts/files/processes that consume the output: Frontend clients, API consumers, other backend modules depending on auth state.
// Risks and safe change note: Changing authentication endpoints or DTOs can break clients and introduce security issues; ensure backwards compatibility, validate inputs, and add tests before modifying.
// created by: Sadeq Obaid

// Import NestJS decorators and utilities used to define controller routes and guard usage
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
// Import custom decorator that injects currently authenticated user into route handlers
import { CurrentUser } from '../common/current-user.decorator.js';
// Import type describing authenticated user's shape for strong typing
import { AuthenticatedUser } from '../common/types.js';
// Import service that contains business logic for registration and login
import { AuthService } from './auth.service.js';
// Import data-transfer object types for validating login and registration request bodies
import { LoginDto, RegisterDto } from './auth.dto.js';
// Import JWT-based guard used to protect routes requiring authentication
import { JwtAuthGuard } from './jwt-auth.guard.js';

// Apply NestJS Controller decorator to prefix routes with 'auth'
@Controller('auth')
// Export controller class grouped into 'auth' endpoints and injected with AuthService
export class AuthController {
  // Constructor injects AuthService into this controller and stores it as a private readonly property named 'auth'
  constructor(private readonly auth: AuthService) {}

  // Define POST /auth/register endpoint
  @Post('register')
  // Handler for registration requests: reads body validated as RegisterDto into dto parameter
  register(@Body() dto: RegisterDto) {
    // Delegate registration logic to AuthService.register and return its result (likely a user or session/token)
    return this.auth.register(dto);
  }

  // Define POST /auth/login endpoint
  @Post('login')
  // Handler for login requests: reads body validated as LoginDto into dto parameter
  login(@Body() dto: LoginDto) {
    // Delegate login logic to AuthService.login and return its result (likely tokens or session info)
    return this.auth.login(dto);
  }

  // Define GET /auth/me endpoint to return current authenticated user
  @Get('me')
  // Use JWT guard to protect this endpoint; ensures the request has a valid JWT before handler runs
  @UseGuards(JwtAuthGuard)
  // Handler that receives the current authenticated user via the CurrentUser decorator
  me(@CurrentUser() user: AuthenticatedUser) {
    // Return a simple object containing the authenticated user; typically serialized to JSON in the HTTP response
    return { user };
  }
}
