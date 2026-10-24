import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto/key-encryption';
import { logger } from '@/lib/logger';

export type KeyProvider = 'gemini' | 'tavily';

export interface KeyMetadata {
  hasKey: boolean;
  provider: KeyProvider;
  lastFour: string | null;
  status: string | null;
  lastValidatedAt: Date | null;
  createdAt: Date | null;
}

/**
 * Retrieves and decrypts the API key for a specified user and provider.
 * Returns null if no active key exists.
 */
export async function getDecryptedKey(
  userId: string,
  provider: KeyProvider,
): Promise<string | null> {
  try {
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

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    if (record.status === 'invalid') {
      return null;
    }

    return decryptApiKey({
      encryptedKey: record.encryptedKey,
      nonce: record.nonce,
      authTag: record.authTag,
    });
  } catch (err) {
    logger.error({ err, userId, provider }, 'Failed to decrypt API key');
    return null;
  }
}

/**
 * Returns key configuration metadata without decrypting or exposing the secret.
 */
export async function getKeyMetadata(
  userId: string,
  provider: KeyProvider,
): Promise<KeyMetadata> {
  const records = await db
    .select({
      lastFour: apiKeys.lastFour,
      status: apiKeys.status,
      lastValidatedAt: apiKeys.lastValidatedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
    .limit(1);

  if (records.length === 0) {
    return {
      hasKey: false,
      provider,
      lastFour: null,
      status: null,
      lastValidatedAt: null,
      createdAt: null,
    };
  }

  const record = records[0];
  return {
    hasKey: true,
    provider,
    lastFour: record.lastFour,
    status: record.status,
    lastValidatedAt: record.lastValidatedAt,
    createdAt: record.createdAt,
  };
}

/**
 * Encrypts and saves or updates an API key for the user and provider.
 */
export async function saveEncryptedKey(
  userId: string,
  provider: KeyProvider,
  rawKey: string,
): Promise<{ lastFour: string }> {
  const encrypted = encryptApiKey(rawKey);

  await db
    .insert(apiKeys)
    .values({
      userId,
      provider,
      encryptedKey: encrypted.encryptedKey,
      nonce: encrypted.nonce,
      authTag: encrypted.authTag,
      lastFour: encrypted.lastFour,
      status: 'active',
      lastValidatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [apiKeys.userId, apiKeys.provider],
      set: {
        encryptedKey: encrypted.encryptedKey,
        nonce: encrypted.nonce,
        authTag: encrypted.authTag,
        lastFour: encrypted.lastFour,
        status: 'active',
        lastValidatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { lastFour: encrypted.lastFour };
}

/**
 * Deletes the configured key for a user and provider.
 */
export async function deleteKey(
  userId: string,
  provider: KeyProvider,
): Promise<boolean> {
  const result = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)));

  return (result.rowCount ?? 0) > 0;
}
