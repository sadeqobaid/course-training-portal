// Script name: users.service.ts
// Original location: backend/src/users/users.service.ts
// What this script is: A NestJS service module that manages CRUD operations for managed user accounts.
// What it is used for: Creating, listing, and updating managed user accounts and sending notifications on creation.
// Programming language: TypeScript
// Inputs: DTOs (CreateManagedUserDto, UpdateManagedUserDto), AuthenticatedUser, user identifiers, and database query results.
// Outputs: ManagedUserRow objects returned to callers; side-effect: notifications created and database modified.
// Where output is saved or sent: database/table (users), HTTP/API (returned values to controllers), Notifications via in-app and email; also None for browser/session storage unless used elsewhere.
// Technologies and services used or interacted with: NestJS, argon2 for password hashing, a custom DatabaseService, NotificationsService, PostgreSQL (implied by SQL), TypeScript types.
// Downstream scripts/files/processes that consume the output: controllers and other services that call UsersService methods; notification consumers and database clients.
// Risks and safe change note: Changing database schema, role logic, or notification keys can cause account management or security regressions. Ensure tests and DB migrations run when modifying behavior. Preserve checks that prevent removing the last active SYSTEM_ADMIN.
// created by: Sadeq Obaid

// Import NestJS exceptions and Injectable decorator used for DI and error handling.
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
// Import argon2 library used to hash passwords securely before storing them in the database.
import * as argon2 from 'argon2';
// Import application-specific types for authenticated user context and role enumeration.
import { AuthenticatedUser, UserRole } from '../common/types.js';
// Import a DatabaseService abstraction used to run SQL queries against the database.
import { DatabaseService } from '../database/database.service.js';
// Import NotificationsService used to enqueue or send notifications when accounts are created.
import { NotificationsService } from '../notifications/notifications.service.js';
// Import DTO types that describe the shape of incoming create/update requests for managed users.
import { CreateManagedUserDto, UpdateManagedUserDto } from './users.dto.js';

// Define the ManagedUserRow type to represent the shape of user rows returned from DB queries.
type ManagedUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

// Mark the service as injectable so NestJS can provide it via dependency injection.
@Injectable()
export class UsersService {
  // Constructor receives required dependencies: DatabaseService for DB operations and NotificationsService for sending notifications.
  constructor(
    private readonly database: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // List method returns a promise resolving to an array of ManagedUserRow objects from the users table.
  list(): Promise<ManagedUserRow[]> {
    // Execute a SQL query selecting core user fields ordered by creation time descending.
    return this.database.query<ManagedUserRow>(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users ORDER BY created_at DESC`,
    );
  }

  // Create a new managed user account based on the provided DTO and return the created ManagedUserRow.
  async create(dto: CreateManagedUserDto): Promise<ManagedUserRow> {
    // Normalize the email by trimming whitespace and converting to lowercase for uniqueness checks.
    const email = dto.email.trim().toLowerCase();
    // Query the database for any existing user with the same normalized email.
    const existing = await this.database.one<ManagedUserRow>(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE email = $1',
      [email],
    );
    // If a user already exists with that email, throw a ConflictException to indicate the email is in use.
    if (existing) throw new ConflictException('An account already uses this email address.');
    // Hash the provided password using argon2id algorithm for secure storage.
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    // Insert the new user into the database and return the created row information.
    const user = await this.database.one<ManagedUserRow>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [email, passwordHash, dto.fullName.trim(), dto.role],
    );
    // If the insert did not return a user row, throw an unexpected error.
    if (!user) throw new Error('Managed account creation did not return a user.');
    // Create an in-app notification and an email notifying the user that their account was created.
    await this.notifications.createInAppAndEmailOnce({
      recipientId: user.id,
      type: 'ACCOUNT_CREATED',
      key: `account-created:${user.id}`,
      subject: 'Your Course Training Portal account is ready',
      body: `A System Administrator created your ${user.role.replace('_', ' ')} account. Sign in with the credentials provided to you.`,
    });
    // Return the created user row to the caller.
    return user;
  }

  // Update an existing managed user; the actor is the authenticated user performing the update.
  async update(actor: AuthenticatedUser, userId: string, dto: UpdateManagedUserDto): Promise<ManagedUserRow> {
    // Retrieve the current user row from the database by id.
    const user = await this.database.one<ManagedUserRow>(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [userId],
    );
    // If no user is found, throw a NotFoundException.
    if (!user) throw new NotFoundException('User not found.');
    // Prevent a System Administrator from deactivating themselves or removing their own SYSTEM_ADMIN role.
    if (actor.id === userId && (dto.isActive === false || (dto.role && dto.role !== 'SYSTEM_ADMIN'))) {
      throw new BadRequestException('A System Administrator cannot deactivate or remove their own System Administrator role.');
    }
    // Determine the next role: use dto.role if provided, otherwise keep the existing role.
    const nextRole = dto.role ?? user.role;
    // Determine the next active flag: use dto.isActive if provided, otherwise keep the existing is_active value.
    const nextActive = dto.isActive ?? user.is_active;
    // If the current user is a SYSTEM_ADMIN and the update would remove that status or deactivate them, ensure at least one other active SYSTEM_ADMIN remains.
    if (user.role === 'SYSTEM_ADMIN' && (nextRole !== 'SYSTEM_ADMIN' || !nextActive)) {
      // Count active SYSTEM_ADMIN users excluding the user being updated.
      const count = await this.database.one<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users
         WHERE role = 'SYSTEM_ADMIN' AND is_active = TRUE AND id <> $1`,
        [userId],
      );
      // If the count is zero (or query failed to return a value), prevent the update to keep at least one active SYSTEM_ADMIN.
      if (!count || Number(count.count) === 0) {
        throw new BadRequestException('Keep at least one active System Administrator account.');
      }
    }
    // Perform the update of role and is_active, set updated_at to NOW(), and return the updated row.
    const updated = await this.database.one<ManagedUserRow>(
      `UPDATE users SET role = $2, is_active = $3, updated_at = NOW()
       WHERE id = $1 RETURNING id, email, full_name, role, is_active, created_at`,
      [userId, nextRole, nextActive],
    );
    // If the update did not return a row, throw NotFoundException.
    if (!updated) throw new NotFoundException('User not found.');
    // Return the updated user row to the caller.
    return updated;
  }
}
