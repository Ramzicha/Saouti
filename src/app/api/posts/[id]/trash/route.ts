import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { moveToTrash } from '@/lib/library/post-service';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/trash
 * Soft-deletes a post, moving it to the 30-day Trash bin.
 */
export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const success = await moveToTrash(user.id, id);

    if (!success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: 'Post moved to trash' });
  } catch (err) {
    logger.error({ err }, 'Failed to move post to trash');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to move post to trash' } },
      { status: 500 },
    );
  }
}
