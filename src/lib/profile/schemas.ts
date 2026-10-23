import { z } from 'zod';

export const IdentitySchema = z.object({
  role: z
    .string()
    .trim()
    .min(2, 'Role must be at least 2 characters')
    .max(120, 'Role must be 120 characters or less'),
  industry: z.string().trim().max(120).optional(),
  expertise: z.array(z.string().trim().max(80)).max(10).optional(),
  positioning: z.string().trim().max(500).optional(),
});

export type IdentityData = z.infer<typeof IdentitySchema>;

export const PrinciplesSchema = z.object({
  values: z.array(z.string().trim().max(100)).max(10).optional(),
  topicsToAvoid: z.array(z.string().trim().max(100)).max(20).optional(),
  toneRedLines: z.array(z.string().trim().max(100)).max(20).optional(),
});

export type PrinciplesData = z.infer<typeof PrinciplesSchema>;

export const AudienceSchema = z.object({
  persona: z.string().trim().max(300).optional(),
  expertiseLevel: z
    .enum(['beginner', 'intermediate', 'expert', 'general'])
    .default('general'),
  interests: z.array(z.string().trim().max(80)).max(15).optional(),
});

export type AudienceData = z.infer<typeof AudienceSchema>;

export const ObjectivesSchema = z.object({
  primaryObjective: z
    .enum(['authority', 'leads', 'hiring', 'community', 'sales'])
    .default('authority'),
  platformRankings: z
    .record(
      z.array(
        z.enum(['authority', 'leads', 'hiring', 'community', 'sales']),
      ),
    )
    .optional(),
});

export type ObjectivesData = z.infer<typeof ObjectivesSchema>;

export const StyleSchema = z.object({
  formality: z.number().int().min(1).max(5).default(3),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  emoji: z.enum(['none', 'minimal', 'frequent']).default('minimal'),
  hookStyle: z
    .enum(['bold_statement', 'question', 'story', 'statistic'])
    .default('bold_statement'),
});

export type StyleData = z.infer<typeof StyleSchema>;

export const LanguageSchema = z.object({
  primaryLanguage: z.enum(['en', 'fr', 'ar']).default('en'),
  arabicDialect: z.enum(['none', 'msa', 'darija', 'both']).default('none'),
});

export type LanguageData = z.infer<typeof LanguageSchema>;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const VoiceSampleSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255)
    .default('Voice Sample'),
  content: z
    .string()
    .trim()
    .refine((txt) => {
      const words = countWords(txt);
      return words >= 50 && words <= 1000;
    }, {
      message: 'Sample must be between 50 and 1,000 words',
    }),
  orderIndex: z.number().int().min(0).max(4).default(0),
});

export type VoiceSampleData = z.infer<typeof VoiceSampleSchema>;

export const SubredditRuleSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(/^r\/[a-zA-Z0-9_]{3,21}$/, 'Must be a valid subreddit name like r/startups'),
  rulesSummary: z.string().trim().max(500).optional(),
});

export const PlatformPreferenceSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  primaryObjective: z
    .enum(['authority', 'leads', 'hiring', 'community', 'sales'])
    .default('authority'),
  subreddits: z.array(SubredditRuleSchema).optional(),
  customInstructions: z.string().trim().max(1000).optional(),
});

export type PlatformPreferenceData = z.infer<typeof PlatformPreferenceSchema>;

/**
 * Fast-track activation schema (FR-019):
 * Requires Role, at least 1 platform, and at least 1 valid voice sample (50-1,000 words).
 */
export const ProfileActivationSchema = z.object({
  role: z.string().trim().min(2, 'Role is required'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  samples: z.array(VoiceSampleSchema).min(1, 'Provide at least one voice sample'),
});

export type ProfileActivationData = z.infer<typeof ProfileActivationSchema>;

/**
 * Step payload schema for autosaving drafts
 */
export const SaveStepDraftSchema = z.object({
  step: z.number().int().min(1).max(7),
  identity: IdentitySchema.partial().optional(),
  principles: PrinciplesSchema.partial().optional(),
  audience: AudienceSchema.partial().optional(),
  objectives: ObjectivesSchema.partial().optional(),
  style: StyleSchema.partial().optional(),
  languages: LanguageSchema.partial().optional(),
  samples: z.array(VoiceSampleSchema).max(5).optional(),
  platforms: z.array(PlatformPreferenceSchema).optional(),
});

export type SaveStepDraftData = z.infer<typeof SaveStepDraftSchema>;
