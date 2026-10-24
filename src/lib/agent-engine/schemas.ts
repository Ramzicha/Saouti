import { z } from 'zod';

export function normalizePlatformName(val: unknown): unknown {
  if (typeof val !== 'string') return val;
  const lower = val.trim().toLowerCase();
  if (lower === 'x' || lower.includes('twitter')) {
    return 'x';
  }
  if (lower.includes('linkedin')) {
    return 'linkedin';
  }
  if (lower.includes('reddit')) {
    return 'reddit';
  }
  if (lower.includes('instagram') || lower === 'ig') {
    return 'instagram';
  }
  if (lower.includes('facebook') || lower === 'fb') {
    return 'facebook';
  }
  return lower;
}

export const SupportedPlatformSchema = z.preprocess(
  normalizePlatformName,
  z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
);

/**
 * Request validation schema for creating a new post generation run.
 */
export const CreateRunRequestSchema = z.object({
  topicBrief: z
    .string()
    .trim()
    .min(1, 'Topic brief cannot be empty')
    .max(10000, 'Topic brief must not exceed 10000 characters'),
  selectedPlatforms: z
    .array(SupportedPlatformSchema)
    .min(1, 'Select at least one platform'),
  targetLanguage: z.enum(['en', 'fr', 'ar']).default('en'),
  arabicDialect: z.enum(['none', 'msa', 'darija', 'both']).default('none'),
  skipCritic: z.boolean().default(false),
  chatId: z.string().optional(),
});

export type CreateRunRequestInput = z.infer<typeof CreateRunRequestSchema>;

/**
 * Writer Agent Output Schemas
 */
export const WriterPostItemSchema = z.object({
  platform: SupportedPlatformSchema,
  language: z.string(),
  text: z.string().min(1, 'Generated post text cannot be empty'),
  hashtags: z
    .preprocess((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        return val
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      return [];
    }, z.array(z.string()))
    .default([]),
});

export interface WriterOutput {
  posts: WriterPostItem[];
}

export const WriterOutputSchema: z.ZodType<WriterOutput, z.ZodTypeDef, unknown> = z.preprocess(
  (val) => {
    if (Array.isArray(val)) {
      return { posts: val };
    }
    return val;
  },
  z.object({
    posts: z.array(WriterPostItemSchema).min(1, 'At least one post must be drafted'),
  }),
);

export type WriterPostItem = z.infer<typeof WriterPostItemSchema>;

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
  platform: SupportedPlatformSchema,
  verdict: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(['pass', 'revise']),
  ),
  scores: CriticScoreSchema,
  issues: z.array(CriticIssueSchema).max(3).default([]),
  statusText: z.string().max(200).default(''),
});

export type CriticScores = z.infer<typeof CriticScoreSchema>;
export type CriticIssue = z.infer<typeof CriticIssueSchema>;
export type CriticEvaluationItem = z.infer<typeof CriticEvaluationItemSchema>;

export interface CriticOutput {
  evaluations: CriticEvaluationItem[];
}

export const CriticOutputSchema: z.ZodType<CriticOutput, z.ZodTypeDef, unknown> = z.preprocess(
  (val) => {
    if (Array.isArray(val)) {
      return { evaluations: val };
    }
    return val;
  },
  z.object({
    evaluations: z.array(CriticEvaluationItemSchema).min(1),
  }),
);

/**
 * Art Director Agent Output Schemas
 */
export const ArtDirectorItemSchema = z.object({
  platform: SupportedPlatformSchema,
  prompt: z.string().min(1, 'Image prompt cannot be empty'),
  aspectRatio: z.string().default('16:9'),
  altText: z.string().min(1, 'Accessibility alt text cannot be empty'),
});

export type ArtDirectorItem = z.infer<typeof ArtDirectorItemSchema>;

export interface ArtDirectorOutput {
  visuals: ArtDirectorItem[];
}

export const ArtDirectorOutputSchema: z.ZodType<ArtDirectorOutput, z.ZodTypeDef, unknown> = z.preprocess(
  (val) => {
    if (Array.isArray(val)) {
      return { visuals: val };
    }
    return val;
  },
  z.object({
    visuals: z.array(ArtDirectorItemSchema).min(1),
  }),
);

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
