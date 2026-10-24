export interface SearchItem {
  canonicalUrl: string;
  title: string;
  sourceDomain: string;
  publishedAt: Date | null;
  snippet: string;
}

export interface SearchQueryOptions {
  query: string;
  limit?: number;
  freshness?: 'day' | 'week' | 'month';
  language?: 'en' | 'fr' | 'ar';
}

export interface SearchResult {
  items: SearchItem[];
  creditsUsed: number;
  sourceProvider: 'tavily' | 'feed' | 'gemini_grounding';
}

export interface SearchProvider {
  readonly name: 'tavily' | 'feed' | 'gemini_grounding';
  search(options: SearchQueryOptions, apiKey?: string): Promise<SearchResult>;
  isAvailable(apiKey?: string): Promise<boolean>;
}
