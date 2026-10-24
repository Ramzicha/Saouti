import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { generateTopicsFromProfile } from '@/lib/agent-engine/agents/topic-planner';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * POST /api/explore/topics/generate
 * Invokes the Topic Planner agent to propose 5 to 8 topics from the user's Voice Profile.
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

    const result = await generateTopicsFromProfile(user.id);

    // Check if user currently has 0 topics; if so, populate with generated topics
    const existingTopics = await db
      .select({ id: topics.id })
      .from(topics)
      .where(eq(topics.userId, user.id))
      .limit(1);

    if (existingTopics.length === 0 && result.topics.length > 0) {
      const rows = result.topics.map((t, idx) => ({
        userId: user.id,
        phrase: t.phrase,
        reason: t.reason,
        isPinned: idx < 2, // pin first two by default
        orderIndex: idx,
      }));

      await db.insert(topics).values(rows).onConflictDoNothing();
    }

    return NextResponse.json({ topics: result.topics });
  } catch (err) {
    logger.error({ err }, 'Error generating topics from profile');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate topics' } },
      { status: 500 },
    );
  }
}
