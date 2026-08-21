// Script name: auth.service.ts
// Original location: backend/src/auth/auth.service.ts
// What this script is: Authentication service implementing register and login logic for users.
// What it is used for: Handles user registration, login, password hashing, JWT issuance, and welcome notifications.
// Programming language: TypeScript
// Inputs: RegisterDto and LoginDto objects (typically from controller/request payloads); database query results.
// Outputs: User objects without password hash and JWT access tokens returned to caller; notifications created.
// Where output is saved or sent: database/table: users (reads/writes); filesystem path: None; browser/session storage: JWT returned to client for storage (caller responsibility); JSON: returned via service response objects; HTTP/API: served by controllers calling this service; SMTP: email notifications via NotificationsService; Docker service: None; console: None
// Technologies and services used or interacted with: NestJS (Injectable, Exceptions), @nestjs/jwt, argon2, DatabaseService (Postgres/SQL), NotificationsService for in-app/email notifications.
// Downstream scripts/files/processes that consume the output: Controllers that call AuthService.register and AuthService.login; authentication guards that verify JWTs; frontend clients that store/use access tokens.
// Risks and safe change note: Changing password hashing algorithm, JWT payload, or DB schema may break authentication/compatibility and weaken security; keep argon2 hashing parameters and token signing consistent; ensure notifications/DB access remain transactional where needed.
// created by: Sadeq Obaid

// Import specific exception classes and the Injectable decorator from NestJS for dependency injection and error handling.
// The following import is a multi-line import; the comment explains the grouped imports below.
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// Import the JwtService used to sign JWT access tokens for authenticated users.
import { JwtService } from '@nestjs/jwt';
// Import the argon2 library used to hash and verify passwords securely.
import * as argon2 from 'argon2';
// Import a DatabaseService abstraction used to query and mutate the users table.
import { DatabaseService } from '../database/database.service.js';
// Import application-specific types used in JWT payloads and user roles.
import { JwtPayload, UserRole } from '../common/types.js';
// Import NotificationsService which sends in-app and email notifications after registration.
import { NotificationsService } from '../notifications/notifications.service.js';
// Import DTO types defining the expected shapes for login and registration inputs.
import { LoginDto, RegisterDto } from './auth.dto.js';

// Define the shape of a user row as returned from the database; matches selected columns in queries.
type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

// Mark the service as injectable so NestJS can manage its lifecycle and dependencies.
@Injectable()
export class AuthService {
  // The constructor injects DatabaseService, JwtService, and NotificationsService via NestJS DI.
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  // Register a new user using the provided RegisterDto; returns the created user without the password hash.
  async register(
    dto: RegisterDto,
  ): Promise<{ user: Omit<UserRow, 'password_hash'> }> {
    // Normalize and trim the email to ensure consistent storage and comparison.
    const email = dto.email.trim().toLowerCase();
    // Trim the full name to remove leading/trailing whitespace.
    const fullName = dto.fullName.trim();
    // Query the database for an existing user with the normalized email to prevent duplicates.
    const existing = await this.database.one<UserRow>(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email],
    );
    // If a user already exists with this email, throw a conflict exception to signal duplicate registration.
    if (existing)
      throw new ConflictException(
        'An account already uses this email address.',
      );
    // Hash the incoming plaintext password using argon2id for secure storage.
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    // Insert the new user row into the users table and return the created row.
    const user = await this.database.one<UserRow>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'LEARNER')
       RETURNING id, email, password_hash, full_name, role, is_active`,
      [email, passwordHash, fullName],
    );
    // If insertion did not return a row (unexpected), throw an error to avoid proceeding with nulls.
    if (!user) throw new Error('User creation did not return a row.');
    // Create an in-app notification and an email (ensures at-most-once behavior) welcoming the new user.
    await this.notifications.createInAppAndEmailOnce({
      recipientId: user.id,
      type: 'WELCOME',
      key: `welcome:${user.id}`,
      subject: 'Welcome to the Course Training Portal',
      body: 'Your learner account is ready. You can now browse published courses.',
    });
    // Return the created user with the password hash removed for safety.
    return { user: this.publicUser(user) };
  }

  // Authenticate a user using LoginDto and return a signed JWT access token plus user info (without password hash).
  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<UserRow, 'password_hash'> }> {
    // Normalize and trim the email to match how emails are stored.
    const email = dto.email.trim().toLowerCase();
    // Retrieve the user row by email including the password hash for verification.
    const user = await this.database.one<UserRow>(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email],
    );
    // Verify that a user exists and that the provided password matches the stored hash; otherwise reject.
    if (!user || !(await argon2.verify(user.password_hash, dto.password)))
      throw new UnauthorizedException('Email or password is incorrect.');
    // Ensure the account is active before issuing tokens.
    if (!user.is_active)
      throw new UnauthorizedException('Account is inactive.');
    // Build the JWT payload using the user id, email, and role; 'sub' is the standard JWT subject claim.
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    // Sign the JWT payload asynchronously to produce an access token.
    const accessToken = await this.jwt.signAsync(payload);
    // Return the access token and the public-facing user information (password hash removed).
    return { accessToken, user: this.publicUser(user) };
  }

  // Helper to strip sensitive fields (password_hash) from a UserRow before returning to callers.
  private publicUser(user: UserRow): Omit<UserRow, 'password_hash'> {
    // Destructure to remove password_hash and gather the rest into safeUser.
    const { password_hash: _passwordHash, ...safeUser } = user;
    // Return the sanitized user object.
    return safeUser;
  }
}
