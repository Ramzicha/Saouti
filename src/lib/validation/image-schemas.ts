import { z } from 'zod';

export const AspectRatioSchema = z.enum(['16:9', '1:1', '4:5', '9:16']);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const GenerateImageRequestSchema = z.object({
  prompt: z.string().trim().max(2000, 'Image prompt must not exceed 2000 characters').optional(),
  aspectRatio: AspectRatioSchema.default('16:9'),
  altText: z.string().trim().max(1000, 'Alt text must not exceed 1000 characters').optional(),
});
export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;

export const RegenerateImageRequestSchema = z.object({
  instruction: z
    .string()
    .trim()
    .min(1, 'Refinement instruction cannot be empty')
    .max(1000, 'Refinement instruction must not exceed 1000 characters'),
  aspectRatio: AspectRatioSchema.optional(),
});
export type RegenerateImageRequest = z.infer<typeof RegenerateImageRequestSchema>;

export const UpdateVisualPromptSchema = z.object({
  imagePrompt: z.string().trim().max(2000).optional(),
  imageAltText: z.string().trim().max(1000).optional(),
  imageAspectRatio: AspectRatioSchema.optional(),
});
export type UpdateVisualPrompt = z.infer<typeof UpdateVisualPromptSchema>;

export const SetPrimaryImageSchema = z.object({
  imageId: z.string().uuid('Invalid image identifier'),
});
export type SetPrimaryImage = z.infer<typeof SetPrimaryImageSchema>;
