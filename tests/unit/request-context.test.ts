import { describe, it, expect } from 'vitest';
import { getRequestId, runWithRequestId } from '@/lib/request-context';

describe('AsyncLocalStorage Request Context (request-context.ts)', () => {
  it('returns "no-request-id" outside of any execution context', () => {
    expect(getRequestId()).toBe('no-request-id');
  });

  it('provides the correct requestId within runWithRequestId', () => {
    const testId = 'req_123456';
    runWithRequestId(testId, () => {
      expect(getRequestId()).toBe(testId);
    });
    // Context is restored after execution
    expect(getRequestId()).toBe('no-request-id');
  });

  it('isolates request IDs across concurrent asynchronous operations', async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const taskA = runWithRequestId('id-alpha', async () => {
      await sleep(15);
      expect(getRequestId()).toBe('id-alpha');
      await sleep(15);
      expect(getRequestId()).toBe('id-alpha');
      return getRequestId();
    });

    const taskB = runWithRequestId('id-beta', async () => {
      await sleep(5);
      expect(getRequestId()).toBe('id-beta');
      await sleep(25);
      expect(getRequestId()).toBe('id-beta');
      return getRequestId();
    });

    const [resA, resB] = await Promise.all([taskA, taskB]);
    expect(resA).toBe('id-alpha');
    expect(resB).toBe('id-beta');
  });
});
