import { db } from '@/lib/db/client';
import { savedArticles, type SavedArticle } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { normalizeCanonicalUrl } from '@/lib/search/url-normalizer';

export interface SaveArticleInput {
  canonicalUrl: string;
  title: string;
  sourceDomain: string;
  summary: string;
  publishedAt?: Date | string | null | undefined;
  topicPhrase?: string | null | undefined;
  privateNote?: string | null | undefined;
}

export interface ListSavedArticlesOptions {
  topicPhrase?: string | undefined;
}

/**
 * Lists bookmarked articles for the given user, optionally filtered by topic.
 */
export async function listSavedArticles(
  userId: string,
  options?: ListSavedArticlesOptions,
): Promise<SavedArticle[]> {
  const conditions = [eq(savedArticles.userId, userId)];

  if (options?.topicPhrase && options.topicPhrase.trim()) {
    conditions.push(eq(savedArticles.topicPhrase, options.topicPhrase.trim()));
  }

  return db
    .select()
    .from(savedArticles)
    .where(and(...conditions))
    .orderBy(desc(savedArticles.createdAt));
}

/**
 * Saves or updates a bookmarked article with private drafting notes and canonical URL deduplication.
 */
export async function saveArticle(
  userId: string,
  input: SaveArticleInput,
): Promise<SavedArticle> {
  const normalizedUrl = normalizeCanonicalUrl(input.canonicalUrl);

  const publishedDate = input.publishedAt
    ? typeof input.publishedAt === 'string'
      ? new Date(input.publishedAt)
      : input.publishedAt
    : null;

  const [saved] = await db
    .insert(savedArticles)
    .values({
      userId,
      canonicalUrl: normalizedUrl,
      title: input.title.trim(),
      sourceDomain: input.sourceDomain.trim(),
      summary: input.summary.trim(),
      publishedAt: publishedDate,
      topicPhrase: input.topicPhrase?.trim() || null,
      privateNote: input.privateNote?.trim() || null,
    })
    .onConflictDoUpdate({
      target: [savedArticles.userId, savedArticles.canonicalUrl],
      set: {
        title: input.title.trim(),
        summary: input.summary.trim(),
        topicPhrase: input.topicPhrase?.trim() || null,
        privateNote: input.privateNote !== undefined ? input.privateNote?.trim() || null : sql`${savedArticles.privateNote}`,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!saved) {
    throw new Error('Failed to save article');
  }

  return saved;
}

/**
 * Updates private note on a saved article.
 */
export async function updateSavedArticleNote(
  userId: string,
  id: string,
  privateNote: string | null,
): Promise<SavedArticle | null> {
  const [updated] = await db
    .update(savedArticles)
    .set({
      privateNote: privateNote?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(savedArticles.id, id), eq(savedArticles.userId, userId)))
    .returning();

  return updated || null;
}

/**
 * Removes a saved article by either ID or canonical URL.
 */
export async function removeSavedArticle(
  userId: string,
  idOrUrl: string,
): Promise<boolean> {
  const normalizedUrl = normalizeCanonicalUrl(idOrUrl);

  const result = await db
    .delete(savedArticles)
    .where(
      and(
        eq(savedArticles.userId, userId),
        sql`(${savedArticles.id} = ${idOrUrl} OR ${savedArticles.canonicalUrl} = ${normalizedUrl} OR ${savedArticles.canonicalUrl} = ${idOrUrl})`,
      ),
    )
    .returning({ id: savedArticles.id });

  return result.length > 0;
}

/**
 * Checks whether an article URL is currently bookmarked by the user.
 */
export async function isArticleSaved(
  userId: string,
  url: string,
): Promise<boolean> {
  const normalizedUrl = normalizeCanonicalUrl(url);

  const [existing] = await db
    .select({ id: savedArticles.id })
    .from(savedArticles)
    .where(
      and(
        eq(savedArticles.userId, userId),
        eq(savedArticles.canonicalUrl, normalizedUrl),
      ),
    )
    .limit(1);

  return Boolean(existing);
}
