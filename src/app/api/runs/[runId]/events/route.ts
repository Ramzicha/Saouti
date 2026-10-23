import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { runs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { readRunEvents } from '@/lib/agent-engine/event-stream';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ runId: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/runs/[runId]/events
 * Server-Sent Events (SSE) route streaming real-time agent activities.
 * Supports Last-Event-ID recovery for transparent network reconnections.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { runId } = await context.params;

    // Verify run ownership (data isolation)
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

    let lastEventId =
      req.headers.get('last-event-id') ||
      req.nextUrl.searchParams.get('lastEventId') ||
      undefined;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        const onAbort = () => {
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Stream already closed
          }
        };

        req.signal.addEventListener('abort', onAbort);

        try {
          // Replay past events from Redis Stream
          const pastEvents = await readRunEvents(runId, lastEventId);
          for (const { id, event } of pastEvents) {
            if (isClosed) return;
            const message = `id: ${id}\nevent: ${event.event}\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(message));
            lastEventId = id;
          }

          // If the run is already terminal, close stream
          const terminalEvents = ['run.completed', 'run.cancelled', 'agent.error'];
          const hasTerminal = pastEvents.some((e) => terminalEvents.includes(e.event.event));

          if (hasTerminal) {
            controller.close();
            return;
          }

          // Poll for ongoing events while run is active
          const pollInterval = setInterval(async () => {
            if (isClosed) {
              clearInterval(pollInterval);
              return;
            }

            try {
              const newEvents = await readRunEvents(runId, lastEventId);
              for (const { id, event } of newEvents) {
                if (isClosed) {
                  clearInterval(pollInterval);
                  return;
                }
                const message = `id: ${id}\nevent: ${event.event}\ndata: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(message));
                lastEventId = id;

                if (terminalEvents.includes(event.event)) {
                  clearInterval(pollInterval);
                  controller.close();
                  return;
                }
              }
            } catch (pollError) {
              logger.warn({ pollError, runId }, 'Error polling Redis stream for SSE');
            }
          }, 500);

          // Cleanup interval if stream closes
          req.signal.addEventListener('abort', () => clearInterval(pollInterval));
        } catch (streamError) {
          logger.warn({ streamError, runId }, 'SSE stream initialization error');
          if (!isClosed) {
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform, no-store',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disables Nginx / reverse-proxy buffering
      },
    });
  } catch (error) {
    logger.error({ error }, 'GET /api/runs/[runId]/events failed');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to initialize event stream' } },
      { status: 500 },
    );
  }
}
