import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptApiKey } from '@/lib/crypto/key-encryption';
import {
  AiProviderAdapter,
  GenerateTextOptions,
  GenerateStructuredOptions,
  GenerateImageOptions,
  TextGenerationResult,
  StructuredGenerationResult,
  ImageGenerationResult,
} from './provider';
import { GeminiAdapter } from './gemini';
import { FakeProviderAdapter } from './fake-adapter';
import { withRetry, RetryCallbackInfo } from './retry';
import { recordAiUsage } from './usage';
import { InvalidApiKeyError, QuotaExhaustedError } from './errors';

export interface ServiceExecutionOptions {
  onRetry?: ((info: RetryCallbackInfo) => void) | undefined;
}

/**
 * Resolves the authenticated user's active AI provider adapter with decrypted credentials.
 * Throws InvalidApiKeyError if no key exists or if key status is not active.
 */
export async function getUserAiAdapter(
  userId: string,
  provider = 'gemini',
): Promise<AiProviderAdapter> {
  const records = await db
    .select({
      encryptedKey: apiKeys.encryptedKey,
      nonce: apiKeys.nonce,
      authTag: apiKeys.authTag,
      status: apiKeys.status,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
    .limit(1);

  const keyRecord = records[0];
  if (!keyRecord || keyRecord.status === 'invalid') {
    throw new InvalidApiKeyError(
      'No valid AI provider API key found. Please add a key in Settings.',
    );
  }

  // Decrypt key inside server process memory
  const decryptedKey = decryptApiKey({
    encryptedKey: keyRecord.encryptedKey,
    nonce: keyRecord.nonce,
    authTag: keyRecord.authTag,
  });

  // If in test environment and using fake key, return FakeProviderAdapter
  if (
    decryptedKey.startsWith('fake_test_key_') ||
    process.env.NODE_ENV === 'test'
  ) {
    return new FakeProviderAdapter();
  }

  return new GeminiAdapter({ apiKey: decryptedKey });
}

/**
 * High-level helper: Generates text with automatic retry and usage tracking.
 */
export async function generateUserText(
  userId: string,
  prompt: string,
  options?: GenerateTextOptions & ServiceExecutionOptions,
): Promise<TextGenerationResult> {
  const adapter = await getUserAiAdapter(userId);

  return await withRetry(
    async () => {
      try {
        const result = await adapter.generateText(prompt, options);
        await recordAiUsage({
          userId,
          tokens: result.usage?.totalTokens ?? 0,
        });
        return result;
      } catch (err) {
        await recordAiUsage({
          userId,
          isError: true,
          isQuotaError: err instanceof QuotaExhaustedError,
        });
        throw err;
      }
    },
    options?.onRetry ? { onRetry: options.onRetry } : undefined,
  );
}

/**
 * High-level helper: Generates schema-validated structured data with automatic retry and usage tracking.
 */
export async function generateUserStructured<T>(
  userId: string,
  prompt: string,
  options: GenerateStructuredOptions<T> & ServiceExecutionOptions,
): Promise<StructuredGenerationResult<T>> {
  const adapter = await getUserAiAdapter(userId);

  return await withRetry(
    async () => {
      try {
        const result = await adapter.generateStructured(prompt, options);
        await recordAiUsage({
          userId,
          tokens: result.usage?.totalTokens ?? 0,
        });
        return result;
      } catch (err) {
        await recordAiUsage({
          userId,
          isError: true,
          isQuotaError: err instanceof QuotaExhaustedError,
        });
        throw err;
      }
    },
    options.onRetry ? { onRetry: options.onRetry } : undefined,
  );
}

/**
 * High-level helper: Generates image assets.
 */
export async function generateUserImage(
  userId: string,
  prompt: string,
  options?: GenerateImageOptions & ServiceExecutionOptions,
): Promise<ImageGenerationResult> {
  const adapter = await getUserAiAdapter(userId);

  return await withRetry(
    async () => {
      try {
        const result = await adapter.generateImage(prompt, options);
        await recordAiUsage({ userId });
        return result;
      } catch (err) {
        await recordAiUsage({
          userId,
          isError: true,
          isQuotaError: err instanceof QuotaExhaustedError,
        });
        throw err;
      }
    },
    options?.onRetry ? { onRetry: options.onRetry } : undefined,
  );
}
