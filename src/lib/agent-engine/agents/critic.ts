import { generateUserStructured } from '@/lib/ai/service';
import {
  CriticOutputSchema,
  evaluateQualityThreshold,
  type CriticOutput,
  type CriticScores,
  type CriticIssue,
} from '../schemas';
import { assembleAgentPrompt } from '../prompt-builder';
import { aiConfig } from '@/lib/ai/config';

import type { z } from 'zod';

export interface CriticStepInput {
  userId: string;
  profileSummary: string;
  samples?: string[] | undefined;
  platforms: string[];
  brief: string;
  draftedPosts: Array<{ platform: string; language: string; text: string; hashtags?: string[] | undefined }>;
  signal?: AbortSignal | undefined;
}

export const CRITIC_PROMPT_VERSION = 'v1';

export interface EvaluatedCriticResult {
  overallVerdict: 'pass' | 'revise';
  evaluations: Array<{
    platform: 'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook';
    verdict: 'pass' | 'revise';
    scores: CriticScores;
    issues: CriticIssue[];
    statusText: string;
  }>;
}

/**
 * Executes the Critic agent turn to evaluate post authenticity, voice fit, and factual safety.
 */
export async function executeCriticStep(input: CriticStepInput): Promise<EvaluatedCriticResult> {
  const prompt = assembleAgentPrompt({
    role: 'critic',
    profileSummary: input.profileSummary,
    samples: input.samples,
    platforms: input.platforms,
    brief: input.brief,
    draftedPosts: input.draftedPosts,
    promptVersion: CRITIC_PROMPT_VERSION,
  });

  const result = await generateUserStructured<CriticOutput>(input.userId, prompt, {
    model: aiConfig.models.critic,
    schema: CriticOutputSchema as unknown as z.ZodType<CriticOutput>,
    schemaName: 'CriticOutput',
    schemaDescription: 'Rigorous 6-dimensional evaluation and quality verdict for drafted posts.',
    signal: input.signal,
  });

  let anyRevisionRequired = false;

  const adjustedEvaluations = result.data.evaluations.map((item) => {
    const quality = evaluateQualityThreshold(item.scores);
    const requiresRevision = !quality.meetsThreshold || item.verdict === 'revise';

    if (requiresRevision) {
      anyRevisionRequired = true;
    }

    return {
      ...item,
      verdict: (requiresRevision ? 'revise' : 'pass') as 'pass' | 'revise',
    };
  });

  return {
    overallVerdict: anyRevisionRequired ? 'revise' : 'pass',
    evaluations: adjustedEvaluations,
  };
}
