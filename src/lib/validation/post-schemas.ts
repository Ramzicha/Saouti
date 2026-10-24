import { z } from 'zod';

export const PlatformSchema = z.enum([
  'linkedin',
  'x',
  'reddit',
  'instagram',
  'facebook',
]);

export const PostStatusSchema = z.enum(['draft', 'ready', 'posted']);

export const UpdatePostSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  hashtags: z
    .array(z.string().regex(/^#?[a-zA-Z0-9_\u0600-\u06FF]+$/, 'Invalid hashtag'))
    .max(30)
    .default([]),
  imagePrompt: z.string().max(2000).optional(),
  imageAltText: z.string().max(1000).optional(),
  imageAspectRatio: z.string().max(20).optional(),
  status: PostStatusSchema.optional(),
  changeSummary: z.string().max(255).optional(),
});

export const MarkAsPostedSchema = z.object({
  publishedUrl: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS protocol')
    .optional()
    .or(z.literal('')),
  publishedAt: z.string().datetime().optional(),
});

export const TagInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name required')
    .max(30, 'Tag name must be 30 characters or fewer')
    .transform((val) => val.trim()),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color code')
    .default('#6366f1'),
});

export const CreatePostSchema = z.object({
  runId: z.string().uuid().optional(),
  platform: PlatformSchema,
  language: z.string().max(10).optional().default('en'),
  content: z.string().min(1, 'Content cannot be empty'),
  hashtags: z.array(z.string()).optional().default([]),
  imagePrompt: z.string().optional(),
  imageAltText: z.string().optional(),
  imageAspectRatio: z.string().optional(),
  status: PostStatusSchema.optional().default('ready'),
});

export const PostFilterQuerySchema = z.object({
  platform: PlatformSchema.optional(),
  status: PostStatusSchema.optional(),
  savedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  tag: z.string().optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  isTrash: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

