import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { runs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { formatChatTitle } from '@/lib/agent-engine/chat-title';


interface RouteContext {
  params: Promise<{ runId: string }>;
}

/**
 * GET /api/runs/[runId]
 * Returns full run details, status, and generated multi-platform posts.
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

    const { runId } = await context.params;

    const [runRecord] = await db
      .select()
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.userId, user.id)))
      .limit(1);

    if (!runRecord) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: runRecord.id,
      chatId: runRecord.chatId || runRecord.id,
      title: formatChatTitle(runRecord.topicBrief, runRecord.sourceArticle, runRecord.posts),
      status: runRecord.status,

      topicBrief: runRecord.topicBrief,
      sourceArticle: runRecord.sourceArticle,
      selectedPlatforms: runRecord.selectedPlatforms,
      targetLanguage: runRecord.targetLanguage,
      skipCritic: runRecord.skipCritic,
      posts: runRecord.posts || [],
      totalDurationMs: runRecord.totalDurationMs ?? 0,
      errorMessage: runRecord.errorMessage || undefined,
      createdAt: runRecord.createdAt.toISOString(),
      updatedAt: runRecord.updatedAt.toISOString(),
    });

  } catch (error) {
    logger.error({ error }, 'GET /api/runs/[runId] failed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve run details' } },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/runs/[runId]
 * Updates run post content (e.g. following user inline edits).
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { runId } = await context.params;
    const body = await req.json().catch(() => ({}));

    if (!Array.isArray(body.posts)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Posts array is required' } },
        { status: 400 },
      );
    }

    const [updatedRun] = await db
      .update(runs)
      .set({
        posts: body.posts,
        updatedAt: new Date(),
      })
      .where(and(eq(runs.id, runId), eq(runs.userId, user.id)))
      .returning();

    if (!updatedRun) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: updatedRun.id,
      posts: updatedRun.posts || [],
      status: updatedRun.status,
    });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/runs/[runId] failed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update run posts' } },
      { status: 500 },
    );
  }
}
