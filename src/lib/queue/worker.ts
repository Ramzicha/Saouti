import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const WORKER_HEARTBEAT_KEY = 'saouti:worker:heartbeat';

export const workerRedisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

workerRedisConnection.on('error', (err: unknown) => {
  if (config.NODE_ENV !== 'test') {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err: message }, 'Worker Redis connection event');
  }
});

export async function recordHeartbeat(): Promise<void> {
  const timestamp = new Date().toISOString();
  await workerRedisConnection.set(WORKER_HEARTBEAT_KEY, timestamp);
}

export function createWorker(): Worker {
  const worker = new Worker(
    'saouti',
    async (job: Job) => {
      if (job.name === 'health-check') {
        await recordHeartbeat();
        return { status: 'ok', timestamp: new Date().toISOString() };
      }
      if (job.name === 'generate-post-run') {
        const { processRunGenerationJob } = await import('@/worker/processors/agent-engine');
        await processRunGenerationJob(job);
        return { status: 'completed' };
      }
      if (job.name === 'search-refresh') {
        const { exploreService } = await import('@/lib/explore/explore-service');
        const { userId, topic } = job.data;
        await exploreService.refreshFeedForTopic(userId, topic);
        return { status: 'completed' };
      }
      return { status: 'unknown-job' };
    },
    {
      connection: workerRedisConnection,
    },
  );

  worker.on('active', (job: Job) => {
    logger.info(
      { jobId: job.id, jobName: job.name, requestId: getRequestId() },
      'BullMQ job active',
    );
  });

  worker.on('completed', (job: Job) => {
    logger.info(
      { jobId: job.id, jobName: job.name, requestId: getRequestId() },
      'BullMQ job completed',
    );
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    const isProd = config.NODE_ENV === 'production';
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        requestId: getRequestId(),
        errorName: err.name,
        errorMessage: err.message,
        ...(isProd ? {} : { stack: err.stack }),
      },
      'BullMQ job failed',
    );
  });

  return worker;
}
