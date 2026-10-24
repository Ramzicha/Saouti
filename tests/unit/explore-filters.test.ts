import { describe, it, expect } from 'vitest';
import {
  ExploreSearchQuerySchema,
  DismissArticleSchema,
} from '@/lib/explore/schemas';

describe('Explore Freshness & Language Filters (explore-filters.test.ts)', () => {
  it('validates freshness and language query options correctly', () => {
    const valid = {
      topic: 'Quantum Computing',
      freshness: 'day',
      language: 'en',
      forceRefresh: 'true',
    };

    const parsed = ExploreSearchQuerySchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.freshness).toBe('day');
      expect(parsed.data.language).toBe('en');
      expect(parsed.data.forceRefresh).toBe(true);
    }
  });

  it('defaults freshness to week when omitted', () => {
    const parsed = ExploreSearchQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.freshness).toBe('week');
    }
  });

  it('rejects unsupported freshness or language values', () => {
    const invalidFreshness = { freshness: 'decade' };
    expect(ExploreSearchQuerySchema.safeParse(invalidFreshness).success).toBe(false);

    const invalidLanguage = { language: 'de' };
    expect(ExploreSearchQuerySchema.safeParse(invalidLanguage).success).toBe(false);
  });

  it('validates DismissArticleSchema', () => {
    const validDismiss = { canonicalUrl: 'https://example.com/not-relevant' };
    expect(DismissArticleSchema.safeParse(validDismiss).success).toBe(true);

    const invalidDismiss = { canonicalUrl: 'not-a-url' };
    expect(DismissArticleSchema.safeParse(invalidDismiss).success).toBe(false);
  });
});
