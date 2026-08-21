import { describe, expect, it } from 'vitest';

function score(
  correctOptionByQuestion: Map<string, string>,
  submitted: Map<string, string>,
  passingScore: number,
) {
  const correct = [...correctOptionByQuestion].filter(
    ([questionId, optionId]) => submitted.get(questionId) === optionId,
  ).length;
  const scorePercent = Number(
    ((correct / correctOptionByQuestion.size) * 100).toFixed(2),
  );
  return { scorePercent, passed: scorePercent >= passingScore };
}

describe('deterministic assessment scoring', () => {
  it('passes when the score equals the threshold', () => {
    const correct = new Map([
      ['q1', 'a1'],
      ['q2', 'a2'],
    ]);
    const submitted = new Map([
      ['q1', 'a1'],
      ['q2', 'wrong'],
    ]);
    expect(score(correct, submitted, 50)).toEqual({
      scorePercent: 50,
      passed: true,
    });
  });

  it('fails when the score is below the threshold', () => {
    const correct = new Map([
      ['q1', 'a1'],
      ['q2', 'a2'],
    ]);
    const submitted = new Map([
      ['q1', 'wrong'],
      ['q2', 'a2'],
    ]);
    expect(score(correct, submitted, 70)).toEqual({
      scorePercent: 50,
      passed: false,
    });
  });
});
