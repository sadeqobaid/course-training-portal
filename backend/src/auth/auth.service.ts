import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service.js';
import { JwtPayload, UserRole } from '../common/types.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: Omit<UserRow, 'password_hash'> }> {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const existing = await this.database.one<UserRow>(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email],
    );
    if (existing)
      throw new ConflictException(
        'An account already uses this email address.',
      );
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const user = await this.database.one<UserRow>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'LEARNER')
       RETURNING id, email, password_hash, full_name, role, is_active`,
      [email, passwordHash, fullName],
    );
    if (!user) throw new Error('User creation did not return a row.');
    await this.notifications.createInAppAndEmailOnce({
      recipientId: user.id,
      type: 'WELCOME',
      key: `welcome:${user.id}`,
      subject: 'Welcome to the Course Training Portal',
      body: 'Your learner account is ready. You can now browse published courses.',
    });
    return { user: this.publicUser(user) };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: Omit<UserRow, 'password_hash'> }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.database.one<UserRow>(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [email],
    );
    if (!user || !(await argon2.verify(user.password_hash, dto.password)))
      throw new UnauthorizedException('Email or password is incorrect.');
    if (!user.is_active)
      throw new UnauthorizedException('Account is inactive.');
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, user: this.publicUser(user) };
  }

  private publicUser(user: UserRow): Omit<UserRow, 'password_hash'> {
    const { password_hash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
