import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * POST /api/onboarding/tavily-prompt/dismiss
 * Records that the authenticated user dismissed the one-time Tavily search onboarding prompt.
 */
export async function POST() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    await db
      .update(users)
      .set({
        hasDismissedTavilyPrompt: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error dismissing Tavily prompt');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to dismiss prompt' } },
      { status: 500 },
    );
  }
}
