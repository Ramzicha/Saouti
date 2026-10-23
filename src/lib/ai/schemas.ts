import { z } from 'zod';

export function sanitizeApiKey(raw: string): string {
  if (!raw) return '';
  // 1. Strip invisible / zero-width characters and control chars
  let cleaned = String(raw).replace(/[\u200B-\u200D\uFEFF\x00-\x1F\x7F]/g, '').trim();
  
  // 2. Strip common variable prefixes if copied from .env or commands
  cleaned = cleaned.replace(/^(?:GEMINI_API_KEY|GOOGLE_API_KEY|API_KEY)\s*[:=]\s*/i, '').trim();
  cleaned = cleaned.replace(/^Bearer\s+/i, '').trim();
  
  // 3. Strip enclosing or stray leading/trailing quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();
  
  // 4. Remove any internal whitespace or newlines
  cleaned = cleaned.replace(/\s+/g, '');
  
  return cleaned;
}

export const SaveApiKeySchema = z.object({
  provider: z.literal('gemini').default('gemini'),
  apiKey: z
    .string()
    .transform((val) => sanitizeApiKey(val))
    .pipe(
      z
        .string()
        .min(10, { message: 'API key must be at least 10 characters' })
        .max(256, { message: 'API key is too long' })
        .regex(/^[A-Za-z0-9_\-+=/.:]+$/, {
          message: 'API key contains invalid characters',
        }),
    ),
  acknowledgedTerms: z.literal(true, {
    errorMap: () => ({
      message: 'You must acknowledge the provider free-tier terms to continue',
    }),
  }),
});

export type SaveApiKeyInput = z.infer<typeof SaveApiKeySchema>;
