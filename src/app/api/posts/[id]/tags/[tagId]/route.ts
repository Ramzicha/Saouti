import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { posts, postTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string; tagId: string }>;
}

/**
 * DELETE /api/posts/[id]/tags/[tagId]
 * Removes a tag association from a post.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id: postId, tagId } = await context.params;

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

    await db
      .delete(postTags)
      .where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagId)));

    return NextResponse.json({ success: true, message: 'Tag removed from post' });
  } catch (err) {
    logger.error({ err }, 'Failed to remove tag from post');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove tag' } },
      { status: 500 },
    );
  }
}
