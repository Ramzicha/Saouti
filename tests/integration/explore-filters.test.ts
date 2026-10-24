import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { articles, articleDismissals } from '@/lib/db/schema';
import { eq, and, gt, notInArray } from 'drizzle-orm';
import crypto from 'crypto';

describe('Explore Dismissals & Feed Filters Integration (explore-filters.test.ts)', () => {
  it('excludes dismissed URLs and enforces freshness date bounds on feed SQL query', () => {
    const userId = crypto.randomUUID();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    const dismissedUrls = ['https://example.com/dismissed-article'];

    const query = db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          gt(articles.cachedUntil, now),
          gt(articles.publishedAt, oneDayAgo),
          notInArray(articles.canonicalUrl, dismissedUrls),
        ),
      )
      .toSQL();

    expect(query.sql).toContain('"articles"."user_id" = $1');
    expect(query.sql).toContain('"articles"."cached_until" > $2');
    expect(query.sql).toContain('"articles"."published_at" > $3');
    expect(query.sql).toContain('not in ($4)');
    expect(query.params).toEqual([
      userId,
      now.toISOString(),
      oneDayAgo.toISOString(),
      dismissedUrls[0],
    ]);
  });

  it('generates dismissal insert SQL with on conflict do nothing', () => {
    const userId = crypto.randomUUID();
    const url = 'https://techchronicle.example.com/not-interested';

    const query = db
      .insert(articleDismissals)
      .values({
        userId,
        canonicalUrl: url,
      })
      .onConflictDoNothing()
      .toSQL();

    expect(query.sql.toLowerCase()).toContain('insert into "article_dismissals"');
    expect(query.sql.toLowerCase()).toContain('on conflict do nothing');
    expect(query.params).toContain(userId);
    expect(query.params).toContain(url);
  });
});
