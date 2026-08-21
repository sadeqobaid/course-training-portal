// Script name: notifications.service.test.ts
// Original location: backend/tests/unit/notifications.service.test.ts
// What this script is: Unit tests for the NotificationsService class.
// What it is used for: Verifies that the NotificationsService enqueues in-app and idempotent email notifications and lists in-app notifications for a user.
// Programming language: TypeScript
// Inputs: Test definitions, mocked environment module, mocked database query function, NotificationsService implementation.
// Outputs: Test assertions reported to the test runner (pass/fail results).
// Where output is saved or sent: None
// Technologies and services used or interacted with: Vitest (test framework), mocked env configuration, NotificationsService module, in-memory mocks (no real SMTP or DB).
// Downstream scripts/files/processes that consume the output: Test runner (Vitest) reporters and CI systems that collect test results.
// Risks and safe change note: Changing test code can alter validation of NotificationsService behavior; keep assertions and mocks aligned with production behavior and avoid modifying service implementation while adjusting tests. Ensure mocks reflect intended external behavior.
// created by: Sadeq Obaid

// Import test helpers (describe, expect, it) and mocking utility (vi) from Vitest to define and run unit tests.
import { describe, expect, it, vi } from 'vitest';

// Replace the '../../src/config/env.js' module with a mock providing deterministic SMTP configuration values for the tests.
// This mock ensures any code importing env.js will receive these known smtpHost, smtpPort, and smtpFrom values, avoiding external dependencies.
vi.mock('../../src/config/env.js', () => ({
  env: { smtpHost: '127.0.0.1', smtpPort: 1025, smtpFrom: 'training-portal@example.test' },
}));

// Import the NotificationsService class under test from the source directory so tests exercise its behavior.
import { NotificationsService } from '../../src/notifications/notifications.service.js';

// Define a test suite named 'NotificationsService' grouping related tests for that service.
describe('NotificationsService', () => {
  // Define a test case that asserts the service queues both an in-app notification and a separate idempotent email notification.
  it('queues one in-app notification and one separately idempotent email notification', async () => {
    // Create a fake database object with a query method mocked to return an empty array asynchronously; this intercepts DB calls and records invocations.
    const database = { query: vi.fn().mockResolvedValue([]) };
    // Instantiate NotificationsService with the mocked database; cast to 'never' to satisfy type requirements in tests without changing runtime behavior.
    const service = new NotificationsService(database as never);

    // Call the method under test to create an in-app notification and an email (ensuring idempotence), awaiting its completion.
    await service.createInAppAndEmailOnce({
      // Specify the recipient identifier used to scope notifications to a particular user.
      recipientId: 'learner-1',
      // Provide the notification channel type for the in-app message being queued.
      type: 'WELCOME',
      // Provide an idempotency key so email notifications are only queued once per unique key.
      key: 'welcome:learner-1',
      // Provide the subject line text for the notification/email.
      subject: 'Welcome',
      // Provide the body text for the notification/email.
      body: 'Your account is ready.',
    });

    // Assert that the database.query mock was called exactly twice: once for the in-app notification and once for the email notification.
    expect(database.query).toHaveBeenCalledTimes(2);
    // Assert that the first database.query call's parameter array (position 1) matches the expected values for the in-app notification insertion.
    expect(database.query.mock.calls[0][1]).toEqual(['learner-1', 'IN_APP', 'WELCOME', 'welcome:learner-1', 'Welcome', 'Your account is ready.']);
    // Assert that the second database.query call's parameter array matches the expected values for the idempotent email notification insertion (note ':email' suffix for key).
    expect(database.query.mock.calls[1][1]).toEqual(['learner-1', 'EMAIL', 'WELCOME', 'welcome:learner-1:email', 'Welcome', 'Your account is ready.']);
  });

  // Define a test case that asserts only in-app notifications are returned for a user when listing their inbox.
  it('returns only in-app notifications to the browser inbox', async () => {
    // Create another mocked database object whose query resolves to an empty array to capture the listing query without external DB access.
    const database = { query: vi.fn().mockResolvedValue([]) };
    // Instantiate NotificationsService with the mocked database to test the listForUser behavior.
    const service = new NotificationsService(database as never);

    // Invoke listForUser to retrieve notifications for the specified user; awaiting ensures any async query is executed.
    await service.listForUser('learner-1');

    // Verify that the SQL or query text used in the first database.query call filters by the IN_APP channel, ensuring only in-app notifications are selected.
    expect(database.query.mock.calls[0][0]).toContain("channel = 'IN_APP'");
    // Verify that the parameter array for the query contains only the user id, indicating the listing is scoped to that user.
    expect(database.query.mock.calls[0][1]).toEqual(['learner-1']);
  });
});
