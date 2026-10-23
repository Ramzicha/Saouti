import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { getPostById, updatePost, permanentlyDeletePost, moveToTrash } from '@/lib/library/post-service';
import { UpdatePostSchema } from '@/lib/validation/post-schemas';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]
 * Retrieves a single post with its associated tags.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const post = await getPostById(user.id, id);

    if (!post) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ post });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch post');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve post' } },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/posts/[id]
 * Updates post content, hashtags, image prompt or status, creating a new version.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const parseResult = UpdatePostSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid post update data',
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const updated = await updatePost(user.id, id, parseResult.data);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ post: updated });
  } catch (err) {
    logger.error({ err }, 'Failed to update post');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update post' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * Deletes post: soft-deletes to 30-day trash by default, or permanently if ?permanent=true.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const isPermanent = req.nextUrl.searchParams.get('permanent') === 'true';

    let success = false;
    if (isPermanent) {
      success = await permanentlyDeletePost(user.id, id);
    } else {
      success = await moveToTrash(user.id, id);
    }

    if (!success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      mode: isPermanent ? 'permanent' : 'trash',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to delete post');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete post' } },
      { status: 500 },
    );
  }
}
