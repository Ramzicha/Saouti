import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const WORKER_HEARTBEAT_KEY = 'saouti:worker:heartbeat';

export const workerRedisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
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
