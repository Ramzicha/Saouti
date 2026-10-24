import { describe, it, expect } from 'vitest';
import { normalizeCanonicalUrl } from '@/lib/search/url-normalizer';
import {
  SaveArticleInputSchema,
  UpdateSavedArticleNoteSchema,
} from '@/lib/explore/schemas';

describe('Saved Articles Deduplication & Schemas (saved-articles.test.ts)', () => {
  it('deduplicates URLs regardless of tracking parameters, casing, and www prefix', () => {
    const url1 = 'https://www.nature.com/articles/d41586-026-00123-x?utm_source=twitter&utm_medium=social#read';
    const url2 = 'https://nature.com/articles/d41586-026-00123-x/?fbclid=IwAR2345';
    const url3 = 'HTTPS://WWW.NATURE.COM/articles/d41586-026-00123-x';

    const normalized1 = normalizeCanonicalUrl(url1);
    const normalized2 = normalizeCanonicalUrl(url2);
    const normalized3 = normalizeCanonicalUrl(url3);

    expect(normalized1).toBe('https://nature.com/articles/d41586-026-00123-x');
    expect(normalized2).toBe('https://nature.com/articles/d41586-026-00123-x');
    expect(normalized3).toBe('https://nature.com/articles/d41586-026-00123-x');
  });

  it('validates SaveArticleInputSchema correctly', () => {
    const valid = {
      canonicalUrl: 'https://example.com/ai-agents',
      title: 'State of Multi-Agent Systems',
      sourceDomain: 'example.com',
      summary: 'An overview of multi-agent collaboration frameworks in production.',
      topicPhrase: 'AI Agents',
      privateNote: 'Great angle for a LinkedIn breakdown.',
    };

    const result = SaveArticleInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid canonical URLs or empty required fields', () => {
    const invalidUrl = {
      canonicalUrl: 'not-a-valid-url',
      title: 'Sample',
      sourceDomain: 'example.com',
      summary: 'Summary text',
    };
    expect(SaveArticleInputSchema.safeParse(invalidUrl).success).toBe(false);

    const emptyTitle = {
      canonicalUrl: 'https://example.com/test',
      title: '',
      sourceDomain: 'example.com',
      summary: 'Summary text',
    };
    expect(SaveArticleInputSchema.safeParse(emptyTitle).success).toBe(false);
  });

  it('validates and bounds private note lengths', () => {
    const validNote = { privateNote: 'My drafting ideas' };
    expect(UpdateSavedArticleNoteSchema.safeParse(validNote).success).toBe(true);

    const emptyNote = { privateNote: null };
    expect(UpdateSavedArticleNoteSchema.safeParse(emptyNote).success).toBe(true);

    const oversizedNote = { privateNote: 'A'.repeat(1001) };
    expect(UpdateSavedArticleNoteSchema.safeParse(oversizedNote).success).toBe(false);
  });
});
