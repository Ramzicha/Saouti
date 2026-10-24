import { z } from 'zod';

export const TavilyKeyInputSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(10, 'Tavily API key is required')
    .regex(/^tvly-[a-zA-Z0-9_-]+$/, 'Invalid Tavily API key format (expected tvly-...)'),
});

export type TavilyKeyInput = z.infer<typeof TavilyKeyInputSchema>;

export const TopicCreateSchema = z.object({
  phrase: z
    .string()
    .trim()
    .min(2, 'Topic must be at least 2 characters')
    .max(120, 'Topic must not exceed 120 characters'),
  reason: z.string().trim().max(300).optional().default('Custom user topic'),
  isPinned: z.boolean().optional().default(false),
});

export type TopicCreateInput = z.infer<typeof TopicCreateSchema>;

export const TopicUpdateSchema = z.object({
  phrase: z
    .string()
    .trim()
    .min(2, 'Topic must be at least 2 characters')
    .max(120, 'Topic must not exceed 120 characters')
    .optional(),
  reason: z.string().trim().max(300).optional(),
  isPinned: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type TopicUpdateInput = z.infer<typeof TopicUpdateSchema>;

export const SaveArticleInputSchema = z.object({
  canonicalUrl: z.string().url('Valid URL is required'),
  title: z.string().min(1, 'Title is required').max(500),
  sourceDomain: z.string().min(1, 'Source domain is required').max(150),
  publishedAt: z.string().datetime().optional().nullable(),
  summary: z.string().min(1, 'Summary is required').max(500),
  topicPhrase: z.string().max(120).optional(),
  privateNote: z.string().max(1000).optional(),
});

export type SaveArticleInput = z.infer<typeof SaveArticleInputSchema>;

export const UpdateSavedArticleNoteSchema = z.object({
  privateNote: z.string().max(1000).optional().nullable(),
});

export type UpdateSavedArticleNoteInput = z.infer<
  typeof UpdateSavedArticleNoteSchema
>;

export const DismissArticleSchema = z.object({
  canonicalUrl: z.string().url('Valid URL is required'),
});

export type DismissArticleInput = z.infer<typeof DismissArticleSchema>;

export const ExploreSearchQuerySchema = z.object({
  topic: z.string().optional(),
  freshness: z.enum(['day', 'week', 'month']).optional().default('week'),
  language: z.enum(['en', 'fr', 'ar']).optional(),
  forceRefresh: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type ExploreSearchQuery = z.infer<typeof ExploreSearchQuerySchema>;
