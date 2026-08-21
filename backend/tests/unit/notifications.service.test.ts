import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/env.js', () => ({
  env: { smtpHost: '127.0.0.1', smtpPort: 1025, smtpFrom: 'training-portal@example.test' },
}));

import { NotificationsService } from '../../src/notifications/notifications.service.js';

describe('NotificationsService', () => {
  it('queues one in-app notification and one separately idempotent email notification', async () => {
    const database = { query: vi.fn().mockResolvedValue([]) };
    const service = new NotificationsService(database as never);

    await service.createInAppAndEmailOnce({
      recipientId: 'learner-1',
      type: 'WELCOME',
      key: 'welcome:learner-1',
      subject: 'Welcome',
      body: 'Your account is ready.',
    });

    expect(database.query).toHaveBeenCalledTimes(2);
    expect(database.query.mock.calls[0][1]).toEqual(['learner-1', 'IN_APP', 'WELCOME', 'welcome:learner-1', 'Welcome', 'Your account is ready.']);
    expect(database.query.mock.calls[1][1]).toEqual(['learner-1', 'EMAIL', 'WELCOME', 'welcome:learner-1:email', 'Welcome', 'Your account is ready.']);
  });

  it('returns only in-app notifications to the browser inbox', async () => {
    const database = { query: vi.fn().mockResolvedValue([]) };
    const service = new NotificationsService(database as never);

    await service.listForUser('learner-1');

    expect(database.query.mock.calls[0][0]).toContain("channel = 'IN_APP'");
    expect(database.query.mock.calls[0][1]).toEqual(['learner-1']);
  });
});
