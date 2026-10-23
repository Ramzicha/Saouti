import { db } from '@/lib/db/client';
import { usageCounters } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface RecordUsageParams {
  userId: string;
  provider?: string;
  isError?: boolean;
  isQuotaError?: boolean;
  tokens?: number;
}

/**
 * Returns today's UTC date in YYYY-MM-DD format.
 */
export function getUtcDateString(d = new Date()): string {
  return d.toISOString().split('T')[0];
}

/**
 * Records an AI provider invocation or error to the daily usage counter.
 */
export async function recordAiUsage({
  userId,
  provider = 'gemini',
  isError = false,
  isQuotaError = false,
  tokens = 0,
}: RecordUsageParams): Promise<void> {
  const date = getUtcDateString();

  try {
    const existing = await db
      .select({ id: usageCounters.id })
      .from(usageCounters)
      .where(
        and(
          eq(usageCounters.userId, userId),
          eq(usageCounters.provider, provider),
          eq(usageCounters.date, date),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(usageCounters)
        .set({
          requestCount: sql`${usageCounters.requestCount} + 1`,
          errorCount: isError
            ? sql`${usageCounters.errorCount} + 1`
            : usageCounters.errorCount,
          quotaErrorCount: isQuotaError
            ? sql`${usageCounters.quotaErrorCount} + 1`
            : usageCounters.quotaErrorCount,
          estimatedTokens: tokens > 0
            ? sql`${usageCounters.estimatedTokens} + ${tokens}`
            : usageCounters.estimatedTokens,
          updatedAt: new Date(),
        })
        .where(eq(usageCounters.id, existing[0].id));
    } else {
      await db.insert(usageCounters).values({
        userId,
        provider,
        date,
        requestCount: 1,
        errorCount: isError ? 1 : 0,
        quotaErrorCount: isQuotaError ? 1 : 0,
        estimatedTokens: tokens,
      });
    }
  } catch (err) {
    // Non-blocking telemetry error
    logger.warn({ err, userId }, 'Failed to increment AI usage counter');
  }
}

/**
 * Retrieves daily usage stats for the last 7 days.
 */
export async function getRecentUsageStats(
  userId: string,
  provider = 'gemini',
): Promise<Array<{ date: string; requestCount: number; errorCount: number; quotaErrorCount: number }>> {
  const stats = await db
    .select({
      date: usageCounters.date,
      requestCount: usageCounters.requestCount,
      errorCount: usageCounters.errorCount,
      quotaErrorCount: usageCounters.quotaErrorCount,
    })
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.userId, userId),
        eq(usageCounters.provider, provider),
      ),
    )
    .orderBy(sql`${usageCounters.date} DESC`)
    .limit(7);

  return stats;
}
