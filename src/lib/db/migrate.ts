import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { db, pool } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const ADVISORY_LOCK_ID = 12345;

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info('Acquiring PostgreSQL advisory lock for migrations...');
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);
    logger.info('Advisory lock acquired. Executing migrations...');

    const migrationsFolder = path.resolve(process.cwd(), 'src/lib/db/migrations');
    await migrate(db, { migrationsFolder });

    logger.info('Database migrations applied successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Failed to apply database migrations.');
    process.exit(1);
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]);
      logger.info('PostgreSQL advisory lock released.');
    } catch (unlockError) {
      logger.error({ err: unlockError }, 'Failed to release advisory lock.');
    } finally {
      client.release();
    }
  }
}

// Allow direct execution via CLI / tsx
if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      logger.info('Migration process completed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Unhandled migration process error.');
      process.exit(1);
    });
}
