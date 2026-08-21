// Script name: scoring.test.ts
// Original location: backend/tests/unit/scoring.test.ts
// What this script is: Unit tests for a deterministic assessment scoring helper
// What it is used for: Verifying the scoring logic that computes percentage and pass/fail against a threshold
// Programming language: TypeScript
// Inputs: Maps of correct answers and submitted answers, passing score threshold (numbers and string keys/values)
// Outputs: Test assertions; the score function returns an object { scorePercent, passed }
// Where output is saved or sent: None (results reported via test runner console)
// Technologies and services used or interacted with: vitest test runner, JavaScript Map, Number formatting
// Downstream scripts/files/processes that consume the output: test reports and CI logs; no downstream file outputs
// Risks and safe change note: Changing scoring calculation, rounding, or comparison logic may alter pass/fail outcomes; keep numeric precision and comparison semantics intact when modifying
// created by: Sadeq Obaid

// Import testing helpers from the vitest test framework to define suites and assertions.
import { describe, expect, it } from 'vitest';

// Define a pure helper function that computes a percentage score and boolean pass/fail given correct answers, submissions, and a passing threshold.
function score(
  // Parameter: a Map keyed by questionId with the correct optionId as value.
  correctOptionByQuestion: Map<string, string>,
  // Parameter: a Map keyed by questionId with the submitted optionId as value.
  submitted: Map<string, string>,
  // Parameter: numeric passing score threshold (percentage) used to determine passed boolean.
  passingScore: number,
) {
  // Determine the number of correctly answered questions by iterating the correct map,
  // comparing each correct option to the submitted option for the same questionId.
  const correct = [...correctOptionByQuestion].filter(
    // For each tuple [questionId, optionId], check if the submitted map returns the same optionId.
    ([questionId, optionId]) => submitted.get(questionId) === optionId,
  ).length;
  // Compute the score percentage as a number with two decimal places, converting to Number type.
  const scorePercent = Number(
    // Calculate fraction correct times 100 and round to two decimals via toFixed.
    ((correct / correctOptionByQuestion.size) * 100).toFixed(2),
  );
  // Return an object with the computed percentage and a boolean indicating if it meets/exceeds passingScore.
  return { scorePercent, passed: scorePercent >= passingScore };
}

// Define a test suite that groups tests for deterministic assessment scoring behavior.
describe('deterministic assessment scoring', () => {
  // Define a test case: should pass when computed score equals the threshold exactly.
  it('passes when the score equals the threshold', () => {
    // Construct a Map of correct answers for two questions.
    const correct = new Map([
      // Question q1 has correct option a1.
      ['q1', 'a1'],
      // Question q2 has correct option a2.
      ['q2', 'a2'],
    ]);
    // Construct a Map of submitted answers where one is correct and one is wrong, yielding 50%.
    const submitted = new Map([
      // Submitted q1 matches correct a1.
      ['q1', 'a1'],
      // Submitted q2 is wrong.
      ['q2', 'wrong'],
    ]);
    // Assert that calling score with a passing threshold of 50 yields exactly 50% and passed true.
    expect(score(correct, submitted, 50)).toEqual({
      scorePercent: 50,
      passed: true,
    });
  });

  // Define a test case: should fail when computed score is below the threshold.
  it('fails when the score is below the threshold', () => {
    // Construct a Map of correct answers for two questions.
    const correct = new Map([
      // Correct mapping for q1.
      ['q1', 'a1'],
      // Correct mapping for q2.
      ['q2', 'a2'],
    ]);
    // Construct a Map of submitted answers where one is correct and one is wrong, yielding 50%.
    const submitted = new Map([
      // Submitted q1 is wrong.
      ['q1', 'wrong'],
      // Submitted q2 matches correct a2.
      ['q2', 'a2'],
    ]);
    // Assert that calling score with a higher passing threshold (70) yields 50% and passed false.
    expect(score(correct, submitted, 70)).toEqual({
      scorePercent: 50,
      passed: false,
    });
  });
});
