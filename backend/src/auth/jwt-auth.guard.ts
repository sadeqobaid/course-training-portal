// Script name: jwt-auth.guard.ts
// Original location: backend/src/auth/jwt-auth.guard.ts
// What this script is: A NestJS authentication guard that validates JWT bearer tokens and attaches authenticated user info to the request.
// What it is used for: To protect HTTP routes by verifying access tokens, loading the corresponding user from the database, and providing the user context to request handlers.
// Programming language: TypeScript
// Inputs: ExecutionContext from NestJS (HTTP request with headers), Authorization: Bearer <token> header, JWT secret/validation via JwtService, users table in the database.
// Outputs: boolean result from canActivate; side-effect: request.user is populated with authenticated user data when successful.
// Where output is saved or sent: HTTP/API (request.user attached to the in-memory request object for downstream handlers).
// Technologies and services used or interacted with: NestJS framework, @nestjs/jwt JwtService, a DatabaseService executing SQL, PostgreSQL (or similar) users table, JSON Web Tokens.
// Downstream scripts/files/processes that consume the output: NestJS controllers and route handlers that read request.user; other guards or interceptors that rely on authentication.
// Risks and safe change note: Modifying token verification, SQL query, or user property mapping can break authentication and authorization; ensure tests and token formats are preserved and DB schema (users table fields) remains compatible before changing.
// created by: Sadeq Obaid

// Import NestJS interfaces and exceptions used by the guard.
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// Import JwtService for token verification.
import { JwtService } from '@nestjs/jwt';
// Import application DatabaseService to fetch user records.
import { DatabaseService } from '../database/database.service.js';
// Import application-specific types used for typing request.user and JWT payload.
import { AuthenticatedUser, JwtPayload, UserRole } from '../common/types.js';

// Apply NestJS Injectable decorator so the guard can be injected where needed.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  // Constructor injects JwtService for verifying tokens and DatabaseService for loading user details.
  constructor(
    private readonly jwt: JwtService,
    private readonly database: DatabaseService,
  ) {}

  // canActivate is the guard entry point; it must return a boolean or Promise<boolean>.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract the raw HTTP request with headers and optional user property typed for clarity.
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthenticatedUser;
      }>();
    // Read the Authorization header from the request headers for Bearer token extraction.
    const authorization = request.headers.authorization;
    // If the Authorization header is missing or does not start with 'Bearer ', reject with 401 Unauthorized.
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('A Bearer access token is required.');
    // Remove the 'Bearer ' prefix to obtain the raw JWT token string.
    const token = authorization.slice('Bearer '.length);
    // Declare the variable that will hold the decoded JWT payload after verification.
    let payload: JwtPayload;
    try {
      // Verify the token asynchronously using JwtService; throws if invalid or expired.
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      // Any verification error results in an UnauthorizedException indicating invalid or expired token.
      throw new UnauthorizedException('Access token is invalid or expired.');
    }
    // Query the database for the user record corresponding to the subject (sub) from the JWT payload.
    const user = await this.database.one<{
      id: string;
      email: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
    }>(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [payload.sub],
    );
    // If no user is found or the user is not active, deny access.
    if (!user || !user.is_active)
      throw new UnauthorizedException('Account is unavailable.');
    // Map database user fields to the AuthenticatedUser shape and attach to the request for downstream handlers.
    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
    };
    // Successful authentication; allow the request to proceed.
    return true;
  }
}
