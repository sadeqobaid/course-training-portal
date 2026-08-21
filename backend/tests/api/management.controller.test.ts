// Script name: management.controller.test.ts
// Original location: backend/tests/api/management.controller.test.ts
// What this script is: Unit tests for the ManagementController focusing on role-workspace boundary behaviors
// What it is used for: Validates that ManagementController delegates correctly to ManagementService and respects actor roles when producing outputs
// Programming language: TypeScript
// Inputs: Hard-coded test fixtures (instructor) and mocked ManagementService methods and return values
// Outputs: Test results asserted via Vitest (reported to the test runner/console)
 // Where output is saved or sent: console
// Technologies and services used or interacted with: Vitest test runner, ManagementController and ManagementService modules
// Downstream scripts/files/processes that consume the output: Vitest reporter and CI pipelines that aggregate test results; developers reviewing test outputs
// Risks and safe change note: Changing ManagementController or ManagementService method signatures, DTO shapes, or test fixture structures will break these tests; update tests accordingly when refactoring implementations
// created by: Sadeq Obaid

// Import vitest utilities for defining test suites, assertions, and creating mocks
import { describe, expect, it, vi } from 'vitest';
// Import the controller under test from the source location
import { ManagementController } from '../../src/management/management.controller.js';
// Import the service type to enable casting of mocked service objects to the expected interface
import { ManagementService } from '../../src/management/management.service.js';

// Define a test suite that groups tests concerning role-workspace boundaries for the ManagementController
describe('ManagementController role-workspace boundary', () => {
  // Create a fixture representing an instructor workspace actor with identifying fields and role metadata
  const instructor = {
    // Provide unique identifier, contact email, and display name for the instructor fixture
    id: 'instructor-id', email: 'instructor@example.test', fullName: 'Instructor',
    // Specify the actor role as the literal 'INSTRUCTOR' and indicate the account is active; 'as const' narrows the TypeScript type
    role: 'INSTRUCTOR' as const, isActive: true,
  };

  // Test case: ensure controller.courses delegates to service.coursesFor and returns the service's resolved value
  it('requests role-aware course summaries for the signed-in workspace actor', async () => {
    // Mock a ManagementService where coursesFor is a function returning a resolved promise with a single course object
    const service = { coursesFor: vi.fn().mockResolvedValue([{ id: 'course-1', title: 'Owned course' }]) } as unknown as ManagementService;
    // Instantiate the controller using the mocked service dependency to observe delegation behavior
    const controller = new ManagementController(service);
    // Invoke controller.courses with the instructor fixture and assert the returned promise resolves to the expected course array
    await expect(controller.courses(instructor)).resolves.toEqual([{ id: 'course-1', title: 'Owned course' }]);
    // Confirm that the service's coursesFor method was called with the exact instructor fixture, verifying correct parameter forwarding
    expect(service.coursesFor).toHaveBeenCalledWith(instructor);
  });

  // Test case: ensure controller.announce forwards the announcement DTO to service.announce and returns the service result
  it('passes a training announcement to the management service', async () => {
    // Mock a ManagementService where announce is a function returning a resolved promise with a recipients count
    const service = { announce: vi.fn().mockResolvedValue({ recipients: 4 }) } as unknown as ManagementService;
    // Instantiate the controller with the announce-mocking service to verify delegation
    const controller = new ManagementController(service);
    // Define the announcement DTO including subject, body, and recipientRole typed as the 'LEARNER' literal
    const dto = { subject: 'Course update', body: 'Please review the new lesson.', recipientRole: 'LEARNER' as const };
    // Call controller.announce with the DTO and assert the returned promise resolves to the mocked recipients result
    await expect(controller.announce(dto)).resolves.toEqual({ recipients: 4 });
    // Verify that the service's announce method was invoked with the same DTO to ensure proper forwarding of parameters
    expect(service.announce).toHaveBeenCalledWith(dto);
  });
});
