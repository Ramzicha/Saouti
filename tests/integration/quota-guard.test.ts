import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { searchUsageCounters } from '@/lib/db/schema';
import { QUEUE_PRIORITIES } from '@/lib/queue/client';
import { getDayPeriodKey } from '@/lib/explore/quota-guard';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

describe('Quota Guard Integration & Job Prioritization (quota-guard.test.ts)', () => {
  it('guarantees post generation jobs have strictly higher priority (1) than search refreshes (5)', () => {
    expect(QUEUE_PRIORITIES.POST_GENERATION).toBe(1);
    expect(QUEUE_PRIORITIES.SEARCH_REFRESH).toBe(5);
    expect(QUEUE_PRIORITIES.POST_GENERATION).toBeLessThan(QUEUE_PRIORITIES.SEARCH_REFRESH);
  });

  it('generates correct upsert SQL for search usage counters table', () => {
    const userId = crypto.randomUUID();
    const dayKey = getDayPeriodKey();

    const query = db
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
          updatedAt: new Date(),
        },
      })
      .toSQL();

    expect(query.sql.toLowerCase()).toContain('insert into "search_usage_counters"');
    expect(query.sql.toLowerCase()).toContain('on conflict');
    expect(query.params).toContain(userId);
    expect(query.params).toContain('all');
    expect(query.params).toContain('day');
    expect(query.params).toContain(dayKey);
  });

  it('guarantees search usage counters table has required columns defined', () => {
    expect(searchUsageCounters.userId).toBeDefined();
    expect(searchUsageCounters.provider).toBeDefined();
    expect(searchUsageCounters.periodType).toBeDefined();
    expect(searchUsageCounters.periodKey).toBeDefined();
    expect(searchUsageCounters.count).toBeDefined();
  });
});
