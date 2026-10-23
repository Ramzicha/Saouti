import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { runs } from '@/lib/db/schema';
import { saoutiQueue } from '@/lib/queue/client';
import { CreateRunRequestSchema } from '@/lib/agent-engine/schemas';
import { logger } from '@/lib/logger';

/**
 * POST /api/runs
 * Creates a new multi-platform post generation run and queues pipeline execution.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = CreateRunRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid run generation parameters',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { topicBrief, selectedPlatforms, targetLanguage, arabicDialect, skipCritic } =
      parseResult.data;

    // 1. Persist pending run record
    const [insertedRun] = await db
      .insert(runs)
      .values({
        userId: user.id,
        topicBrief,
        selectedPlatforms,
        targetLanguage,
        arabicDialect,
        skipCritic,
        status: 'pending',
      })
      .returning({ id: runs.id });

    if (!insertedRun) {
      throw new Error('Failed to create run record');
    }

    const runId = insertedRun.id;

    // 2. Dispatch background generation job to BullMQ
    try {
      await saoutiQueue.add(
        'generate-post-run',
        {
          runId,
          userId: user.id,
          topicBrief,
          selectedPlatforms,
          targetLanguage,
          arabicDialect,
          skipCritic,
        },
        {
          jobId: `run-${runId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (queueError) {
      logger.warn(
        { queueError, runId },
        'Could not queue BullMQ job (Redis may be offline); run remains pending',
      );
    }

    return NextResponse.json(
      {
        runId,
        status: 'pending',
        eventsUrl: `/api/runs/${runId}/events`,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, 'POST /api/runs failed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create generation run' } },
      { status: 500 },
    );
  }
}
