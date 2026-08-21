// Script name: workspace.helpers.test.ts
// Original location: frontend/src/pages/workspace.helpers.test.ts
// What this script is: Unit tests for helper functions used in workspace admin flows
// What it is used for: Verifies behavior of buildQuestionPayload and captureAsyncFormTarget helpers
// Programming language: TypeScript
// Inputs: Test inputs defined inline: prompt strings, option arrays, indices, form-like object
// Outputs: Assertions/results from Vitest test runner (pass/fail)
// Where output is saved or sent: None
// Technologies and services used or interacted with: Vitest test framework, frontend helper module './workspace.helpers'
// Downstream scripts/files/processes that consume the output: Test reports consumed by CI or developer; no direct downstream file consumers
// Risks and safe change note: Changes to helper implementations or these tests can alter test coverage and CI results; modify carefully to avoid false positives/negatives
// created by: Sadeq Obaid

// Import testing helpers from Vitest: describe for suites, it for test cases, expect for assertions.
import { describe, expect, it } from 'vitest';
// Import functions from local helpers module under test.
import { buildQuestionPayload, captureAsyncFormTarget } from './workspace.helpers';

// Define test suite named 'administrator question payload' grouping related test cases.
describe('administrator question payload', () => {
  // Test case: ensures only the selected option is marked as correct in payload.
  it('marks only the selected option as correct', () => {
    // Begin assertion: call buildQuestionPayload and compare result to expected object.
    expect(
      // Call buildQuestionPayload with prompt, position 1, two authoring options array, and selected index 1; returns a payload object synchronously.
      buildQuestionPayload('Which option is correct?', 1, [
        // Provide option text values in the authoring options array; these mirror user input.
        { text: 'First' },
        // Provide option text values in the authoring options array; these mirror user input.
        { text: 'Second' },
      ], 1),
    // Assert that returned payload strictly equals the expected object.
    ).toEqual({
      // Expected payload 'prompt' field equals original question string.
      prompt: 'Which option is correct?',
      // Expected payload 'position' field equals provided numeric position 1.
      position: 1,
      // Expected payload 'options' array contains transformed option objects with text and correctness flags.
      options: [
        // Option mapping: answer text mapped to optionText and isCorrect set per selected index (false for first).
        { optionText: 'First', isCorrect: false },
        // Second option expected to be marked correct because selected index was 1.
        { optionText: 'Second', isCorrect: true },
      ],
    });
  });

  // Test case: verifies buildQuestionPayload throws when any authoring option is empty or whitespace.
  it('rejects an empty authoring option before it reaches the API', () => {
    // Begin assertion that invoking the function throws an error; pass a function to expect.
    expect(() =>
      // Invoke buildQuestionPayload with one valid and one blank option to trigger validation error.
      buildQuestionPayload('Question', 1, [{ text: 'Yes' }, { text: ' ' }], 0),
    // Assert that the call throws specific error message about empty options.
    ).toThrow('Every answer option must contain text.');
  });

  // Test case: ensures captureAsyncFormTarget preserves synchronous reference across async boundaries; marked async for awaiting.
  it('keeps the synchronously captured form target available after asynchronous work', async () => {
    // Initialize counter to verify reset side effect calls.
    let resetCount = 0;
    // Create a minimal form-like object with reset method incrementing counter to simulate DOM form.reset().
    const form = { reset: () => { resetCount += 1; } };
    // Capture form synchronously via helper to ensure it's preserved for later use.
    const capturedForm = captureAsyncFormTarget(form);

    // Await a resolved promise to force a microtask tick and simulate asynchronous work without real delay.
    await Promise.resolve();
    // Call reset on the captured form reference; should invoke the original form.reset and increment resetCount.
    capturedForm.reset();

    // Assert that reset was called exactly once, confirming captured reference is still valid after async await.
    expect(resetCount).toBe(1);
  });
});
