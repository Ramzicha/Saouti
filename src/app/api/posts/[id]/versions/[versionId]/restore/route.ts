import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { restoreVersion } from '@/lib/library/post-service';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string; versionId: string }>;
}

/**
 * POST /api/posts/[id]/versions/[versionId]/restore
 * Restores a historical version to become the active post content.
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

    const { id, versionId } = await context.params;
    const restored = await restoreVersion(user.id, id, versionId);

    if (!restored) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Version or post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ post: restored });
  } catch (err) {
    logger.error({ err }, 'Failed to restore post version');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to restore version' } },
      { status: 500 },
    );
  }
}
