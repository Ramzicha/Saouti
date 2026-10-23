import { describe, it, expect, vi } from 'vitest';
import { calculateBackoffMs, withRetry } from '@/lib/ai/retry';
import { QuotaExhaustedError, InvalidApiKeyError } from '@/lib/ai/errors';

describe('Exponential Backoff & Rate Limit Retries (retry.ts)', () => {
  it('calculates exponential backoff with jitter bounded within policy', () => {
    // Attempt 1: base ~5000ms * 2^0 = ~5000ms ± 20% (4000ms - 6000ms)
    const backoff1 = calculateBackoffMs(1, { baseBackoffMs: 5000, jitterRatio: 0.2 });
    expect(backoff1).toBeGreaterThanOrEqual(4000);
    expect(backoff1).toBeLessThanOrEqual(6000);

    // Attempt 2: base ~5000ms * 2^1 = ~10000ms ± 20% (8000ms - 12000ms)
    const backoff2 = calculateBackoffMs(2, { baseBackoffMs: 5000, jitterRatio: 0.2 });
    expect(backoff2).toBeGreaterThanOrEqual(8000);
    expect(backoff2).toBeLessThanOrEqual(12000);
  });

  it('caps backoff wait time to maxWaitMs', () => {
    const capped = calculateBackoffMs(10, {
      baseBackoffMs: 5000,
      maxWaitMs: 30000,
    });
    expect(capped).toBeLessThanOrEqual(30000);
  });

  it('succeeds without retry on successful operation', async () => {
    const op = vi.fn().mockResolvedValue('success');
    const onRetry = vi.fn();

    const result = await withRetry(op, { onRetry });
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('retries on retryable QuotaExhaustedError and reports onRetry callbacks', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new QuotaExhaustedError('Rate limit exceeded'))
      .mockResolvedValue('recovered');

    const onRetry = vi.fn();

    const result = await withRetry(op, {
      maxRetries: 3,
      baseBackoffMs: 10, // Fast delay for unit tests
      maxWaitMs: 100,
      onRetry,
    });

    expect(result).toBe('recovered');
    expect(op).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        maxRetries: 3,
      }),
    );
  });

  it('does NOT retry non-retryable errors like InvalidApiKeyError', async () => {
    const op = vi
      .fn()
      .mockRejectedValue(new InvalidApiKeyError('Invalid API key'));

    const onRetry = vi.fn();

    await expect(withRetry(op, { onRetry })).rejects.toThrow(InvalidApiKeyError);
    expect(op).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('exhausts retry attempts and halts if 429 persists past maxRetries', async () => {
    const op = vi
      .fn()
      .mockRejectedValue(new QuotaExhaustedError('Sustained 429'));

    const onRetry = vi.fn();

    await expect(
      withRetry(op, {
        maxRetries: 3,
        baseBackoffMs: 10,
        maxWaitMs: 100,
        onRetry,
      }),
    ).rejects.toThrow(QuotaExhaustedError);

    expect(op).toHaveBeenCalledTimes(4); // initial + 3 retries
    expect(onRetry).toHaveBeenCalledTimes(3);
  });
});
