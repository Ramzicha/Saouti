import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { savedArticles } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

describe('Saved Articles Integration & Database Scoping (saved-articles.test.ts)', () => {
  it('enforces userId scoping and topic filtering on saved articles query', () => {
    const userId = crypto.randomUUID();
    const topic = 'Artificial Intelligence';

    const query = db
      .select()
      .from(savedArticles)
      .where(and(eq(savedArticles.userId, userId), eq(savedArticles.topicPhrase, topic)))
      .orderBy(desc(savedArticles.createdAt))
      .toSQL();

    expect(query.sql).toContain('"saved_articles"."user_id" = $1');
    expect(query.sql).toContain('"saved_articles"."topic_phrase" = $2');
    expect(query.sql.toLowerCase()).toContain('order by "saved_articles"."created_at" desc');
    expect(query.params).toEqual([userId, topic]);
  });

  it('generates update query with userId scoping for private notes', () => {
    const userId = crypto.randomUUID();
    const articleId = crypto.randomUUID();
    const note = 'Interesting perspective on latency.';

    const query = db
      .update(savedArticles)
      .set({
        privateNote: note,
        updatedAt: new Date(),
      })
      .where(and(eq(savedArticles.id, articleId), eq(savedArticles.userId, userId)))
      .toSQL();

    expect(query.sql.toLowerCase()).toContain('update "saved_articles"');
    expect(query.sql).toContain('"private_note"');
    expect(query.sql).toContain('"user_id"');
    expect(query.params).toContain(userId);
    expect(query.params).toContain(articleId);
    expect(query.params).toContain(note);
  });

  it('generates delete query scoped strictly to user', () => {
    const userId = crypto.randomUUID();
    const articleId = crypto.randomUUID();

    const query = db
      .delete(savedArticles)
      .where(and(eq(savedArticles.id, articleId), eq(savedArticles.userId, userId)))
      .toSQL();

    expect(query.sql.toLowerCase()).toContain('delete from "saved_articles"');
    expect(query.sql).toContain('"user_id" = $2');
    expect(query.params).toEqual([articleId, userId]);
  });
});
