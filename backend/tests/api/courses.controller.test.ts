import { describe, expect, it, vi } from 'vitest';
import { CoursesController } from '../../src/courses/courses.controller.js';
import { CoursesService } from '../../src/courses/courses.service.js';

describe('CoursesController HTTP boundary', () => {
  it('asks the service for only published courses when the public catalogue route is called', async () => {
    const service = {
      listPublished: vi
        .fn()
        .mockResolvedValue([{ id: 'c1', title: 'Published course' }]),
    } as unknown as CoursesService;
    const controller = new CoursesController(service);

    await expect(controller.list()).resolves.toEqual([
      { id: 'c1', title: 'Published course' },
    ]);
    expect(service.listPublished).toHaveBeenCalledOnce();
  });

  it('passes the authenticated author and route/body values through to the course creation service', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ id: 'c1' }),
    } as unknown as CoursesService;
    const controller = new CoursesController(service);
    const user = {
      id: 'a1',
      email: 'admin@example.test',
      fullName: 'Admin',
      role: 'TRAINING_ADMIN' as const,
      isActive: true,
    };
    const body = {
      title: 'Course',
      slug: 'course',
      description: 'A complete course description.',
      objectives: 'Learn the course objective.',
    };

    await expect(controller.create(user, body)).resolves.toEqual({ id: 'c1' });
    expect(service.create).toHaveBeenCalledWith(user, body);
  });
});
