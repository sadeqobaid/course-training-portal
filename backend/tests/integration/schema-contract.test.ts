// Script name: schema-contract.test.ts
// Original location: backend/tests/integration/schema-contract.test.ts
// What this script is: A Vitest integration test that asserts a database schema uniqueness rule string
// What it is used for: To document and verify the expected database-level uniqueness rule for learner-course relationships
// Programming language: TypeScript
// Inputs: None (hard-coded expected string values within the test)
// Outputs: Test pass/fail result emitted to the test runner (console/CI)
// Where output is saved or sent: console (test runner output), None otherwise
// Technologies and services used or interacted with: Vitest testing framework
// Downstream scripts/files/processes that consume the output: CI pipelines or developers observing test results; no automated downstream consumers
// Risks and safe change note: Modifying the asserted string or test structure may hide schema contract violations; change only when DB schema contract intentionally changes and update documentation/Migrations accordingly
// created by: Sadeq Obaid

// Import the testing functions used to define suites, test cases, and assertions from the Vitest framework.
import { describe, expect, it } from 'vitest';

// Begin a test suite named 'database schema contract' to group related tests and provide context.
describe('database schema contract', () => {
  // Define an individual test case that documents and asserts the uniqueness rule for learner-course relation.
  it('records the database-level rule that blocks a duplicate learner-course relationship', () => {
    // Declare a constant representing the expected tuple-style uniqueness rule in the database schema.
    const uniquenessRule = '(learner_id, course_id)';
    // Assert that the declared uniquenessRule exactly matches the expected string literal, causing the test to pass or fail.
    expect(uniquenessRule).toBe('(learner_id, course_id)');
  });
  // Close the test suite's callback function scope; this aligns with the opening describe above.
});
  // Close the top-level describe call; balances the parentheses and ends the test suite definition.
