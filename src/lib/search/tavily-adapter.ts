import type {
  SearchProvider,
  SearchQueryOptions,
  SearchResult,
  SearchItem,
} from './provider';
import { normalizeCanonicalUrl, extractSourceDomain } from './url-normalizer';
import { logger } from '@/lib/logger';

export class TavilySearchAdapter implements SearchProvider {
  readonly name = 'tavily' as const;

  async isAvailable(apiKey?: string): Promise<boolean> {
    return Boolean(apiKey && apiKey.startsWith('tvly-'));
  }

  async search(
    options: SearchQueryOptions,
    apiKey?: string,
  ): Promise<SearchResult> {
    if (!apiKey) {
      throw new Error('Tavily API key is required');
    }

    // In test environment or with mock test keys, return mock results
    if (apiKey.startsWith('tvly-test') || process.env.NODE_ENV === 'test') {
      const items: SearchItem[] = [
        {
          canonicalUrl: normalizeCanonicalUrl(
            `https://techchronicle.example.com/articles/${encodeURIComponent(
              options.query,
            )}-breakthrough?utm_source=twitter`,
          ),
          title: `${options.query}: The 2026 Industry Shift and Strategic Impact`,
          sourceDomain: 'techchronicle.example.com',
          publishedAt: new Date(),
          snippet: `A detailed analysis of how ${options.query} is transforming workflows, technology stacks, and professional practices across the enterprise.`,
        },
        {
          canonicalUrl: normalizeCanonicalUrl(
            `https://insights.example.org/analysis/${encodeURIComponent(
              options.query,
            )}-guide?ref=newsletter`,
          ),
          title: `Executive Guide to Navigating ${options.query}`,
          sourceDomain: 'insights.example.org',
          publishedAt: new Date(Date.now() - 3600000 * 24),
          snippet: `Key benchmarks, operational risks, and adoption frameworks for teams implementing ${options.query} at scale.`,
        },
      ];

      return {
        items,
        creditsUsed: 1,
        sourceProvider: 'tavily',
      };
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          query: options.query,
          search_depth: 'basic',
          max_results: options.limit ?? 7,
          include_answer: false,
          include_raw_content: false,
          time_range: options.freshness ?? 'week',
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Tavily monthly credit quota or rate limit exhausted');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Tavily API key credentials');
        }
        throw new Error(`Tavily API responded with status ${response.status}`);
      }

      const data = await response.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const items: SearchItem[] = rawResults.map((r: {
        url: string;
        title: string;
        content?: string;
        published_date?: string;
      }) => {
        const canonicalUrl = normalizeCanonicalUrl(r.url || '');
        const sourceDomain = extractSourceDomain(r.url || '');
        const publishedAt = r.published_date
          ? new Date(r.published_date)
          : null;

        return {
          canonicalUrl,
          title: r.title || 'Untitled Article',
          sourceDomain,
          publishedAt: !isNaN(publishedAt?.getTime() ?? NaN) ? publishedAt : null,
          snippet: (r.content || '').slice(0, 600),
        };
      });

      return {
        items: items.filter((item) => item.canonicalUrl.length > 0),
        creditsUsed: 1,
        sourceProvider: 'tavily',
      };
    } catch (err) {
      logger.error({ err, query: options.query }, 'Tavily search execution failed');
      throw err;
    }
  }
}
