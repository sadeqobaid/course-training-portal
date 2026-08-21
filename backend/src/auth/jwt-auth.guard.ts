import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';
import { AuthenticatedUser, JwtPayload, UserRole } from '../common/types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly database: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthenticatedUser;
      }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('A Bearer access token is required.');
    const token = authorization.slice('Bearer '.length);
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired.');
    }
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
    if (!user || !user.is_active)
      throw new UnauthorizedException('Account is unavailable.');
    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
    };
    return true;
  }
}
