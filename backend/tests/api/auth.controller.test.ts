// Script name: auth.controller.test.ts
// Original location: backend/tests/api/auth.controller.test.ts
// What this script is: Unit tests for the AuthController HTTP boundary
// What it is used for: Verifies that AuthController delegates to AuthService correctly and returns expected values
// Programming language: TypeScript
// Inputs: Mocked AuthService behaviors and constructed request/body objects within test cases
// Outputs: Test assertions (pass/fail) emitted to the test runner console; no persistent data produced
// Where output is saved or sent: console
// Technologies and services used or interacted with: vitest (testing framework), AuthController and AuthService modules from source
// Downstream scripts/files/processes that consume the output: Test runner/reporting tools; no downstream code consumes these test outputs directly
// Risks and safe change note: Changing test expectations or mocks may invalidate behavior coverage; keep aligned with AuthController/AuthService API and validation rules
// created by: Sadeq Obaid

// Import testing helpers and assertion utilities from vitest: describe to group tests, expect for assertions, it for test cases, vi for spies/mocks.
import { describe, expect, it, vi } from 'vitest';
// Import the AuthController class under test from the application source; this is the subject of these unit tests.
import { AuthController } from '../../src/auth/auth.controller.js';
// Import the AuthService type to type-cast mocked service objects used in tests for better type safety.
import { AuthService } from '../../src/auth/auth.service.js';

// Define a test suite labeled 'AuthController HTTP boundary' to group related tests about the controller's HTTP boundary behavior.
describe('AuthController HTTP boundary', () => {
  // Define a test case that ensures the controller hands a validated registration body to the service and returns the service result.
  it('passes a validated registration body to the authentication service and returns its result', async () => {
    // Create a fake service object with a 'register' method mocked using vi.fn() and pre-configure it to resolve to a known value.
    const service = {
      register: vi
        .fn()
        .mockResolvedValue({
          user: { id: 'u1', email: 'learner@example.test' },
        }),
    } as unknown as AuthService;
    // Instantiate the controller under test, injecting the mocked service to observe interactions and return values.
    const controller = new AuthController(service);
    // Construct a registration body representing validated input the controller would receive (email, password, fullName).
    const body = {
      email: 'learner@example.test',
      password: 'Password123!',
      fullName: 'Learner Example',
    };

    // Assert that calling controller.register with the body resolves to the same value the service mock returns.
    await expect(controller.register(body)).resolves.toEqual({
      user: { id: 'u1', email: 'learner@example.test' },
    });
    // Verify that the controller forwarded the exact body object to the service.register method.
    expect(service.register).toHaveBeenCalledWith(body);
  });

  // Define a test case that ensures the controller returns the authenticated identity attached to the request by a guard.
  it('returns the authenticated identity that the guard attached to the request', () => {
    // Create an empty service stub because this test focuses on controller.me and does not call service methods.
    const service = {} as AuthService;
    // Instantiate the controller with the stubbed service to test the me method behavior.
    const controller = new AuthController(service);
    // Prepare a user object that simulates the identity attached to the request by authentication guard middleware.
    const user = {
      id: 'u1',
      email: 'learner@example.test',
      fullName: 'Learner Example',
      role: 'LEARNER' as const,
      isActive: true,
    };

    // Assert that controller.me returns an object containing the provided user under the 'user' key.
    expect(controller.me(user)).toEqual({ user });
  });
});
