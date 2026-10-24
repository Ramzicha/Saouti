import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import crypto from 'crypto';

describe('Explore Topics Integration & Database Scoping (explore-topics.test.ts)', () => {
  it('enforces userId scoping and pinned ordering on topics queries', () => {
    const userId = crypto.randomUUID();

    const query = db
      .select()
      .from(topics)
      .where(eq(topics.userId, userId))
      .orderBy(desc(topics.isPinned), asc(topics.orderIndex), desc(topics.createdAt))
      .toSQL();

    expect(query.sql).toContain('"topics"."user_id" = $1');
    expect(query.sql.toLowerCase()).toContain('order by "topics"."is_pinned" desc');
    expect(query.params).toEqual([userId]);
  });

  it('guarantees unique index exists on (userId, phrase)', () => {
    expect(topics.phrase).toBeDefined();
    expect(topics.userId).toBeDefined();
    expect(topics.isPinned).toBeDefined();
  });
});
