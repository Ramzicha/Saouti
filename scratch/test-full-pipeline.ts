import { db } from '../src/lib/db/client';
import { runs, users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { saoutiQueue } from '../src/lib/queue/client';

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, 'ramzi@saouti.local')).limit(1);
  if (!user) throw new Error('User not found');

  console.log('Creating test run for user:', user.id);
  const [newRun] = await db.insert(runs).values({
    userId: user.id,
    topicBrief: 'Hello from 3D printing workshop! Just calibrated my printer with PETG.',
    selectedPlatforms: ['linkedin', 'x'],
    targetLanguage: 'en',
    arabicDialect: 'none',
    skipCritic: false,
    status: 'pending',
  }).returning();

  console.log('Inserted run record:', newRun.id);

  // Queue BullMQ job
  const job = await saoutiQueue.add(
    'generate-post-run',
    {
      runId: newRun.id,
      userId: user.id,
      topicBrief: newRun.topicBrief,
      selectedPlatforms: newRun.selectedPlatforms,
      targetLanguage: newRun.targetLanguage,
      arabicDialect: newRun.arabicDialect,
      skipCritic: newRun.skipCritic,
    },
    {
      jobId: `run-${newRun.id}`,
    }
  );

  console.log('Enqueued job:', job.id);
  console.log('Waiting for worker to complete run...');

  // Poll DB for run status for up to 60 seconds
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const [updated] = await db.select().from(runs).where(eq(runs.id, newRun.id));
    console.log(`[${i * 2}s] Run status:`, updated?.status);
    if (updated?.status === 'completed') {
      console.log('SUCCESS! Run completed.');
      console.log('Generated posts count:', (updated.posts as any[])?.length);
      console.log('Sample post text:', (updated.posts as any[])?.[0]?.text?.substring(0, 100));
      process.exit(0);
    }
    if (updated?.status === 'failed') {
      console.error('FAILED! Error message:', updated.errorMessage);
      process.exit(1);
    }
  }

  console.error('Timed out waiting for run to complete');
  process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
