import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { TopicCreateSchema } from '@/lib/explore/schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/explore/topics
 * Returns all topics for the authenticated user, ordered by pinned first.
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

    const userTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.userId, user.id))
      .orderBy(desc(topics.isPinned), asc(topics.orderIndex), desc(topics.createdAt));

    return NextResponse.json({ topics: userTopics });
  } catch (err) {
    logger.error({ err }, 'Error retrieving topics');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve topics' } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/explore/topics
 * Adds a new custom topic for the authenticated user.
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
    const parseResult = TopicCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid topic payload',
          },
        },
        { status: 400 },
      );
    }

    const { phrase, reason, isPinned } = parseResult.data;

    const inserted = await db
      .insert(topics)
      .values({
        userId: user.id,
        phrase,
        reason: reason || 'Custom user topic',
        isPinned: isPinned || false,
      })
      .onConflictDoUpdate({
        target: [topics.userId, topics.phrase],
        set: {
          reason: reason || 'Custom user topic',
          isPinned: isPinned || false,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ topic: inserted[0] }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Error adding custom topic');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add topic' } },
      { status: 500 },
    );
  }
}
