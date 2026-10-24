import { generateUserStructured } from '@/lib/ai/service';
import { WriterOutputSchema, type WriterOutput } from '../schemas';
import { assembleAgentPrompt } from '../prompt-builder';
import { aiConfig } from '@/lib/ai/config';

import type { z } from 'zod';

export interface WriterStepInput {
  userId: string;
  profileSummary: string;
  samples?: string[] | undefined;
  platforms: string[];
  subreddits?: Array<{ name: string; rules?: string | undefined }> | undefined;
  brief: string;
  draftedPosts?: Array<{ platform: string; language: string; text: string; hashtags?: string[] | undefined }> | undefined;
  revisionNotes?: Array<{ exactPhrase: string; problem: string; suggestedFix: string }> | undefined;
  approvedFacts?: Array<{ factText: string; sourceCitation?: string | undefined; factCategory?: string | undefined }> | undefined;
  promptVersion?: string | undefined;
  signal?: AbortSignal | undefined;
}

export const WRITER_PROMPT_VERSION = 'v2';

/**
 * Executes the Writer agent turn to produce platform-native post drafts.
 */
export async function executeWriterStep(input: WriterStepInput): Promise<WriterOutput> {
  const prompt = assembleAgentPrompt({
    role: 'writer',
    profileSummary: input.profileSummary,
    samples: input.samples,
    platforms: input.platforms,
    subreddits: input.subreddits,
    brief: input.brief,
    draftedPosts: input.draftedPosts,
    revisionNotes: input.revisionNotes,
    approvedFacts: input.approvedFacts,
    promptVersion: input.promptVersion || WRITER_PROMPT_VERSION,
  });

  const result = await generateUserStructured<WriterOutput>(input.userId, prompt, {
    model: aiConfig.models.writer,
    schema: WriterOutputSchema as unknown as z.ZodType<WriterOutput>,
    schemaName: 'WriterOutput',
    schemaDescription: 'Multi-platform social media post drafts formatted for target networks.',
    signal: input.signal,
  });

  return result.data;
}
