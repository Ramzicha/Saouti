import { describe, it, expect } from 'vitest';
import {
  TavilyKeyInputSchema,
  TopicCreateSchema,
  TopicUpdateSchema,
  SaveArticleInputSchema,
  DismissArticleSchema,
  ExploreSearchQuerySchema,
} from '@/lib/explore/schemas';
import {
  normalizeCanonicalUrl,
  extractSourceDomain,
} from '@/lib/search/url-normalizer';

describe('Explore Zod Schemas', () => {
  describe('TavilyKeyInputSchema', () => {
    it('accepts valid Tavily keys starting with tvly-', () => {
      const valid = TavilyKeyInputSchema.safeParse({
        apiKey: 'tvly-abcdef1234567890_xyz',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.apiKey).toBe('tvly-abcdef1234567890_xyz');
      }
    });

    it('rejects keys not starting with tvly-', () => {
      const invalid = TavilyKeyInputSchema.safeParse({
        apiKey: 'sk-abcdef1234567890',
      });
      expect(invalid.success).toBe(false);
    });

    it('rejects empty or too-short keys', () => {
      const empty = TavilyKeyInputSchema.safeParse({ apiKey: 'tvly-' });
      expect(empty.success).toBe(false);
    });
  });

  describe('TopicCreateSchema', () => {
    it('accepts valid topic phrase and sets defaults', () => {
      const valid = TopicCreateSchema.safeParse({
        phrase: 'Enterprise Generative AI',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.phrase).toBe('Enterprise Generative AI');
        expect(valid.data.reason).toBe('Custom user topic');
        expect(valid.data.isPinned).toBe(false);
      }
    });

    it('rejects phrase less than 2 characters or longer than 120', () => {
      expect(TopicCreateSchema.safeParse({ phrase: 'a' }).success).toBe(false);
      expect(
        TopicCreateSchema.safeParse({ phrase: 'x'.repeat(121) }).success,
      ).toBe(false);
    });
  });

  describe('SaveArticleInputSchema', () => {
    it('accepts complete valid article payload', () => {
      const valid = SaveArticleInputSchema.safeParse({
        canonicalUrl: 'https://example.com/ai-article',
        title: 'Breakthrough in AI',
        sourceDomain: 'example.com',
        summary: 'A short plain language summary of the article.',
        topicPhrase: 'Generative AI',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects invalid URLs', () => {
      const invalid = SaveArticleInputSchema.safeParse({
        canonicalUrl: 'not-a-url',
        title: 'Title',
        sourceDomain: 'example.com',
        summary: 'Summary',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('DismissArticleSchema', () => {
    it('accepts valid URL', () => {
      expect(
        DismissArticleSchema.safeParse({
          canonicalUrl: 'https://example.com/story',
        }).success,
      ).toBe(true);
    });
  });

  describe('ExploreSearchQuerySchema', () => {
    it('parses forceRefresh boolean transform', () => {
      const query1 = ExploreSearchQuerySchema.safeParse({
        forceRefresh: 'true',
      });
      expect(query1.success).toBe(true);
      if (query1.success) {
        expect(query1.data.forceRefresh).toBe(true);
      }

      const query2 = ExploreSearchQuerySchema.safeParse({});
      expect(query2.success).toBe(true);
      if (query2.success) {
        expect(query2.data.forceRefresh).toBe(false);
      }
    });
  });
});

describe('URL Normalizer', () => {
  it('strips all utm_* tracking parameters', () => {
    const raw =
      'https://www.Example.com/blog/ai-future/?utm_source=twitter&utm_medium=social&utm_campaign=spring2026';
    const normalized = normalizeCanonicalUrl(raw);
    expect(normalized).toBe('https://example.com/blog/ai-future');
  });

  it('strips fbclid and gclid tracking parameters', () => {
    const raw =
      'https://news.site.org/post-1?fbclid=IwAR12345&gclid=Cj0KCQiA&topic=ai';
    const normalized = normalizeCanonicalUrl(raw);
    expect(normalized).toBe('https://news.site.org/post-1?topic=ai');
  });

  it('removes URL fragments and normalizes trailing slash', () => {
    const raw = 'https://TECHCRUNCH.COM/category/agents/#header-summary';
    const normalized = normalizeCanonicalUrl(raw);
    expect(normalized).toBe('https://techcrunch.com/category/agents');
  });

  it('preserves root slash', () => {
    const raw = 'https://example.com/';
    const normalized = normalizeCanonicalUrl(raw);
    expect(normalized).toBe('https://example.com/');
  });

  it('sorts legitimate query parameters deterministically', () => {
    const raw1 = 'https://example.com/item?b=2&a=1';
    const raw2 = 'https://example.com/item?a=1&b=2';
    expect(normalizeCanonicalUrl(raw1)).toBe(normalizeCanonicalUrl(raw2));
  });

  it('extractSourceDomain strips www and returns lowercase hostname', () => {
    expect(extractSourceDomain('https://WWW.Sub.Example.COM/story')).toBe(
      'sub.example.com',
    );
    expect(extractSourceDomain('https://techcrunch.com/article')).toBe(
      'techcrunch.com',
    );
    expect(extractSourceDomain('invalid')).toBe('web');
  });
});
