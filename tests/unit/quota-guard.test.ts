import { describe, it, expect, vi } from 'vitest';
import {
  getDayPeriodKey,
  getMonthPeriodKey,
  DAILY_SEARCH_LIMIT,
  MONTHLY_CREDIT_GUARD_THRESHOLD,
  getQuotaStatus,
  assertCanPerformSearch,
} from '@/lib/explore/quota-guard';
import { db } from '@/lib/db/client';
import crypto from 'crypto';

describe('Quota Guard & Caching Logic (quota-guard.test.ts)', () => {
  it('formats daily and monthly period keys correctly', () => {
    const fixedDate = new Date('2026-10-24T15:30:00Z');
    expect(getDayPeriodKey(fixedDate)).toBe('2026-10-24');
    expect(getMonthPeriodKey(fixedDate)).toBe('2026-10');
  });

  it('calculates daily remaining searches and credit estimates', async () => {
    const userId = crypto.randomUUID();

    // Mock db query returning 5 daily searches and 300 monthly credits
    vi.spyOn(db, 'select').mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count: 5 }]),
        }),
      }),
    } as any)).mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count: 300 }]),
        }),
      }),
    } as any));

    const status = await getQuotaStatus(userId, true);
    expect(status.dailyCount).toBe(5);
    expect(status.dailyLimit).toBe(DAILY_SEARCH_LIMIT);
    expect(status.dailyRemaining).toBe(10);
    expect(status.isDailyLimitReached).toBe(false);
    expect(status.monthlyCreditsUsed).toBe(300);
    expect(status.isMonthlyGuardTriggered).toBe(false);
    expect(status.estimatedCreditsNextSearch).toBe(1);
    expect(status.provider).toBe('tavily');
  });

  it('triggers monthly guard flag when Tavily credit usage >= 800', async () => {
    const userId = crypto.randomUUID();

    vi.spyOn(db, 'select').mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count: 8 }]),
        }),
      }),
    } as any)).mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count: 850 }]),
        }),
      }),
    } as any));

    const status = await getQuotaStatus(userId, true);
    expect(status.monthlyCreditsUsed).toBe(850);
    expect(status.isMonthlyGuardTriggered).toBe(true);
  });

  it('blocks search when daily limit of 15 is reached unless forced', async () => {
    const userId = crypto.randomUUID();

    // 15 searches used today
    vi.spyOn(db, 'select').mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count: 15 }]),
        }),
      }),
    } as any));

    const normalCheck = await assertCanPerformSearch(userId, true, false);
    expect(normalCheck.allowed).toBe(false);
    expect(normalCheck.reason).toContain('Daily search limit reached');

    const forcedCheck = await assertCanPerformSearch(userId, true, true);
    expect(forcedCheck.allowed).toBe(true);
  });
});
