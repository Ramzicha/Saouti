import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { runs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

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
      status: runRecord.status,
      topicBrief: runRecord.topicBrief,
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
