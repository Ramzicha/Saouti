import type { Job } from 'bullmq';
import { executeAgentPipeline } from '@/lib/agent-engine/orchestrator';
import { logger } from '@/lib/logger';

export interface RunGenerationJobData {
  runId: string;
  userId: string;
  chatId?: string | undefined;
  topicBrief: string;
  selectedPlatforms: Array<'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook'>;
  targetLanguage?: string | undefined;
  arabicDialect?: string | undefined;
  skipCritic?: boolean | undefined;
  sourceArticle?: { title: string; sourceDomain: string; url: string; summary: string; content?: string | undefined } | undefined;
}

/**
 * BullMQ Job Processor for multi-agent post generation runs.
 */
export async function processRunGenerationJob(job: Job<RunGenerationJobData>): Promise<void> {
  const { runId, userId, chatId, topicBrief, selectedPlatforms, targetLanguage, arabicDialect, skipCritic, sourceArticle } = job.data;

  logger.info({ runId, userId, chatId, jobName: job.name }, 'Processing post generation run in worker');

  await executeAgentPipeline({
    runId,
    userId,
    chatId,
    topicBrief,
    selectedPlatforms,
    targetLanguage,
    arabicDialect,
    skipCritic,
    sourceArticle,
  });
}
