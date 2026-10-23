import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { getPostVersions } from '@/lib/library/post-service';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]/versions
 * Lists up to 20 recorded historical versions for a post.
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
    const versions = await getPostVersions(user.id, id);

    return NextResponse.json({ versions });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch post versions');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve versions' } },
      { status: 500 },
    );
  }
}
