import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { exploreService } from '@/lib/explore/explore-service';
import { logger } from '@/lib/logger';

/**
 * GET /api/explore/feed
 * Returns active cached articles for the user and requested topic.
 */
export async function GET(request: Request) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic') || undefined;

    const feed = await exploreService.getFeedArticles(user.id, topic);

    return NextResponse.json(feed);
  } catch (err) {
    logger.error({ err }, 'Error retrieving explore feed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve feed' } },
      { status: 500 },
    );
  }
}
