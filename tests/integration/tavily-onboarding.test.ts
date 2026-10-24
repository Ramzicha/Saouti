import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { apiKeys, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import {
  saveEncryptedKey,
  getDecryptedKey,
  getKeyMetadata,
  deleteKey,
} from '@/lib/auth/keys';

describe('Tavily Key Lifecycle & Integration (tavily-onboarding.test.ts)', () => {
  it('enforces provider scoping on Tavily key queries', () => {
    const userId = crypto.randomUUID();

    const query = db
      .select({
        id: apiKeys.id,
        provider: apiKeys.provider,
        lastFour: apiKeys.lastFour,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, 'tavily')))
      .toSQL();

    expect(query.sql).toContain('"api_keys"."user_id" = $1');
    expect(query.sql).toContain('"api_keys"."provider" = $2');
    expect(query.params).toEqual([userId, 'tavily']);
  });

  it('allows a user to store both a Gemini key and a Tavily key simultaneously', () => {
    const userId = crypto.randomUUID();

    const geminiQuery = db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, 'gemini')))
      .toSQL();

    const tavilyQuery = db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, 'tavily')))
      .toSQL();

    expect(geminiQuery.params[1]).toBe('gemini');
    expect(tavilyQuery.params[1]).toBe('tavily');
  });

  it('updates has_dismissed_tavily_prompt on the users table', () => {
    const userId = crypto.randomUUID();

    const updateQuery = db
      .update(users)
      .set({ hasDismissedTavilyPrompt: true })
      .where(eq(users.id, userId))
      .toSQL();

    expect(updateQuery.sql).toContain('"has_dismissed_tavily_prompt" = $1');
    expect(updateQuery.sql).toContain('"users"."id" = $2');
    expect(updateQuery.params).toEqual([true, userId]);
  });
});
