import { db } from '@/lib/db/client';
import { searchUsageCounters } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const DAILY_SEARCH_LIMIT = 15;
export const MONTHLY_CREDIT_GUARD_THRESHOLD = 800;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface QuotaStatus {
  dailyCount: number;
  dailyLimit: number;
  dailyRemaining: number;
  isDailyLimitReached: boolean;
  monthlyCreditsUsed: number;
  monthlyCreditThreshold: number;
  isMonthlyGuardTriggered: boolean;
  estimatedCreditsNextSearch: number;
  provider: 'tavily' | 'feed';
}

/**
 * Returns the current date in YYYY-MM-DD format.
 */
export function getDayPeriodKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the current month in YYYY-MM format.
 */
export function getMonthPeriodKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

/**
 * Retrieves the current quota and credit usage state for the user.
 */
export async function getQuotaStatus(
  userId: string,
  hasTavilyKey = false,
  now = new Date(),
): Promise<QuotaStatus> {
  const dayKey = getDayPeriodKey(now);
  const monthKey = getMonthPeriodKey(now);

  // 1. Fetch today's search count
  const [dailyRecord] = await db
    .select({ count: searchUsageCounters.count })
    .from(searchUsageCounters)
    .where(
      and(
        eq(searchUsageCounters.userId, userId),
        eq(searchUsageCounters.periodType, 'day'),
        eq(searchUsageCounters.periodKey, dayKey),
      ),
    )
    .limit(1);

  const dailyCount = dailyRecord?.count ?? 0;

  // 2. Fetch current month's Tavily credit expenditure
  const [monthlyRecord] = await db
    .select({ count: searchUsageCounters.count })
    .from(searchUsageCounters)
    .where(
      and(
        eq(searchUsageCounters.userId, userId),
        eq(searchUsageCounters.provider, 'tavily'),
        eq(searchUsageCounters.periodType, 'month'),
        eq(searchUsageCounters.periodKey, monthKey),
      ),
    )
    .limit(1);

  const monthlyCreditsUsed = monthlyRecord?.count ?? 0;

  const isDailyLimitReached = dailyCount >= DAILY_SEARCH_LIMIT;
  const isMonthlyGuardTriggered = monthlyCreditsUsed >= MONTHLY_CREDIT_GUARD_THRESHOLD;

  return {
    dailyCount,
    dailyLimit: DAILY_SEARCH_LIMIT,
    dailyRemaining: Math.max(0, DAILY_SEARCH_LIMIT - dailyCount),
    isDailyLimitReached,
    monthlyCreditsUsed,
    monthlyCreditThreshold: MONTHLY_CREDIT_GUARD_THRESHOLD,
    isMonthlyGuardTriggered,
    estimatedCreditsNextSearch: hasTavilyKey ? 1 : 0,
    provider: hasTavilyKey ? 'tavily' : 'feed',
  };
}

/**
 * Increments daily request counter and monthly Tavily credit usage.
 */
export async function recordSearchUsage(
  userId: string,
  provider: 'tavily' | 'feed',
  creditsUsed = 0,
  now = new Date(),
): Promise<void> {
  const dayKey = getDayPeriodKey(now);
  const monthKey = getMonthPeriodKey(now);

  // 1. Record daily search request count
  await db
    .insert(searchUsageCounters)
    .values({
      userId,
      provider: 'all',
      periodType: 'day',
      periodKey: dayKey,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [
        searchUsageCounters.userId,
        searchUsageCounters.provider,
        searchUsageCounters.periodType,
        searchUsageCounters.periodKey,
      ],
      set: {
        count: sql`${searchUsageCounters.count} + 1`,
        updatedAt: now,
      },
    });

  // 2. If credits were consumed (e.g. Tavily search), record monthly credits
  if (creditsUsed > 0 && provider === 'tavily') {
    await db
      .insert(searchUsageCounters)
      .values({
        userId,
        provider: 'tavily',
        periodType: 'month',
        periodKey: monthKey,
        count: creditsUsed,
      })
      .onConflictDoUpdate({
        target: [
          searchUsageCounters.userId,
          searchUsageCounters.provider,
          searchUsageCounters.periodType,
          searchUsageCounters.periodKey,
        ],
        set: {
          count: sql`${searchUsageCounters.count} + ${creditsUsed}`,
          updatedAt: now,
        },
      });
  }
}

/**
 * Checks whether an external search request is allowed given daily limits and monthly guards.
 */
export async function assertCanPerformSearch(
  userId: string,
  hasTavilyKey = false,
  forceRefresh = false,
): Promise<{ allowed: boolean; reason?: string | undefined }> {
  const status = await getQuotaStatus(userId, hasTavilyKey);

  if (status.isDailyLimitReached && !forceRefresh) {
    return {
      allowed: false,
      reason: `Daily search limit reached (${DAILY_SEARCH_LIMIT}/day). Use curated news feeds or try again tomorrow.`,
    };
  }

  return { allowed: true };
}
