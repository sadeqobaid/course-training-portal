import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    return context.switchToHttp().getRequest<{ user: AuthenticatedUser }>()
      .user;
  },
);
