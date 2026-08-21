import { describe, expect, it, vi } from 'vitest';
import { ManagementController } from '../../src/management/management.controller.js';
import { ManagementService } from '../../src/management/management.service.js';

describe('ManagementController role-workspace boundary', () => {
  const instructor = {
    id: 'instructor-id', email: 'instructor@example.test', fullName: 'Instructor',
    role: 'INSTRUCTOR' as const, isActive: true,
  };

  it('requests role-aware course summaries for the signed-in workspace actor', async () => {
    const service = { coursesFor: vi.fn().mockResolvedValue([{ id: 'course-1', title: 'Owned course' }]) } as unknown as ManagementService;
    const controller = new ManagementController(service);
    await expect(controller.courses(instructor)).resolves.toEqual([{ id: 'course-1', title: 'Owned course' }]);
    expect(service.coursesFor).toHaveBeenCalledWith(instructor);
  });

  it('passes a training announcement to the management service', async () => {
    const service = { announce: vi.fn().mockResolvedValue({ recipients: 4 }) } as unknown as ManagementService;
    const controller = new ManagementController(service);
    const dto = { subject: 'Course update', body: 'Please review the new lesson.', recipientRole: 'LEARNER' as const };
    await expect(controller.announce(dto)).resolves.toEqual({ recipients: 4 });
    expect(service.announce).toHaveBeenCalledWith(dto);
  });
});
