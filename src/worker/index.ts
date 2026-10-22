import { runMigrations } from '@/lib/db/migrate';
import { pool } from '@/lib/db/client';
import { saoutiQueue, redisConnection } from '@/lib/queue/client';
import { createWorker, recordHeartbeat, workerRedisConnection } from '@/lib/queue/worker';
import { logger } from '@/lib/logger';

async function startWorker() {
  logger.info('Worker starting: applying database migrations...');
  await runMigrations();

  logger.info('Recording initial worker heartbeat...');
  await recordHeartbeat();

  logger.info('Initializing BullMQ worker instance...');
  const worker = createWorker();

  // Enqueue repeating health-check job every 30 seconds
  await saoutiQueue.add(
    'health-check',
    {},
    {
      repeat: {
        every: 30000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  logger.info('Worker started successfully and listening for jobs.');

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, 'Worker shutting down gracefully...');

    try {
      await worker.close();
      await saoutiQueue.close();
      await redisConnection.quit();
      await workerRedisConnection.quit();
      await pool.end();
      logger.info('Worker resources closed. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during worker graceful shutdown.');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startWorker().catch((err) => {
  logger.error({ err }, 'Fatal error during worker startup.');
  process.exit(1);
});
