import { z } from 'zod';

export const SaveApiKeySchema = z.object({
  provider: z.literal('gemini').default('gemini'),
  apiKey: z
    .string()
    .trim()
    .min(10, { message: 'API key must be at least 10 characters' })
    .max(256, { message: 'API key is too long' })
    .regex(/^[A-Za-z0-9_\-]+$/, {
      message: 'API key contains invalid characters',
    }),
  acknowledgedTerms: z.literal(true, {
    errorMap: () => ({
      message: 'You must acknowledge the provider free-tier terms to continue',
    }),
  }),
});

export type SaveApiKeyInput = z.infer<typeof SaveApiKeySchema>;
