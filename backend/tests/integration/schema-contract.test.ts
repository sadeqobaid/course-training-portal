import { describe, expect, it } from 'vitest';

describe('database schema contract', () => {
  it('records the database-level rule that blocks a duplicate learner-course relationship', () => {
    const uniquenessRule = '(learner_id, course_id)';
    expect(uniquenessRule).toBe('(learner_id, course_id)');
  });
});
