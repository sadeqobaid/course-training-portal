// Script name: users.controller.test.ts
// Original location: backend/tests/api/users.controller.test.ts
// What this script is: Unit tests for the UsersController focusing on system-administration boundary behavior
// What it is used for: To verify that UsersController forwards calls to UsersService correctly and does not leak sensitive fields (e.g., passwords)
// Programming language: TypeScript
// Inputs: Hard-coded test fixtures (actor, DTOs) and mocked UsersService responses provided in-memory
// Outputs: Test assertions/results reported by the test runner (vitest)
// Where output is saved or sent: console (test runner output)
// Technologies and services used or interacted with: vitest (testing framework), UsersController, UsersService (mocked), TypeScript
// Downstream scripts/files/processes that consume the output: CI test reporting, developer consoles; no direct file artifacts produced
// Risks and safe change note: Changing tests affects verification coverage; update mocks and assertions carefully to avoid weakening protections (e.g., ensuring passwords are not exposed)
// created by: Sadeq Obaid

// Import vitest test helpers and the mocking utility `vi` used to create stubbed service functions.
import { describe, expect, it, vi } from 'vitest';
// Import the UsersController class that is the subject under test.
import { UsersController } from '../../src/users/users.controller.js';
// Import the UsersService type so mocks can be typed as the service interface for clarity.
import { UsersService } from '../../src/users/users.service.js';

// Define a test suite named to indicate these tests examine the system-administration boundary of UsersController.
describe('UsersController system-administration boundary', () => {
  // Define a reusable fake actor object representing a System Administrator performing actions in tests.
  const actor = {
    // Unique identifier of the fake actor; used when forwarding actor context into service calls.
    id: 'system-admin-id', email: 'system@example.test', fullName: 'System Admin',
    // Role set to SYSTEM_ADMIN and marked active so controller/service behavior reflects admin privileges.
    role: 'SYSTEM_ADMIN' as const, isActive: true,
  };

  // Test case: creating a managed account should forward the DTO to the service and not expose passwords in the returned value.
  it('passes a new managed account to the service without exposing a password result', async () => {
    // Create a mock UsersService with a `create` method that resolves to a user object lacking any password field.
    const service = { create: vi.fn().mockResolvedValue({ id: 'u1', email: 'trainer@example.test', role: 'TRAINING_ADMIN' }) } as unknown as UsersService;
    // Instantiate the UsersController under test with the mocked service dependency.
    const controller = new UsersController(service);
    // Prepare a DTO representing a new managed account that includes a temporary password (which must not be returned).
    const dto = { email: 'trainer@example.test', fullName: 'Training Admin', password: 'SafeTemporary1', role: 'TRAINING_ADMIN' as const };
    // Assert that controller.create resolves to the service-provided user object (without password), verifying no password exposure.
    await expect(controller.create(dto)).resolves.toEqual({ id: 'u1', email: 'trainer@example.test', role: 'TRAINING_ADMIN' });
    // Verify that the controller passed the exact DTO through to the service.create call.
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  // Test case: updating a user's role/activation should include the acting System Administrator when calling the service.
  it('passes the acting System Administrator into a role or activation change', async () => {
    // Mock UsersService.update to resolve to an updated user object showing the new role.
    const service = { update: vi.fn().mockResolvedValue({ id: 'u1', role: 'INSTRUCTOR' }) } as unknown as UsersService;
    // Instantiate the controller with the mocked service to observe forwarded parameters.
    const controller = new UsersController(service);
    // Call controller.update with the actor, target user id, and update payload, and assert the resolved result matches the service response.
    await expect(controller.update(actor, 'u1', { role: 'INSTRUCTOR' })).resolves.toEqual({ id: 'u1', role: 'INSTRUCTOR' });
    // Verify that the service.update call received the actor object, target id, and the exact update payload.
    expect(service.update).toHaveBeenCalledWith(actor, 'u1', { role: 'INSTRUCTOR' });
  });
});
