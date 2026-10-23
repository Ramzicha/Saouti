import { generateUserStructured } from '@/lib/ai/service';
import { ArtDirectorOutputSchema, type ArtDirectorOutput } from '../schemas';
import { assembleAgentPrompt } from '../prompt-builder';
import { aiConfig } from '@/lib/ai/config';

import type { z } from 'zod';

export interface ArtDirectorStepInput {
  userId: string;
  profileSummary: string;
  platforms: string[];
  brief: string;
  approvedPosts: Array<{ platform: string; language: string; text: string; hashtags?: string[] | undefined }>;
  signal?: AbortSignal | undefined;
}

export const ART_DIRECTOR_PROMPT_VERSION = 'v1';

/**
 * Executes the Art Director agent turn to create visual direction and alt text.
 */
export async function executeArtDirectorStep(
  input: ArtDirectorStepInput,
): Promise<ArtDirectorOutput> {
  const prompt = assembleAgentPrompt({
    role: 'art_director',
    profileSummary: input.profileSummary,
    platforms: input.platforms,
    brief: input.brief,
    draftedPosts: input.approvedPosts,
    promptVersion: ART_DIRECTOR_PROMPT_VERSION,
  });

  const result = await generateUserStructured<ArtDirectorOutput>(input.userId, prompt, {
    model: aiConfig.models.artDirector,
    schema: ArtDirectorOutputSchema as unknown as z.ZodType<ArtDirectorOutput>,
    schemaName: 'ArtDirectorOutput',
    schemaDescription: 'Visual concept image prompts, aspect ratios, and accessibility alt text.',
    signal: input.signal,
  });

  return result.data;
}
