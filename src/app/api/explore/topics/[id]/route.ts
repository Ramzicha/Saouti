import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { TopicUpdateSchema } from '@/lib/explore/schemas';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/explore/topics/[id]
 * Updates topic phrase, pin status, or display order.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parseResult = TopicUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid update payload',
          },
        },
        { status: 400 },
      );
    }

    const updates: Partial<{
      phrase: string;
      reason: string;
      isPinned: boolean;
      orderIndex: number;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (parseResult.data.phrase !== undefined) {
      updates.phrase = parseResult.data.phrase;
    }
    if (parseResult.data.reason !== undefined) {
      updates.reason = parseResult.data.reason;
    }
    if (parseResult.data.isPinned !== undefined) {
      updates.isPinned = parseResult.data.isPinned;
    }
    if (parseResult.data.orderIndex !== undefined) {
      updates.orderIndex = parseResult.data.orderIndex;
    }

    const updated = await db
      .update(topics)
      .set(updates)
      .where(and(eq(topics.id, id), eq(topics.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Topic not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ topic: updated[0] });
  } catch (err) {
    logger.error({ err }, 'Error updating topic');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update topic' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/explore/topics/[id]
 * Permanently removes a topic.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const result = await db
      .delete(topics)
      .where(and(eq(topics.id, id), eq(topics.userId, user.id)));

    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Topic not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error deleting topic');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete topic' } },
      { status: 500 },
    );
  }
}
