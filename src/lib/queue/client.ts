import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/lib/config';

import { logger } from '@/lib/logger';

export const redisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisConnection.on('error', (err: unknown) => {
  if (config.NODE_ENV !== 'test') {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err: message }, 'Redis queue connection event');
  }
});

export const saoutiQueue = new Queue('saouti', {
  connection: redisConnection,
});
