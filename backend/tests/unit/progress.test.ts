import { describe, expect, it } from 'vitest';

function progressPercent(total: number, completed: number): number {
  return total === 0 ? 0 : Math.floor((completed / total) * 100);
}

describe('progressPercent', () => {
  it('returns zero for a course with no published lessons', () => {
    expect(progressPercent(0, 0)).toBe(0);
  });

  it('rounds down the completed lesson fraction as a whole percentage', () => {
    expect(progressPercent(3, 2)).toBe(66);
  });

  it('returns one hundred only when every lesson is complete', () => {
    expect(progressPercent(4, 4)).toBe(100);
  });
});
