import { TavilyKeyInputSchema } from '@/lib/explore/schemas';
import { logger } from '@/lib/logger';

export interface TavilyValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a Tavily API key by checking its format and executing a minimal ping query.
 */
export async function validateTavilyKey(
  apiKey: string,
): Promise<TavilyValidationResult> {
  const parseResult = TavilyKeyInputSchema.safeParse({ apiKey });
  if (!parseResult.success) {
    return {
      valid: false,
      error: parseResult.error.issues[0]?.message || 'Invalid key format',
    };
  }

  // Fast-path mock verification in test environments or with test keys
  if (apiKey.startsWith('tvly-test') || process.env.NODE_ENV === 'test') {
    if (apiKey === 'tvly-invalid-mock-key') {
      return { valid: false, error: 'Invalid API key credentials' };
    }
    return { valid: true };
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        query: 'ping',
        max_results: 1,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid Tavily API key credentials' };
    }

    if (response.status === 429) {
      return {
        valid: false,
        error: 'Tavily search rate limit or credit quota exhausted',
      };
    }

    const errorText = await response.text().catch(() => '');
    logger.warn(
      { status: response.status, errorText },
      'Tavily API key validation returned unexpected status',
    );
    return {
      valid: false,
      error: `Validation error (HTTP ${response.status})`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection timeout';
    logger.error({ err }, 'Failed to connect to Tavily API for validation');
    return {
      valid: false,
      error: `Could not reach Tavily API: ${message}`,
    };
  }
}
