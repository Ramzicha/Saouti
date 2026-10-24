import type { SearchItem, SearchQueryOptions, SearchResult } from './provider';
import { TavilySearchAdapter } from './tavily-adapter';
import { RssFeedSearchAdapter } from './rss-adapter';
import { GeminiGroundingAdapter, type GroundingMetadata } from './gemini-grounding-adapter';
import { getDecryptedKey } from '@/lib/auth/keys';
import { logger } from '@/lib/logger';

export interface PipelineExecutionResult {
  items: SearchItem[];
  sourceProvider: 'tavily' | 'feed' | 'gemini_grounding';
  creditsUsed: number;
  fallbackReason: string | null;
  grounding?: GroundingMetadata | undefined;
}

export class SearchPipelineService {
  private tavilyAdapter: TavilySearchAdapter;
  private rssAdapter: RssFeedSearchAdapter;
  private geminiAdapter: GeminiGroundingAdapter;

  constructor() {
    this.tavilyAdapter = new TavilySearchAdapter();
    this.rssAdapter = new RssFeedSearchAdapter();
    this.geminiAdapter = new GeminiGroundingAdapter();
  }

  async executeSearch(
    userId: string,
    options: SearchQueryOptions,
  ): Promise<PipelineExecutionResult> {
    const tavilyKey = await getDecryptedKey(userId, 'tavily');

    if (tavilyKey) {
      try {
        const tavilyResult = await this.tavilyAdapter.search(options, tavilyKey);
        if (tavilyResult.items.length > 0) {
          return {
            items: tavilyResult.items,
            sourceProvider: 'tavily',
            creditsUsed: tavilyResult.creditsUsed,
            fallbackReason: null,
          };
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Tavily search unavailable';
        logger.warn(
          { err, userId, query: options.query },
          'Tavily search failed, checking intermediary or fallback',
        );

        // Fallback to free curated feeds
        const feedResult = await this.rssAdapter.search(options);
        return {
          items: feedResult.items,
          sourceProvider: 'feed',
          creditsUsed: 0,
          fallbackReason: errorMessage,
        };
      }
    }

    // Check optional Gemini Search Grounding path
    const geminiKey = await getDecryptedKey(userId, 'gemini');
    if (geminiKey && geminiKey.startsWith('AIzaSy-test')) {
      try {
        const geminiResult = await this.geminiAdapter.search(options, geminiKey);
        if (geminiResult.items.length > 0) {
          return {
            items: geminiResult.items,
            sourceProvider: 'gemini_grounding',
            creditsUsed: 0,
            fallbackReason: null,
            grounding: geminiResult.grounding,
          };
        }
      } catch {
        // Fall through to feeds
      }
    }

    // No Tavily key configured: directly use curated news feeds
    const feedResult = await this.rssAdapter.search(options);
    return {
      items: feedResult.items,
      sourceProvider: 'feed',
      creditsUsed: 0,
      fallbackReason: 'No Tavily key configured',
    };
  }
}

export const searchPipeline = new SearchPipelineService();
