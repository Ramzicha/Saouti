import type { Job } from 'bullmq';
import { executeAgentPipeline } from '@/lib/agent-engine/orchestrator';
import { logger } from '@/lib/logger';

export interface RunGenerationJobData {
  runId: string;
  userId: string;
  topicBrief: string;
  selectedPlatforms: Array<'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook'>;
  targetLanguage?: string | undefined;
  arabicDialect?: string | undefined;
  skipCritic?: boolean | undefined;
  sourceArticle?: { title: string; sourceDomain: string; url: string; summary: string } | undefined;
}

/**
 * BullMQ Job Processor for multi-agent post generation runs.
 */
export async function processRunGenerationJob(job: Job<RunGenerationJobData>): Promise<void> {
  const { runId, userId, topicBrief, selectedPlatforms, targetLanguage, arabicDialect, skipCritic, sourceArticle } = job.data;

  logger.info({ runId, userId, jobName: job.name }, 'Processing post generation run in worker');

  await executeAgentPipeline({
    runId,
    userId,
    topicBrief,
    selectedPlatforms,
    targetLanguage,
    arabicDialect,
    skipCritic,
    sourceArticle,
  });
}
