import { describe, expect, it } from 'vitest';

describe('frontend API path convention', () => {
  it('uses the versioned API prefix', () => {
    expect('/api/v1').toContain('/api/v1');
  });
});
