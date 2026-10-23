import { z } from 'zod';

/**
 * Request validation schema for creating a new post generation run.
 */
export const CreateRunRequestSchema = z.object({
  topicBrief: z
    .string()
    .trim()
    .min(1, 'Topic brief cannot be empty')
    .max(2000, 'Topic brief must not exceed 2000 characters'),
  selectedPlatforms: z
    .array(z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']))
    .min(1, 'Select at least one platform'),
  targetLanguage: z.enum(['en', 'fr', 'ar']).default('en'),
  arabicDialect: z.enum(['none', 'msa', 'darija', 'both']).default('none'),
  skipCritic: z.boolean().default(false),
});

export type CreateRunRequestInput = z.infer<typeof CreateRunRequestSchema>;

/**
 * Writer Agent Output Schemas
 */
export const WriterPostItemSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  language: z.string(),
  text: z.string().min(1, 'Generated post text cannot be empty'),
  hashtags: z.array(z.string()).default([]),
});

export const WriterOutputSchema = z.object({
  posts: z.array(WriterPostItemSchema).min(1, 'At least one post must be drafted'),
});

export type WriterPostItem = z.infer<typeof WriterPostItemSchema>;
export type WriterOutput = z.infer<typeof WriterOutputSchema>;

/**
 * Critic Agent Output Schemas
 */
export const CriticScoreSchema = z.object({
  voiceMatch: z.number().min(1).max(5),
  principleCompliance: z.number().min(1).max(5),
  audienceFit: z.number().min(1).max(5),
  platformFit: z.number().min(1).max(5),
  specificity: z.number().min(1).max(5),
  factualSafety: z.number().min(1).max(5),
});

export const CriticIssueSchema = z.object({
  exactPhrase: z.string(),
  problem: z.string(),
  suggestedFix: z.string(),
});

export const CriticEvaluationItemSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  verdict: z.enum(['pass', 'revise']),
  scores: CriticScoreSchema,
  issues: z.array(CriticIssueSchema).max(3),
  statusText: z.string().max(100),
});

export const CriticOutputSchema = z.object({
  evaluations: z.array(CriticEvaluationItemSchema).min(1),
});

export type CriticScores = z.infer<typeof CriticScoreSchema>;
export type CriticIssue = z.infer<typeof CriticIssueSchema>;
export type CriticEvaluationItem = z.infer<typeof CriticEvaluationItemSchema>;
export type CriticOutput = z.infer<typeof CriticOutputSchema>;

/**
 * Art Director Agent Output Schemas
 */
export const ArtDirectorItemSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  prompt: z.string().min(1, 'Image prompt cannot be empty'),
  aspectRatio: z.string().default('16:9'),
  altText: z.string().min(1, 'Accessibility alt text cannot be empty'),
});

export const ArtDirectorOutputSchema = z.object({
  visuals: z.array(ArtDirectorItemSchema).min(1),
});

export type ArtDirectorItem = z.infer<typeof ArtDirectorItemSchema>;
export type ArtDirectorOutput = z.infer<typeof ArtDirectorOutputSchema>;

/**
 * Quality Assessment Helper:
 * Evaluates whether scores meet the threshold:
 * - Average score across 6 dimensions >= 4.0
 * - No individual dimension < 3
 * - factualSafety >= 4
 */
export function evaluateQualityThreshold(scores: CriticScores): {
  average: number;
  meetsThreshold: boolean;
  reason?: string;
} {
  const values = [
    scores.voiceMatch,
    scores.principleCompliance,
    scores.audienceFit,
    scores.platformFit,
    scores.specificity,
    scores.factualSafety,
  ];

  const average = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2));
  const hasLowScore = values.some((v) => v < 3);
  const safeFacts = scores.factualSafety >= 4;

  if (hasLowScore) {
    return {
      average,
      meetsThreshold: false,
      reason: 'At least one quality dimension scored below 3.',
    };
  }

  if (!safeFacts) {
    return {
      average,
      meetsThreshold: false,
      reason: 'Factual safety scored below 4 (contains ungrounded claims or missing placeholders).',
    };
  }

  if (average < 4.0) {
    return {
      average,
      meetsThreshold: false,
      reason: `Average score (${average}) is below 4.0 threshold.`,
    };
  }

  return { average, meetsThreshold: true };
}

/**
 * Regular expression to detect explicit placeholders such as [YOUR NUMBER], [PERCENTAGE], [DATE]
 */
export const PLACEHOLDER_REGEX = /\[[A-Z0-9_\s-]{2,40}\]/g;

export function extractPlaceholders(text: string): string[] {
  const matches = text.match(PLACEHOLDER_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}
