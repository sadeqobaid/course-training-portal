import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../src/auth/auth.controller.js';
import { AuthService } from '../../src/auth/auth.service.js';

describe('AuthController HTTP boundary', () => {
  it('passes a validated registration body to the authentication service and returns its result', async () => {
    const service = {
      register: vi
        .fn()
        .mockResolvedValue({
          user: { id: 'u1', email: 'learner@example.test' },
        }),
    } as unknown as AuthService;
    const controller = new AuthController(service);
    const body = {
      email: 'learner@example.test',
      password: 'Password123!',
      fullName: 'Learner Example',
    };

    await expect(controller.register(body)).resolves.toEqual({
      user: { id: 'u1', email: 'learner@example.test' },
    });
    expect(service.register).toHaveBeenCalledWith(body);
  });

  it('returns the authenticated identity that the guard attached to the request', () => {
    const service = {} as AuthService;
    const controller = new AuthController(service);
    const user = {
      id: 'u1',
      email: 'learner@example.test',
      fullName: 'Learner Example',
      role: 'LEARNER' as const,
      isActive: true,
    };

    expect(controller.me(user)).toEqual({ user });
  });
});
