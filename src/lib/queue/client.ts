import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/lib/config';

export const redisConnection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const saoutiQueue = new Queue('saouti', {
  connection: redisConnection,
});
