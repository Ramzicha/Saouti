import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { posts, tags, postTags } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TagInputSchema } from '@/lib/validation/post-schemas';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_TAGS_PER_POST = 5;

/**
 * POST /api/posts/[id]/tags
 * Attaches a tag to a post (creates tag if not present, enforces max 5 tags).
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id: postId } = await context.params;

    // Verify post ownership
    const [post] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
      .limit(1);

    if (!post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    // Check current tag count on post
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postTags)
      .where(eq(postTags.postId, postId));

    if ((countRow?.count || 0) >= MAX_TAGS_PER_POST) {
      return NextResponse.json(
        {
          error: {
            code: 'TAG_LIMIT_EXCEEDED',
            message: `Maximum ${MAX_TAGS_PER_POST} tags allowed per post`,
          },
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parseResult = TagInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tag name',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    // Find or create tag
    let tagRecord: { id: string; name: string; color: string } | undefined;
    const [existing] = await db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(tags)
      .where(and(eq(tags.userId, user.id), eq(tags.name, parseResult.data.name)))
      .limit(1);

    if (existing) {
      tagRecord = existing;
    } else {
      const [created] = await db
        .insert(tags)
        .values({
          userId: user.id,
          name: parseResult.data.name,
          color: parseResult.data.color,
        })
        .returning({ id: tags.id, name: tags.name, color: tags.color });
      tagRecord = created;
    }

    if (!tagRecord) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to find or create tag' } },
        { status: 500 },
      );
    }

    // Attach to post
    await db
      .insert(postTags)
      .values({
        postId,
        tagId: tagRecord.id,
      })
      .onConflictDoNothing();

    return NextResponse.json({ tag: tagRecord }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Failed to associate tag with post');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to associate tag' } },
      { status: 500 },
    );
  }
}
