import { NextResponse, type NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { redisConnection } from '@/lib/queue/client';
import { WORKER_HEARTBEAT_KEY } from '@/lib/queue/worker';
import { logger } from '@/lib/logger';
import { runWithRequestId, getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timer),
  );
}

async function probeHealth() {
  const currentRequestId = getRequestId();
  const startTime = Date.now();

  let dbStatus: 'ok' | 'error' = 'ok';
  let dbLatency: number | null = null;
  let dbError: string | undefined;

  let queueStatus: 'ok' | 'error' = 'ok';
  let queueLatency: number | null = null;
  let queueError: string | undefined;

  let workerStatus: 'ok' | 'unknown' | 'error' = 'unknown';
  let workerLastHeartbeat: string | null = null;
  let workerError: string | undefined;

  // 1. Probe Database
  const dbStart = Date.now();
  try {
    await withTimeout(
      db.execute(sql`SELECT 1`),
      2000,
      'Database query timed out after 2000ms',
    );
    dbLatency = Date.now() - dbStart;
  } catch (err: unknown) {
    dbStatus = 'error';
    dbError = err instanceof Error ? err.message : 'Database probe failed';
  }

  // 2. Probe Queue (Redis)
  const queueStart = Date.now();
  try {
    await withTimeout(
      redisConnection.ping(),
      2000,
      'Redis ping timed out after 2000ms',
    );
    queueLatency = Date.now() - queueStart;
  } catch (err: unknown) {
    queueStatus = 'error';
    queueError = err instanceof Error ? err.message : 'Queue probe failed';
  }

  // 3. Probe Worker Heartbeat
  try {
    const heartbeatStr = await withTimeout(
      redisConnection.get(WORKER_HEARTBEAT_KEY),
      2000,
      'Worker heartbeat read timed out',
    );

    if (heartbeatStr) {
      workerLastHeartbeat = heartbeatStr;
      const heartbeatTime = new Date(heartbeatStr).getTime();
      const ageMs = Date.now() - heartbeatTime;
      // Heartbeat within last 60 seconds is considered healthy
      if (ageMs <= 60000) {
        workerStatus = 'ok';
      } else {
        workerStatus = 'unknown';
      }
    } else {
      workerStatus = 'unknown';
    }
  } catch (err: unknown) {
    workerStatus = 'error';
    workerError =
      err instanceof Error ? err.message : 'Failed to read worker heartbeat';
  }

  const isHealthy =
    dbStatus === 'ok' && queueStatus === 'ok' && workerStatus === 'ok';
  const overallStatus = isHealthy ? 'ok' : 'degraded';
  const statusCode = isHealthy ? 200 : 503;
  const totalDuration = Date.now() - startTime;

  logger.info(
    {
      requestId: currentRequestId,
      method: 'GET',
      path: '/health',
      statusCode,
      durationMs: totalDuration,
      status: overallStatus,
      services: {
        database: dbStatus,
        queue: queueStatus,
        worker: workerStatus,
      },
    },
    `Health check probed: ${overallStatus}`,
  );

  const responseBody = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        ...(dbError ? { error: dbError } : {}),
      },
      queue: {
        status: queueStatus,
        latencyMs: queueLatency,
        ...(queueError ? { error: queueError } : {}),
      },
      worker: {
        status: workerStatus,
        lastHeartbeatAt: workerLastHeartbeat,
        ...(workerError ? { error: workerError } : {}),
      },
    },
  };

  return NextResponse.json(responseBody, {
    status: statusCode,
    headers: {
      'x-request-id': currentRequestId,
      'x-response-time': `${totalDuration}ms`,
    },
  });
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  return runWithRequestId(requestId, () => probeHealth());
}
