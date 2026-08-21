// Script name: progress.test.ts
// Original location: backend/tests/unit/progress.test.ts
// What this script is: Unit tests verifying progress percentage calculation
// What it is used for: Ensures progressPercent returns correct integer percentages for lesson completion scenarios
// Programming language: TypeScript
// Inputs: numeric arguments (total lessons, completed lessons) provided in test cases
// Outputs: numeric percentage values returned by progressPercent; test pass/fail results emitted by the test runner
// Where output is saved or sent: console (test runner output)
// Technologies and services used or interacted with: Vitest testing framework, Node.js runtime
// Downstream scripts/files/processes that consume the output: CI/test-reporting tools and any developers or systems that review test results; no direct file outputs
// Risks and safe change note: Modifying calculation, edge-case handling, or rounding behavior will change test expectations and may break dependent code; update tests and dependent modules accordingly
// created by: Sadeq Obaid

// Import the test functions (describe, expect, it) from the Vitest testing framework for defining and asserting tests
import { describe, expect, it } from 'vitest';

// Declare a function named progressPercent that takes total and completed numbers and returns a number percentage
function progressPercent(total: number, completed: number): number {
  // Compute the percentage as floor((completed / total) * 100) but return 0 when total is zero to avoid division by zero
  return total === 0 ? 0 : Math.floor((completed / total) * 100);
}
// End of progressPercent function declaration

// Define a test suite named 'progressPercent' grouping related test cases for the function
describe('progressPercent', () => {
  // Start of first test case: verifies behavior when there are no published lessons
  it('returns zero for a course with no published lessons', () => {
    // Assert that progressPercent(0, 0) returns 0, checking the total===0 guard branch
    expect(progressPercent(0, 0)).toBe(0);
  });
  // End of first test case

  // Start of second test case: verifies rounding down behavior for fractional completion
  it('rounds down the completed lesson fraction as a whole percentage', () => {
    // Assert that progressPercent(3, 2) returns 66, checking Math.floor rounding down of 66.666... to 66
    expect(progressPercent(3, 2)).toBe(66);
  });
  // End of second test case

  // Start of third test case: verifies full completion returns exactly 100
  it('returns one hundred only when every lesson is complete', () => {
    // Assert that progressPercent(4, 4) returns 100, checking the case where completed equals total
    expect(progressPercent(4, 4)).toBe(100);
  });
  // End of third test case
});
// End of 'progressPercent' test suite
