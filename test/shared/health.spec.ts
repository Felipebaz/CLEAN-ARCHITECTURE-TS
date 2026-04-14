import { describe, expect, it } from 'vitest';

import { checkHealth } from '../../src/shared/health';

describe('checkHealth', () => {
  it('should return ok', () => {
    expect(checkHealth()).toEqual({ status: 'ok', timestamp: expect.any(Date) });
  });
});