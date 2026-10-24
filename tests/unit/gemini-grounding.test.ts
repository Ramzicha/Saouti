import { describe, it, expect } from 'vitest';
import { GeminiGroundingAdapter } from '@/lib/search/gemini-grounding-adapter';

describe('Gemini Search Grounding Adapter (gemini-grounding.test.ts)', () => {
  const adapter = new GeminiGroundingAdapter();

  it('reports availability based on valid API key existence', async () => {
    expect(await adapter.isAvailable('AIzaSy-sample-valid-key')).toBe(true);
    expect(await adapter.isAvailable('')).toBe(false);
    expect(await adapter.isAvailable(undefined)).toBe(false);
  });

  it('returns grounded search results and attribution metadata in test mode', async () => {
    const result = await adapter.search(
      { query: 'Clean Energy Technology' },
      'AIzaSy-test-key',
    );

    expect(result.sourceProvider).toBe('gemini_grounding');
    expect(result.creditsUsed).toBe(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.grounding).toBeDefined();
    expect(result.grounding?.webSearchQueries?.length).toBeGreaterThan(0);
    expect(result.grounding?.searchSuggestions?.length).toBeGreaterThan(0);
  });

  it('throws an error when search is called without an API key', async () => {
    await expect(
      adapter.search({ query: 'Renewable energy' }, undefined),
    ).rejects.toThrow('Gemini API key is required');
  });
});
