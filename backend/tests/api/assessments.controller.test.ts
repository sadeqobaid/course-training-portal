// Script name: assessments.controller.test.ts
// Original location: backend/tests/api/assessments.controller.test.ts
// What this script is: Unit tests validating instructor ownership boundaries on AssessmentsController
// What it is used for: Ensures the controller forwards the actor (instructor) to service methods so ownership rules are enforced
// Programming language: TypeScript
// Inputs: Mocked AssessmentsService methods, hard-coded instructor fixture, DTO objects, vitest test runner
// Outputs: Test results (pass/fail) emitted by the test runner
// Where output is saved or sent: console (test runner output)
// Technologies and services used or interacted with: vitest, AssessmentsController, AssessmentsService, Node.js
// Downstream scripts/files/processes that consume the output: CI test reporters, developer consoles, and any test aggregation tooling
// Risks and safe change note: Modifying DTO shapes, mock behavior, or asserted call signatures may invalidate the test's purpose; run the full test suite and confirm mocks match production interfaces before changing
// created by: Sadeq Obaid

// Import vitest test helpers (describe, expect, it) and vi for mocking functions
import { describe, expect, it, vi } from 'vitest';
// Import the AssessmentsController class under test so controller methods can be invoked
import { AssessmentsController } from '../../src/assessments/assessments.controller.js';
// Import the AssessmentsService type to use for typing mocked service objects in tests
import { AssessmentsService } from '../../src/assessments/assessments.service.js';

// Define a test suite focused on instructor ownership boundary behavior of the controller
describe('AssessmentsController instructor ownership boundary', () => {
  // Declare a fixture representing an instructor actor used across tests
  const instructor = {
    // Unique identifier, email, and display name for the instructor actor
    id: 'instructor-id', email: 'instructor@example.test', fullName: 'Instructor',
    // Role is asserted as the literal 'INSTRUCTOR' and the instructor is active
    role: 'INSTRUCTOR' as const, isActive: true,
  };

  // Define a test case that ensures the controller forwards the actor to the create service method
  it('passes the actor to assessment creation so service ownership rules can be enforced', async () => {
    // Create a mocked service with a create method that resolves to a fake assessment id; typed as AssessmentsService
    const service = { create: vi.fn().mockResolvedValue({ id: 'assessment-1' }) } as unknown as AssessmentsService;
    // Instantiate the controller with the mocked service so controller.create will call the mocked create
    const controller = new AssessmentsController(service);
    // Define the DTO for assessment creation used as input to controller.create
    const dto = { title: 'Final knowledge check' };
    // Invoke controller.create and assert it resolves to the mocked result, ensuring the controller returns service value
    await expect(controller.create(instructor, 'course-1', dto)).resolves.toEqual({ id: 'assessment-1' });
    // Verify the mocked service.create was called with the instructor actor, course id, and DTO, enforcing ownership forwarding
    expect(service.create).toHaveBeenCalledWith(instructor, 'course-1', dto);
  });

  // Define a test case that ensures the controller forwards the actor to the addQuestion service method
  it('passes the actor to question creation so instructors cannot alter another author’s course', async () => {
    // Create a mocked service with an addQuestion method that resolves to a fake question id; typed as AssessmentsService
    const service = { addQuestion: vi.fn().mockResolvedValue({ id: 'question-1' }) } as unknown as AssessmentsService;
    // Instantiate the controller with the mocked service so controller.addQuestion will call the mocked addQuestion
    const controller = new AssessmentsController(service);
    // Define the DTO for adding a question, including prompt, position, and options array
    const dto = { prompt: 'Choose the correct answer.', position: 1, options: [{ optionText: 'A', isCorrect: true }, { optionText: 'B', isCorrect: false }] };
    // Invoke controller.addQuestion and assert it resolves to the mocked result, ensuring the controller returns service value
    await expect(controller.addQuestion(instructor, 'assessment-1', dto)).resolves.toEqual({ id: 'question-1' });
    // Verify the mocked service.addQuestion was called with the instructor actor, assessment id, and DTO, enforcing ownership forwarding
    expect(service.addQuestion).toHaveBeenCalledWith(instructor, 'assessment-1', dto);
  });
});
