import { eq, and, desc, sql, ilike, or, isNull, isNotNull, inArray, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { posts, postVersions, tags, postTags, type Post, type PostVersion } from '@/lib/db/schema';
import { encodeCursor, decodeCursor } from '@/lib/db/cursor-pagination';
import { normalizeArabicText } from '@/lib/search/arabic-normalizer';

export interface GeneratedPost {
  platform: 'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook';
  language?: string | undefined;
  text: string;
  hashtags?: string[] | undefined;
  imagePrompt?: string | undefined;
  imageAltText?: string | undefined;
  imageAspectRatio?: string | undefined;
}

const MAX_VERSIONS_PER_POST = 20;

export interface AutoSavePostInput {
  userId: string;
  runId: string;
  posts: GeneratedPost[];
}

export interface ListPostsOptions {
  userId: string;
  platform?: 'linkedin' | 'x' | 'reddit' | 'instagram' | 'facebook' | undefined;
  status?: 'draft' | 'ready' | 'posted' | undefined;
  savedOnly?: boolean | undefined;
  tag?: string | undefined;
  search?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  isTrash?: boolean | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface PostWithTags extends Post {
  tags: Array<{ id: string; name: string; color: string }>;
  versionCount: number;
}

/**
 * Automatically persists generated posts to the user library with status 'draft'
 * and creates initial Version 1 snapshot records.
 */
export async function autoSaveRunPosts({
  userId,
  runId,
  posts: generatedPosts,
}: AutoSavePostInput): Promise<Post[]> {
  if (!generatedPosts.length) return [];

  const createdPosts: Post[] = [];

  for (const gen of generatedPosts) {
    const [newPost] = await db
      .insert(posts)
      .values({
        userId,
        runId,
        platform: gen.platform,
        language: gen.language || 'en',
        status: 'draft',
        content: gen.text,
        hashtags: gen.hashtags || [],
        imagePrompt: gen.imagePrompt || null,
        imageAltText: gen.imageAltText || null,
        imageAspectRatio: gen.imageAspectRatio || null,
      })
      .returning();

    if (newPost) {
      createdPosts.push(newPost);

      // Create initial Version 1 snapshot
      await db.insert(postVersions).values({
        postId: newPost.id,
        versionNumber: 1,
        content: newPost.content,
        hashtags: newPost.hashtags,
        imagePrompt: newPost.imagePrompt,
        changeSummary: 'Initial generation from run',
      });
    }
  }

  return createdPosts;
}

export interface CreatePostInput {
  runId?: string | undefined;
  platform: 'linkedin' | 'x' | 'reddit' | 'instagram' | 'facebook';
  language?: string | undefined;
  content: string;
  hashtags?: string[] | undefined;
  imagePrompt?: string | undefined;
  imageAltText?: string | undefined;
  imageAspectRatio?: string | undefined;
  status?: 'draft' | 'ready' | 'posted' | undefined;
}

/**
 * Creates a post in the library or promotes an existing run draft to 'ready'.
 */
export async function createOrPromotePost(
  userId: string,
  input: CreatePostInput,
): Promise<PostWithTags> {
  const targetStatus = input.status || 'ready';

  // If runId is provided, check if a post already exists for this run and platform
  if (input.runId) {
    const [existing] = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          eq(posts.runId, input.runId),
          eq(posts.platform, input.platform),
          isNull(posts.deletedAt),
        ),
      )
      .limit(1);

    if (existing) {
      const updated = await updatePost(userId, existing.id, {
        content: input.content,
        hashtags: input.hashtags,
        imagePrompt: input.imagePrompt,
        imageAltText: input.imageAltText,
        imageAspectRatio: input.imageAspectRatio,
        status: targetStatus,
        changeSummary: 'Saved to library',
      });

      if (updated) return updated;
    }
  }

  // Otherwise, insert new post record
  const [newPost] = await db
    .insert(posts)
    .values({
      userId,
      runId: input.runId || null,
      platform: input.platform,
      language: input.language || 'en',
      status: targetStatus,
      content: input.content,
      hashtags: input.hashtags || [],
      imagePrompt: input.imagePrompt || null,
      imageAltText: input.imageAltText || null,
      imageAspectRatio: input.imageAspectRatio || null,
    })
    .returning();

  if (!newPost) {
    throw new Error('Failed to create post record');
  }

  // Create initial Version 1 snapshot
  await db.insert(postVersions).values({
    postId: newPost.id,
    versionNumber: 1,
    content: newPost.content,
    hashtags: newPost.hashtags,
    imagePrompt: newPost.imagePrompt,
    changeSummary: 'Saved to library',
  });

  const postWithTags = await getPostById(userId, newPost.id);
  return postWithTags!;
}

/**
 * Fetches a single post by ID scoped to the authenticated user.
 */
export async function getPostById(
  userId: string,
  postId: string,
): Promise<PostWithTags | null> {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1);

  if (!post) return null;

  // Fetch associated tags
  const associatedTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id));

  // Count versions
  const [versionRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postVersions)
    .where(eq(postVersions.postId, post.id));

  return {
    ...post,
    tags: associatedTags,
    versionCount: versionRow?.count || 1,
  };
}

/**
 * Updates post content, hashtags, imagePrompt and status, recording a new version
 * snapshot and pruning versions older than the 20 most recent.
 */
export async function updatePost(
  userId: string,
  postId: string,
  data: {
    content?: string | undefined;
    hashtags?: string[] | undefined;
    imagePrompt?: string | undefined;
    imageAltText?: string | undefined;
    imageAspectRatio?: string | undefined;
    status?: 'draft' | 'ready' | 'posted' | undefined;
    changeSummary?: string | undefined;
  },
): Promise<PostWithTags | null> {
  const existing = await getPostById(userId, postId);
  if (!existing) return null;

  const contentChanged =
    data.content !== undefined && data.content !== existing.content;

  // Determine latest version number
  const [latestVersion] = await db
    .select({ versionNumber: postVersions.versionNumber })
    .from(postVersions)
    .where(eq(postVersions.postId, postId))
    .orderBy(desc(postVersions.versionNumber))
    .limit(1);

  const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

  // Update post
  const [updated] = await db
    .update(posts)
    .set({
      content: data.content !== undefined ? data.content : existing.content,
      hashtags: data.hashtags !== undefined ? data.hashtags : existing.hashtags,
      imagePrompt:
        data.imagePrompt !== undefined ? data.imagePrompt : existing.imagePrompt,
      imageAltText:
        data.imageAltText !== undefined ? data.imageAltText : existing.imageAltText,
      imageAspectRatio:
        data.imageAspectRatio !== undefined ? data.imageAspectRatio : existing.imageAspectRatio,
      status: data.status !== undefined ? data.status : existing.status,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning();

  if (contentChanged && updated) {
    // Record new version snapshot
    await db.insert(postVersions).values({
      postId: updated.id,
      versionNumber: nextVersionNumber,
      content: updated.content,
      hashtags: updated.hashtags,
      imagePrompt: updated.imagePrompt,
      changeSummary: data.changeSummary || 'Post content edit',
    });

    // Prune versions beyond MAX_VERSIONS_PER_POST (20)
    await db.execute(sql`
      DELETE FROM post_versions 
      WHERE post_id = ${updated.id} 
        AND id NOT IN (
          SELECT id FROM post_versions 
          WHERE post_id = ${updated.id} 
          ORDER BY version_number DESC 
          LIMIT ${MAX_VERSIONS_PER_POST}
        )
    `);
  }

  return getPostById(userId, postId);
}

/**
 * Transitions post status to 'posted' with optional URL and date.
 */
export async function markAsPosted(
  userId: string,
  postId: string,
  data: {
    publishedUrl?: string | undefined;
    publishedAt?: string | undefined;
  },
): Promise<PostWithTags | null> {
  const [updated] = await db
    .update(posts)
    .set({
      status: 'posted',
      publishedUrl: data.publishedUrl || null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning();

  if (!updated) return null;
  return getPostById(userId, postId);
}

/**
 * Moves a post to the 30-day Trash bin (soft delete).
 */
export async function moveToTrash(
  userId: string,
  postId: string,
): Promise<boolean> {
  const result = await db
    .update(posts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}

/**
 * Restores a post from the Trash bin.
 */
export async function restoreFromTrash(
  userId: string,
  postId: string,
): Promise<boolean> {
  const result = await db
    .update(posts)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}

/**
 * Permanently removes a post from the database and cleans up stored image binaries.
 */
export async function permanentlyDeletePost(
  userId: string,
  postId: string,
): Promise<boolean> {
  // 1. Clean up attached image files from disk storage
  try {
    const { ImageService } = await import('@/lib/library/image-service');
    await ImageService.purgeAllPostImages(postId);
  } catch {
    // Continue even if storage files were already removed
  }

  // 2. Cascade delete database records
  const result = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}

/**
 * Fetches version history for a post (up to 20 chronological snapshots).
 */
export async function getPostVersions(
  userId: string,
  postId: string,
): Promise<PostVersion[]> {
  const post = await getPostById(userId, postId);
  if (!post) return [];

  return db
    .select()
    .from(postVersions)
    .where(eq(postVersions.postId, postId))
    .orderBy(desc(postVersions.versionNumber))
    .limit(MAX_VERSIONS_PER_POST);
}

/**
 * Restores a historical version to become the active post content.
 */
export async function restoreVersion(
  userId: string,
  postId: string,
  versionId: string,
): Promise<PostWithTags | null> {
  const post = await getPostById(userId, postId);
  if (!post) return null;

  const [version] = await db
    .select()
    .from(postVersions)
    .where(and(eq(postVersions.id, versionId), eq(postVersions.postId, postId)))
    .limit(1);

  if (!version) return null;

  return updatePost(userId, postId, {
    content: version.content,
    hashtags: version.hashtags,
    imagePrompt: version.imagePrompt || undefined,
    changeSummary: `Restored from version ${version.versionNumber}`,
  });
}

/**
 * Lists posts with combined filters, full-text search, and cursor-based keyset pagination.
 */
export async function listPosts(
  options: ListPostsOptions,
): Promise<{ posts: PostWithTags[]; nextCursor: string | null; hasMore: boolean }> {
  const {
    userId,
    platform,
    status,
    tag,
    search,
    dateFrom,
    dateTo,
    isTrash = false,
    cursor,
    limit = 20,
  } = options;

  const conditions = [eq(posts.userId, userId)];

  if (isTrash) {
    conditions.push(isNotNull(posts.deletedAt));
  } else {
    conditions.push(isNull(posts.deletedAt));
  }

  if (platform) {
    conditions.push(eq(posts.platform, platform));
  }

  if (status) {
    conditions.push(eq(posts.status, status));
  } else if (options.savedOnly) {
    conditions.push(inArray(posts.status, ['ready', 'posted']));
  }

  if (dateFrom) {
    conditions.push(sql`${posts.createdAt} >= ${new Date(dateFrom)}`);
  }

  if (dateTo) {
    conditions.push(sql`${posts.createdAt} <= ${new Date(dateTo)}`);
  }

  // Multilingual Full-Text Search with Arabic normalization
  if (search && search.trim()) {
    const rawSearch = search.trim();
    const normalizedArabic = normalizeArabicText(rawSearch);
    const searchPattern = `%${rawSearch}%`;
    const normalizedPattern = `%${normalizedArabic}%`;

    conditions.push(
      or(
        ilike(posts.content, searchPattern),
        ilike(posts.content, normalizedPattern),
        sql`posts.search_vector @@ websearch_to_tsquery('simple', ${normalizedArabic})`,
        sql`posts.search_vector @@ websearch_to_tsquery('english', ${rawSearch})`,
        sql`posts.search_vector @@ websearch_to_tsquery('french', ${rawSearch})`,
      )!,
    );
  }

  // Tag filter
  if (tag && tag.trim()) {
    const matchingTagPosts = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(and(eq(tags.userId, userId), eq(tags.name, tag.trim())));

    const postIds = matchingTagPosts.map((r) => r.postId);
    if (!postIds.length) {
      return { posts: [], nextCursor: null, hasMore: false };
    }
    conditions.push(inArray(posts.id, postIds));
  }

  // Keyset cursor pagination
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      conditions.push(
        or(
          lt(posts.createdAt, decoded.createdAt),
          and(eq(posts.createdAt, decoded.createdAt), lt(posts.id, decoded.id)),
        )!,
      );
    }
  }

  // Query with limit + 1 to detect hasMore
  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem.createdAt, lastItem.id);
  }

  // Batch load tags and version counts for selected posts
  const postIds = items.map((p) => p.id);
  const tagRows = postIds.length
    ? await db
        .select({
          postId: postTags.postId,
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(inArray(postTags.postId, postIds))
    : [];

  const tagsByPostId: Record<string, Array<{ id: string; name: string; color: string }>> = {};
  for (const row of tagRows) {
    if (!tagsByPostId[row.postId]) tagsByPostId[row.postId] = [];
    tagsByPostId[row.postId].push({ id: row.id, name: row.name, color: row.color });
  }

  const postsWithTags: PostWithTags[] = items.map((p) => ({
    ...p,
    tags: tagsByPostId[p.id] || [],
    versionCount: 1,
  }));

  return {
    posts: postsWithTags,
    nextCursor,
    hasMore,
  };
}
