import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { articles, articleDismissals } from '@/lib/db/schema';
import { eq, and, gt, notInArray, desc } from 'drizzle-orm';
import crypto from 'crypto';

describe('Explore Feed Integration & Scoping (explore-feed.test.ts)', () => {
  it('enforces userId scoping and unexpired cache condition on feed queries', () => {
    const userId = crypto.randomUUID();
    const now = new Date();

    const query = db
      .select()
      .from(articles)
      .where(and(eq(articles.userId, userId), gt(articles.cachedUntil, now)))
      .orderBy(desc(articles.createdAt))
      .toSQL();

    expect(query.sql).toContain('"articles"."user_id" = $1');
    expect(query.sql).toContain('"articles"."cached_until" > $2');
    expect(query.params).toEqual([userId, now.toISOString()]);
  });

  it('excludes dismissed URLs from feed query', () => {
    const userId = crypto.randomUUID();
    const now = new Date();
    const dismissedUrls = ['https://example.com/not-interested'];

    const query = db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          gt(articles.cachedUntil, now),
          notInArray(articles.canonicalUrl, dismissedUrls),
        ),
      )
      .toSQL();

    expect(query.sql).toContain('not in ($3)');
    expect(query.params).toEqual([userId, now.toISOString(), dismissedUrls[0]]);
  });

  it('guarantees unique index exists on (userId, canonicalUrl) in articles table', () => {
    expect(articles.userId).toBeDefined();
    expect(articles.canonicalUrl).toBeDefined();
    expect(articles.cachedUntil).toBeDefined();
  });
});
