import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { exploreService } from '@/lib/explore/explore-service';
import { logger } from '@/lib/logger';

/**
 * POST /api/explore/refresh
 * Triggers a fresh search for a topic phrase and invokes the Researcher agent.
 */
export async function POST(request: Request) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const topicPhrase =
      typeof body.topicPhrase === 'string' ? body.topicPhrase.trim() : '';

    if (!topicPhrase) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Topic phrase is required' } },
        { status: 400 },
      );
    }

    const feed = await exploreService.refreshFeedForTopic(user.id, topicPhrase);

    return NextResponse.json(feed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to refresh feed';
    logger.error({ err }, 'Error refreshing explore feed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}
