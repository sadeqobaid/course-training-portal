// Script name: certificates.controller.ts
// Original location: backend/src/certificates/certificates.controller.ts
// What this script is: NestJS controller defining HTTP endpoints for certificate operations
// What it is used for: Exposes routes to verify certificates and fetch the authenticated user's certificates
// Programming language: TypeScript
// Inputs: HTTP requests (route params, authenticated user via JWT), application services via DI
// Outputs: JSON responses representing certificate data or HTTP error responses
// Where output is saved or sent: HTTP/API (responses sent to client); None for persistent storage in this file
// Technologies and services used or interacted with: NestJS framework, JWT authentication guard, CertificatesService
// Downstream scripts/files/processes that consume the output: HTTP clients/frontends, other backend services that call these endpoints
// Risks and safe change note: Changes to routes, error messages, or authentication behavior can impact clients; modify with tests and coordinate with frontend teams
// created by: Sadeq Obaid

// Import the specified symbols from NestJS common package; these provide controller and routing decorators and exceptions
import {
  // Controller decorator to mark the class as a Nest controller and set the route prefix
  Controller,
  // Get decorator to map methods to HTTP GET requests
  Get,
  // Exception to throw when a certificate is not found or verification fails
  NotFoundException,
  // Param decorator to extract route parameters from requests
  Param,
  // UseGuards decorator to attach authentication/authorization guards to routes
  UseGuards,
} from '@nestjs/common';
// Import the JWT authentication guard to protect routes that require authentication
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
// Import a custom decorator to obtain the current authenticated user from the request
import { CurrentUser } from '../common/current-user.decorator.js';
// Import the type that describes the structure of an authenticated user
import { AuthenticatedUser } from '../common/types.js';
// Import the service responsible for certificate business logic and data access
import { CertificatesService } from './certificates.service.js';

// Apply the Controller decorator to register this class under the 'certificates' route prefix
@Controller('certificates')
export class CertificatesController {
  // Constructor receives CertificatesService via dependency injection and stores it in a private readonly property
  constructor(private readonly certificates: CertificatesService) {}

  // Map HTTP GET requests to /certificates/verify/:code to this method for certificate verification
  @Get('verify/:code')
  // Define an asynchronous method to verify a certificate by code; the code param is injected from the route
  async verify(@Param('code') code: string) {
    // Call the certificates service to perform verification logic and await its result
    const certificate = await this.certificates.verify(code);
    // If verification failed or service returned no certificate, throw a 404 Not Found with a clear message
    if (!certificate)
      throw new NotFoundException('Certificate verification code is invalid.');
    // Return the certificate object as the HTTP response payload when verification succeeds
    return certificate;
  }

  // Map HTTP GET requests to /certificates/me to this method to fetch certificates for the authenticated user
  @Get('me')
  // Attach the JWT auth guard so only authenticated requests with a valid JWT can access this route
  @UseGuards(JwtAuthGuard)
  // Define the handler that receives the current authenticated user via a custom decorator
  mine(@CurrentUser() user: AuthenticatedUser) {
    // Delegate to the certificates service to fetch certificates belonging to the provided user id
    return this.certificates.mine(user.id);
  }
}
