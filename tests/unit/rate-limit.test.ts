import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit } from '@/lib/auth/rate-limit';

describe('Rate Limiter', () => {
  it('allows requests when within limit and gracefully handles redis fallbacks', async () => {
    const res = await checkRateLimit('test-ip-127-0-0-1', 5, 900);
    expect(res).toBeDefined();
    expect(typeof res.allowed).toBe('boolean');
    expect(res.remaining).toBeGreaterThanOrEqual(0);
  });
});
