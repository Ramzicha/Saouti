import { AiError } from './errors';
import { aiConfig } from './config';

export interface RetryCallbackInfo {
  attempt: number;
  maxRetries: number;
  retryInSeconds: number;
  error: Error;
}

export interface RetryOptions {
  maxRetries?: number | undefined;
  baseBackoffMs?: number | undefined;
  maxWaitMs?: number | undefined;
  jitterRatio?: number | undefined;
  onRetry?: ((info: RetryCallbackInfo) => void) | undefined;
}

/**
 * Calculates exponential backoff with full jitter bounded by policy limits.
 *
 * Formula: backoff = min(maxWait, base * 2^(attempt - 1) * (1 ± jitter))
 */
export function calculateBackoffMs(
  attempt: number,
  options?: RetryOptions,
): number {
  const base = options?.baseBackoffMs ?? aiConfig.retryPolicy.baseBackoffMs;
  const maxWait =
    options?.maxWaitMs ?? aiConfig.retryPolicy.maxCumulativeWaitMs;
  const jitterRatio = options?.jitterRatio ?? 0.2;

  const exponent = Math.max(0, attempt - 1);
  const rawBackoff = base * Math.pow(2, exponent);

  // Apply jitter within [1 - jitterRatio, 1 + jitterRatio]
  const jitterFactor = 1 - jitterRatio + Math.random() * (jitterRatio * 2);
  const withJitter = rawBackoff * jitterFactor;

  return Math.min(maxWait, Math.round(withJitter));
}

/**
 * Wraps an asynchronous operation with retry logic for retryable AI errors (e.g. 429 quota exhaustion).
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? aiConfig.retryPolicy.maxRetries;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (err: unknown) {
      attempt++;

      // Check if error is retryable
      const isRetryable =
        err instanceof AiError
          ? err.isRetryable
          : err instanceof Error &&
            (err.message.includes('429') ||
              err.message.includes('RESOURCE_EXHAUSTED') ||
              err.message.includes('503'));

      if (!isRetryable || attempt > maxRetries) {
        throw err;
      }

      const waitMs = calculateBackoffMs(attempt, options);
      const retryInSeconds = Math.max(1, Math.round(waitMs / 1000));

      if (options?.onRetry) {
        options.onRetry({
          attempt,
          maxRetries,
          retryInSeconds,
          error: err as Error,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}
