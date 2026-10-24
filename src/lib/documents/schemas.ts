import { z } from 'zod';

export const DOCUMENT_TYPES = ['cv', 'bio', 'articles', 'company_brochure', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);

export const DOCUMENT_STATUSES = ['uploaded', 'processing', 'completed', 'failed'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DocumentStatusSchema = z.enum(DOCUMENT_STATUSES);

export const INSIGHT_CATEGORIES = [
  'roles_experience',
  'expertise',
  'achievements',
  'audience_cues',
  'tone_style_cues',
  'languages',
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const InsightCategorySchema = z.enum(INSIGHT_CATEGORIES);

export const INSIGHT_STATUSES = ['pending', 'approved', 'edited', 'rejected'] as const;
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];

export const InsightStatusSchema = z.enum(INSIGHT_STATUSES);

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOCUMENT_PAGES = 20;
export const MAX_DOCUMENTS_PER_USER = 5;

/**
 * Validation schema for acknowledging the privacy consent notice
 */
export const PrivacyConsentInputSchema = z.object({
  noticeVersion: z.string().min(1).default('v1'),
});
export type PrivacyConsentInput = z.infer<typeof PrivacyConsentInputSchema>;

/**
 * Validation schema for reviewing a proposed insight (accept, edit, reject)
 */
export const InsightReviewInputSchema = z
  .object({
    action: z.enum(['accept', 'edit', 'reject']),
    editedText: z.string().trim().min(1, 'Text cannot be empty').max(400, 'Text cannot exceed 400 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'edit') {
        return !!data.editedText && data.editedText.length > 0;
      }
      return true;
    },
    {
      message: 'editedText is required when action is "edit"',
      path: ['editedText'],
    }
  );
export type InsightReviewInput = z.infer<typeof InsightReviewInputSchema>;

/**
 * Validation schema for deleting a document
 */
export const DocumentDeleteOptionsSchema = z.object({
  keepApprovedFacts: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val !== 'false'),
});
export type DocumentDeleteOptions = z.infer<typeof DocumentDeleteOptionsSchema>;

/**
 * Zod schema for structured insight items extracted by the Profiler LLM
 */
export const ExtractedInsightItemSchema = z.object({
  category: InsightCategorySchema,
  text: z.string().min(1).max(400),
  sourcePage: z.number().int().min(1).default(1),
  confidenceScore: z.number().int().min(0).max(100).default(90),
});
export type ExtractedInsightItem = z.infer<typeof ExtractedInsightItemSchema>;

/**
 * Zod schema for the full structured output from the Profiler document extraction turn
 */
export const ProfilerDocumentExtractionOutputSchema = z.object({
  insights: z.array(ExtractedInsightItemSchema).default([]),
});
export type ProfilerDocumentExtractionOutput = z.infer<typeof ProfilerDocumentExtractionOutputSchema>;
