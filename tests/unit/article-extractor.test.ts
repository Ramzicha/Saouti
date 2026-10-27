import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanHtmlToText, extractArticleContent } from '@/lib/explore/article-extractor';

describe('Article Extractor & Validator (article-extractor.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanHtmlToText', () => {
    it('strips scripts, styles, nav, and footers while preserving article text', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>body { font-size: 14px; }</style>
            <script>console.log("analytics");</script>
          </head>
          <body>
            <header><nav><a href="/">Home</a></nav></header>
            <article>
              <h1>Revolution in Artificial Intelligence</h1>
              <p>Generative AI is shifting how modern engineering teams build software. Key metrics show a 40% gain in speed.</p>
              <p>However, quality assurance remains a critical pillar for production systems.</p>
            </article>
            <footer><p>&copy; 2026 Tech Weekly</p></footer>
          </body>
        </html>
      `;

      const result = cleanHtmlToText(html);
      expect(result).toContain('Revolution in Artificial Intelligence');
      expect(result).toContain('Generative AI is shifting how modern engineering teams build software.');
      expect(result).toContain('40% gain in speed');
      expect(result).not.toContain('console.log');
      expect(result).not.toContain('font-size');
      expect(result).not.toContain('Home');
      expect(result).not.toContain('Tech Weekly');
    });

    it('decodes HTML entities and normalizes paragraph breaks', () => {
      const html = `
        <main>
          <p>Tom &amp; Jerry&#39;s &quot;AI Exploration&quot; &lt;v2&gt; was launched &nbsp; today.</p>
          <ul>
            <li>First breakthrough item</li>
            <li>Second breakthrough item</li>
          </ul>
        </main>
      `;

      const result = cleanHtmlToText(html);
      expect(result).toContain('Tom & Jerry\'s "AI Exploration" <v2> was launched   today.');
      expect(result).toContain('• First breakthrough item');
      expect(result).toContain('• Second breakthrough item');
    });
  });

  describe('extractArticleContent', () => {
    it('returns null for empty or invalid URLs', async () => {
      const result = await extractArticleContent('');
      expect(result).toBeNull();

      const invalid = await extractArticleContent('not-a-valid-url');
      expect(invalid).toBeNull();
    });

    it('fetches and cleans article HTML via direct fallback when available', async () => {
      const mockHtml = `
        <article>
          <h2>Cloud Infrastructure in 2026</h2>
          <p>This is a comprehensive breakdown of serverless architecture, cost optimizations, and edge computing patterns deployed across distributed cloud networks.</p>
          <p>Teams adopting these patterns reported a 35% reduction in latency and substantial savings.</p>
        </article>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      } as unknown as Response);

      const content = await extractArticleContent('https://example.com/cloud-infrastructure-2026');
      expect(content).not.toBeNull();
      expect(content).toContain('Cloud Infrastructure in 2026');
      expect(content).toContain('serverless architecture');
      expect(content).toContain('35% reduction in latency');
    });
  });
});
