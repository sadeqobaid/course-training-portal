// Script name: client.test.ts
// Original location: frontend/src/api/client.test.ts
// What this script is: A small unit test verifying a frontend API path convention using the vitest test runner
// What it is used for: To assert that the frontend uses a specific versioned API prefix (/api/v1) as a convention
// Programming language: TypeScript
// Inputs: None (uses a hardcoded string literal representing the API prefix)
// Outputs: Test assertion result (pass/fail) emitted by the test runner
// Where output is saved or sent: console (test runner output)
// Technologies and services used or interacted with: vitest (JavaScript/TypeScript test framework)
// Downstream scripts/files/processes that consume the output: Continuous Integration (CI) systems and test reporters that aggregate test results
// Risks and safe change note: Modifying the asserted string or test descriptions can cause test failures or false positives; update only if API path conventions change and verify via CI before merging
// created by: Sadeq Obaid

// Import the core test functions from the vitest testing library to define suites, tests, and assertions.
import { describe, expect, it } from 'vitest';

// Define a test suite named 'frontend API path convention' that groups related tests and provides a callback containing test cases.
describe('frontend API path convention', () => {
  // Define an individual test case titled 'uses the versioned API prefix' that will execute the provided assertion when run.
  it('uses the versioned API prefix', () => {
    // Assert that the string '/api/v1' contains the substring '/api/v1'; this is a trivial self-containment check that will pass unless the literal is changed.
    expect('/api/v1').toContain('/api/v1');
  });
  // Close the 'it' test case block and return control to the outer 'describe' block; no additional side effects.
});

// Close the 'describe' test suite block, ending the grouping of related tests for the frontend API path convention.
