/**
 * Normalized AI Provider Domain Errors
 * 
 * Maps vendor-specific errors (HTTP status codes, SDK exceptions, safety blocks)
 * into a standard set of Saouti domain errors.
 */

export abstract class AiError extends Error {
  abstract readonly code: string;
  abstract readonly isRetryable: boolean;

  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the user's API key is invalid, unauthorized, or revoked.
 */
export class InvalidApiKeyError extends AiError {
  readonly code = 'INVALID_API_KEY';
  readonly isRetryable = false;

  constructor(message = 'Invalid or inactive AI provider API key', originalError?: unknown) {
    super(message, originalError);
  }
}

/**
 * Thrown when provider rate limits or billing quota are exhausted (e.g. HTTP 429).
 */
export class QuotaExhaustedError extends AiError {
  readonly code = 'QUOTA_EXHAUSTED';
  readonly isRetryable: boolean;

  constructor(
    message = 'AI provider rate limit or quota exceeded',
    public readonly retryAfterSeconds?: number,
    originalError?: unknown,
    public readonly isDailyOrFreeTier: boolean = false,
  ) {
    super(message, originalError);
    this.isRetryable = !isDailyOrFreeTier;
  }
}

/**
 * Thrown when upstream content safety filters block prompt input or generated output.
 */
export class ContentSafetyBlockedError extends AiError {
  readonly code = 'CONTENT_SAFETY_BLOCKED';
  readonly isRetryable = false;

  constructor(
    message = 'Generation blocked by provider content safety filters',
    public readonly safetyCategory?: string,
    originalError?: unknown,
  ) {
    super(message, originalError);
  }
}

/**
 * Thrown on upstream service outages or gateway errors (HTTP 500, 502, 503, 504).
 */
export class ProviderUnavailableError extends AiError {
  readonly code = 'PROVIDER_UNAVAILABLE';
  readonly isRetryable = true;

  constructor(
    message = 'AI provider service is temporarily unavailable',
    originalError?: unknown,
  ) {
    super(message, originalError);
  }
}

/**
 * Thrown when an AI generation call exceeds timeout limits.
 */
export class RequestTimeoutError extends AiError {
  readonly code = 'REQUEST_TIMEOUT';
  readonly isRetryable = true;

  constructor(
    message = 'AI generation request timed out',
    originalError?: unknown,
  ) {
    super(message, originalError);
  }
}

/**
 * Thrown when the configured provider key does not support a requested capability
 * (e.g. image generation not enabled on free Gemini tier).
 */
export class AiUnsupportedCapabilityError extends AiError {
  readonly code = 'UNSUPPORTED_CAPABILITY';
  readonly isRetryable = false;

  constructor(
    message = 'Configured AI provider key does not support direct image generation',
    public readonly capability: string = 'image_generation',
    originalError?: unknown,
  ) {
    super(message, originalError);
  }
}

/**
 * Alias for ContentSafetyBlockedError for image generation safety filtering.
 */
export class AiSafetyBlockError extends ContentSafetyBlockedError {}

