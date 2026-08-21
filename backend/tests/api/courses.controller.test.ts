// Script name: courses.controller.test.ts
// Original location: backend/tests/api/courses.controller.test.ts
// What this script is: Unit tests for the CoursesController HTTP boundary using Vitest.
// What it is used for: Verifies that the controller delegates to the CoursesService correctly for public listing and course creation.
// Programming language: TypeScript
// Inputs: Mocked CoursesService methods, mocked authenticated user and request body objects passed into controller methods.
// Outputs: Test assertions/resolved values reported to the test runner (Vitest) and thrown failures on assertion mismatch.
// Where output is saved or sent: None
// Technologies and services used or interacted with: Vitest test runner (describe/it/expect/vi), CoursesController, CoursesService type from project code.
// Downstream scripts/files/processes that consume the output: CI test runner and local developer console/terminal receiving Vitest reports.
// Risks and safe change note: Modifying tests or assertions changes verification coverage; altering mocks may mask integration issues. Safe changes should preserve intent of assertions and mock behaviors.
// created by: Sadeq Obaid

// Import the testing helpers and utilities from Vitest used to define and run tests and create mocks.
import { describe, expect, it, vi } from 'vitest';
// Import the CoursesController to be instantiated and tested; path uses project source location.
import { CoursesController } from '../../src/courses/courses.controller.js';
// Import the CoursesService type for casting the mocked service objects to the expected type.
import { CoursesService } from '../../src/courses/courses.service.js';

// Define a test suite titled 'CoursesController HTTP boundary' to group related tests about the controller's HTTP-facing behavior.
describe('CoursesController HTTP boundary', () => {
  // Define an individual test that ensures the controller lists only published courses through the appropriate service call.
  it('asks the service for only published courses when the public catalogue route is called', async () => {
    // Create a mocked service object with only the listPublished method implemented as a Vitest mock function.
    const service = {
      // Define the listPublished property and start setting it to a mocked function using vi.
      listPublished: vi
        // Create a mock function instance to simulate the service method.
        .fn()
        // Configure the mock to return a resolved promise yielding an array with a single published course object.
        .mockResolvedValue([{ id: 'c1', title: 'Published course' }]),
    } as unknown as CoursesService;
    // Instantiate the controller under test, injecting the mocked service so controller calls go to the mock.
    const controller = new CoursesController(service);

    // Invoke the controller.list method and assert the returned promise resolves to the expected array of published courses.
    await expect(controller.list()).resolves.toEqual([
      { id: 'c1', title: 'Published course' },
    ]);
    // Assert that the mocked service.listPublished method was invoked exactly once by the controller.
    expect(service.listPublished).toHaveBeenCalledOnce();
  });

  // Define a test that verifies the controller forwards authenticated user and request body values to the service create method.
  it('passes the authenticated author and route/body values through to the course creation service', async () => {
    // Create a mocked service object with only the create method implemented as a Vitest mock function.
    const service = {
      // Provide a create mock that resolves to an object representing the created course id.
      create: vi.fn().mockResolvedValue({ id: 'c1' }),
    } as unknown as CoursesService;
    // Instantiate the controller with the mocked service so create calls are intercepted.
    const controller = new CoursesController(service);
    // Define a mocked authenticated user object representing the author initiating the creation.
    const user = {
      // Unique identifier for the mocked author.
      id: 'a1',
      // Email address for the mocked author.
      email: 'admin@example.test',
      // Full name string for the mocked author.
      fullName: 'Admin',
      // Role constant indicating the author has training admin privileges; preserved as a const assertion.
      role: 'TRAINING_ADMIN' as const,
      // Boolean indicating the author account is active.
      isActive: true,
    };
    // Define a request body object representing the course creation payload that will be forwarded to the service.
    const body = {
      // Title field for the new course.
      title: 'Course',
      // Slug value for the new course.
      slug: 'course',
      // Description text for the new course.
      description: 'A complete course description.',
      // Objectives field describing learning objectives.
      objectives: 'Learn the course objective.',
    };

    // Call controller.create with the mocked user and body and assert it resolves to the created course id object.
    await expect(controller.create(user, body)).resolves.toEqual({ id: 'c1' });
    // Verify that the service.create mock was called with the exact user and body objects provided to the controller.
    expect(service.create).toHaveBeenCalledWith(user, body);
  });
});
