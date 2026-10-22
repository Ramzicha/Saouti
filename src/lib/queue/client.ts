import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/lib/config';

import { logger } from '@/lib/logger';

export const redisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisConnection.on('error', (err: any) => {
  if (config.NODE_ENV !== 'test') {
    logger.warn({ err: err.message }, 'Redis queue connection event');
  }
});

export const saoutiQueue = new Queue('saouti', {
  connection: redisConnection,
});
