import { describe, it, expect, vi } from 'vitest';
import { SearchPipelineService } from '@/lib/search/pipeline';
import * as keyVault from '@/lib/auth/keys';
import crypto from 'crypto';

describe('Search Pipeline Resilience & Fallback Chain (search-fallback.test.ts)', () => {
  const pipeline = new SearchPipelineService();

  it('uses Tavily when a valid key is configured', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(keyVault, 'getDecryptedKey').mockResolvedValueOnce('tvly-test-sample-key');

    const result = await pipeline.executeSearch(userId, { query: 'Generative AI' });
    expect(result.sourceProvider).toBe('tavily');
    expect(result.fallbackReason).toBeNull();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.creditsUsed).toBe(1);
  });

  it('automatically falls back to curated RSS feeds when no key is present', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(keyVault, 'getDecryptedKey').mockResolvedValueOnce(null);

    const result = await pipeline.executeSearch(userId, { query: 'Clean Energy' });
    expect(result.sourceProvider).toBe('feed');
    expect(result.fallbackReason).toBe('No Tavily key configured');
    expect(result.creditsUsed).toBe(0);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('gracefully degrades to RSS feeds when Tavily returns an error (401 or 429)', async () => {
    const userId = crypto.randomUUID();
    vi.spyOn(keyVault, 'getDecryptedKey').mockResolvedValueOnce('tvly-valid-format-key');

    // Spy on tavilyAdapter search to simulate a 429 Rate Limit Exhaustion
    const tavilyAdapter = (pipeline as any).tavilyAdapter;
    vi.spyOn(tavilyAdapter, 'search').mockRejectedValueOnce(
      new Error('Tavily API quota exceeded (HTTP 429)'),
    );

    const result = await pipeline.executeSearch(userId, { query: 'Cloud Infrastructure' });
    expect(result.sourceProvider).toBe('feed');
    expect(result.fallbackReason).toContain('quota exceeded');
    expect(result.creditsUsed).toBe(0);
    expect(result.items.length).toBeGreaterThan(0);
  });
});
