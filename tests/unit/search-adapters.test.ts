import { describe, it, expect } from 'vitest';
import { TavilySearchAdapter } from '@/lib/search/tavily-adapter';
import { RssFeedSearchAdapter } from '@/lib/search/rss-adapter';
import fs from 'node:fs';
import path from 'node:path';

describe('Search Adapters (search-adapters.test.ts)', () => {
  describe('TavilySearchAdapter', () => {
    const adapter = new TavilySearchAdapter();

    it('reports availability based on key prefix', async () => {
      expect(await adapter.isAvailable('tvly-1234567890abcdef')).toBe(true);
      expect(await adapter.isAvailable('invalid-prefix-key')).toBe(false);
      expect(await adapter.isAvailable(undefined)).toBe(false);
    });

    it('returns structured search items in test mode', async () => {
      const result = await adapter.search(
        { query: 'Artificial Intelligence' },
        'tvly-test-key-mock',
      );

      expect(result.sourceProvider).toBe('tavily');
      expect(result.creditsUsed).toBe(1);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.title).toBeDefined();
      expect(result.items[0]?.canonicalUrl).toContain('https://');
      expect(result.items[0]?.sourceDomain).toBeDefined();
    });

    it('throws error when search is called without key', async () => {
      await expect(
        adapter.search({ query: 'AI' }, undefined),
      ).rejects.toThrow('Tavily API key is required');
    });
  });

  describe('RssFeedSearchAdapter', () => {
    const adapter = new RssFeedSearchAdapter();

    it('is always available as zero-cost universal fallback', async () => {
      expect(await adapter.isAvailable()).toBe(true);
    });

    it('parses RSS 2.0 XML feeds correctly', () => {
      const fixturePath = path.join(
        process.cwd(),
        'tests',
        'fixtures',
        'explore',
        'tech-news.rss.xml',
      );
      const xml = fs.readFileSync(fixturePath, 'utf-8');

      // Access private parser via typecast for unit testing
      const items = (adapter as any).parseXmlFeed(xml);
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items[0].title).toBe('TypeScript 5.8 Introduces Granular Type Specialization');
      expect(items[0].sourceDomain).toBe('techinsights.example.com');
      expect(items[0].canonicalUrl).toBe(
        'https://techinsights.example.com/posts/typescript-58-preview',
      );
    });

    it('parses Atom XML feeds correctly', () => {
      const fixturePath = path.join(
        process.cwd(),
        'tests',
        'fixtures',
        'explore',
        'business-news.atom.xml',
      );
      const xml = fs.readFileSync(fixturePath, 'utf-8');

      const items = (adapter as any).parseXmlFeed(xml);
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].title).toContain('Sustainable Infrastructure Investments Surge in EMEA Region');
      expect(items[0].sourceDomain).toBe('globalbriefing.example.com');
    });

    it('strips HTML tags from snippets', () => {
      const stripped = adapter.stripHtmlTags(
        '<p>This is <strong>important</strong> news with <a href="#">link</a>.</p>',
      );
      expect(stripped).toBe('This is important news with link.');
    });
  });
});
