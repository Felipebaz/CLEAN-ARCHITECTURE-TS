import { describe, expect, it } from 'vitest';

import { checkHealth } from '../../src/shared/health';

describe('checkHealth', () => {
  it('returns status ok', () => {
    const result = checkHealth();

    expect(result.status).toBe('ok');
  });

  it('uses the provided date as timestamp', () => {
    const now = new Date('2026-01-01T12:00:00.000Z');
    const result = checkHealth(now);

    expect(result.timestamp).toBe('2026-01-01T12:00:00.000Z');
  });

  it('returns uptimeSeconds as a non-negative integer', () => {
    const result = checkHealth();

    expect(Number.isInteger(result.uptimeSeconds)).toBe(true);
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
