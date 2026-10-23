import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { InvalidApiKeyError } from './errors';

/**
 * Validates that the user still has an active API key before executing any step in a multi-agent run.
 * Prevents orphan runs if the user deletes their key mid-run.
 */
export async function assertUserHasActiveKey(
  userId: string,
  provider = 'gemini',
): Promise<void> {
  const records = await db
    .select({
      id: apiKeys.id,
      status: apiKeys.status,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)))
    .limit(1);

  if (records.length === 0 || records[0].status === 'invalid') {
    throw new InvalidApiKeyError(
      'Generation stopped: API key was removed or revoked mid-run. Partial results have been saved.',
    );
  }
}
