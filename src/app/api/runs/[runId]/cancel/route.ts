import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { runs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { signalRunCancellation, publishRunEvent } from '@/lib/agent-engine/event-stream';
import { updateRunRecord } from '@/lib/agent-engine/audit';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ runId: string }>;
}

/**
 * POST /api/runs/[runId]/cancel
 * Signals abort cancellation to active run and halts downstream agent calls.
 */
export async function POST(_req: NextRequest, context: RouteContext) {
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
      .select({ id: runs.id, status: runs.status })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.userId, user.id)))
      .limit(1);

    if (!runRecord) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }

    if (['completed', 'cancelled', 'failed'].includes(runRecord.status)) {
      return NextResponse.json(
        { error: { code: 'ALREADY_CONCLUDED', message: `Run is already ${runRecord.status}` } },
        { status: 400 },
      );
    }

    // 1. Set Redis abort flag for worker state machine
    await signalRunCancellation(runId);

    // 2. Update run status in DB
    await updateRunRecord(runId, { status: 'cancelled' });

    // 3. Emit run.cancelled event to all connected clients
    await publishRunEvent(runId, {
      event: 'run.cancelled',
      runId,
      timestamp: new Date().toISOString(),
      reason: 'Cancelled by user request',
    });

    return NextResponse.json({
      success: true,
      runId,
      status: 'cancelled',
    });
  } catch (error) {
    logger.error({ error }, 'POST /api/runs/[runId]/cancel failed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel run' } },
      { status: 500 },
    );
  }
}
