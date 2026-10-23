import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { restoreFromTrash } from '@/lib/library/post-service';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/restore
 * Restores a soft-deleted post from the Trash bin back to active library.
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
    const success = await restoreFromTrash(user.id, id);

    if (!success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Post not found in trash' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: 'Post restored from trash' });
  } catch (err) {
    logger.error({ err }, 'Failed to restore post from trash');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to restore post' } },
      { status: 500 },
    );
  }
}
