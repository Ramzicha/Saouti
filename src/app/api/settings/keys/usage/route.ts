import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { getRecentUsageStats } from '@/lib/ai/usage';
import { logger } from '@/lib/logger';

/**
 * GET /api/settings/keys/usage
 * Returns daily usage stats (requests, errors, quota pauses) for the last 7 days.
 */
export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const stats = await getRecentUsageStats(user.id, 'gemini');

    return NextResponse.json({
      stats,
      provider: 'gemini',
    });
  } catch (err) {
    logger.error({ err }, 'Error retrieving AI usage stats');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve usage' } },
      { status: 500 },
    );
  }
}
