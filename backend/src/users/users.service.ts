import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthenticatedUser, UserRole } from '../common/types.js';
import { DatabaseService } from '../database/database.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateManagedUserDto, UpdateManagedUserDto } from './users.dto.js';

type ManagedUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  list(): Promise<ManagedUserRow[]> {
    return this.database.query<ManagedUserRow>(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users ORDER BY created_at DESC`,
    );
  }

  async create(dto: CreateManagedUserDto): Promise<ManagedUserRow> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.database.one<ManagedUserRow>(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE email = $1',
      [email],
    );
    if (existing) throw new ConflictException('An account already uses this email address.');
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.database.one<ManagedUserRow>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [email, passwordHash, dto.fullName.trim(), dto.role],
    );
    if (!user) throw new Error('Managed account creation did not return a user.');
    await this.notifications.createInAppAndEmailOnce({
      recipientId: user.id,
      type: 'ACCOUNT_CREATED',
      key: `account-created:${user.id}`,
      subject: 'Your Course Training Portal account is ready',
      body: `A System Administrator created your ${user.role.replace('_', ' ')} account. Sign in with the credentials provided to you.`,
    });
    return user;
  }

  async update(actor: AuthenticatedUser, userId: string, dto: UpdateManagedUserDto): Promise<ManagedUserRow> {
    const user = await this.database.one<ManagedUserRow>(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (!user) throw new NotFoundException('User not found.');
    if (actor.id === userId && (dto.isActive === false || (dto.role && dto.role !== 'SYSTEM_ADMIN'))) {
      throw new BadRequestException('A System Administrator cannot deactivate or remove their own System Administrator role.');
    }
    const nextRole = dto.role ?? user.role;
    const nextActive = dto.isActive ?? user.is_active;
    if (user.role === 'SYSTEM_ADMIN' && (nextRole !== 'SYSTEM_ADMIN' || !nextActive)) {
      const count = await this.database.one<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users
         WHERE role = 'SYSTEM_ADMIN' AND is_active = TRUE AND id <> $1`,
        [userId],
      );
      if (!count || Number(count.count) === 0) {
        throw new BadRequestException('Keep at least one active System Administrator account.');
      }
    }
    const updated = await this.database.one<ManagedUserRow>(
      `UPDATE users SET role = $2, is_active = $3, updated_at = NOW()
       WHERE id = $1 RETURNING id, email, full_name, role, is_active, created_at`,
      [userId, nextRole, nextActive],
    );
    if (!updated) throw new NotFoundException('User not found.');
    return updated;
  }
}
