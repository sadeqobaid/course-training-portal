import { describe, expect, it, vi } from 'vitest';
import { UsersController } from '../../src/users/users.controller.js';
import { UsersService } from '../../src/users/users.service.js';

describe('UsersController system-administration boundary', () => {
  const actor = {
    id: 'system-admin-id', email: 'system@example.test', fullName: 'System Admin',
    role: 'SYSTEM_ADMIN' as const, isActive: true,
  };

  it('passes a new managed account to the service without exposing a password result', async () => {
    const service = { create: vi.fn().mockResolvedValue({ id: 'u1', email: 'trainer@example.test', role: 'TRAINING_ADMIN' }) } as unknown as UsersService;
    const controller = new UsersController(service);
    const dto = { email: 'trainer@example.test', fullName: 'Training Admin', password: 'SafeTemporary1', role: 'TRAINING_ADMIN' as const };
    await expect(controller.create(dto)).resolves.toEqual({ id: 'u1', email: 'trainer@example.test', role: 'TRAINING_ADMIN' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('passes the acting System Administrator into a role or activation change', async () => {
    const service = { update: vi.fn().mockResolvedValue({ id: 'u1', role: 'INSTRUCTOR' }) } as unknown as UsersService;
    const controller = new UsersController(service);
    await expect(controller.update(actor, 'u1', { role: 'INSTRUCTOR' })).resolves.toEqual({ id: 'u1', role: 'INSTRUCTOR' });
    expect(service.update).toHaveBeenCalledWith(actor, 'u1', { role: 'INSTRUCTOR' });
  });
});
