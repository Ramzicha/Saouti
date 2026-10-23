import { describe, it, expect } from 'vitest';
import { normalizeGeminiError, GeminiAdapter } from '@/lib/ai/gemini';
import {
  InvalidApiKeyError,
  QuotaExhaustedError,
  ContentSafetyBlockedError,
  ProviderUnavailableError,
  RequestTimeoutError,
} from '@/lib/ai/errors';

describe('Gemini Error Normalization (gemini.ts)', () => {
  it('maps API key errors to InvalidApiKeyError', () => {
    const error = new Error('API_KEY_INVALID: API key not valid. Please pass a valid API key.');
    const normalized = normalizeGeminiError(error);

    expect(normalized).toBeInstanceOf(InvalidApiKeyError);
    expect(normalized.code).toBe('INVALID_API_KEY');
    expect(normalized.isRetryable).toBe(false);
  });

  it('maps 429 / RESOURCE_EXHAUSTED to QuotaExhaustedError', () => {
    const error = new Error('429 RESOURCE_EXHAUSTED: Quota exceeded for quota metric');
    const normalized = normalizeGeminiError(error);

    expect(normalized).toBeInstanceOf(QuotaExhaustedError);
    expect(normalized.code).toBe('QUOTA_EXHAUSTED');
    expect(normalized.isRetryable).toBe(true);
  });

  it('maps safety block errors to ContentSafetyBlockedError', () => {
    const error = new Error('Candidate blocked due to SAFETY: HARM_CATEGORY_HATE_SPEECH');
    const normalized = normalizeGeminiError(error);

    expect(normalized).toBeInstanceOf(ContentSafetyBlockedError);
    expect(normalized.code).toBe('CONTENT_SAFETY_BLOCKED');
    expect(normalized.isRetryable).toBe(false);
  });

  it('maps 503 / UNAVAILABLE to ProviderUnavailableError', () => {
    const error = new Error('503 Service Unavailable');
    const normalized = normalizeGeminiError(error);

    expect(normalized).toBeInstanceOf(ProviderUnavailableError);
    expect(normalized.code).toBe('PROVIDER_UNAVAILABLE');
    expect(normalized.isRetryable).toBe(true);
  });

  it('maps abort and timeout errors to RequestTimeoutError', () => {
    const error = new Error('The operation was aborted due to timeout');
    const normalized = normalizeGeminiError(error);

    expect(normalized).toBeInstanceOf(RequestTimeoutError);
    expect(normalized.code).toBe('REQUEST_TIMEOUT');
    expect(normalized.isRetryable).toBe(true);
  });

  it('throws InvalidApiKeyError if initialized without apiKey', () => {
    expect(() => new GeminiAdapter({ apiKey: '' })).toThrow(InvalidApiKeyError);
  });
});
