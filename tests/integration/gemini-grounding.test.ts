import { describe, it, expect, vi } from 'vitest';
import { SearchPipelineService } from '@/lib/search/pipeline';
import * as keyVault from '@/lib/auth/keys';
import crypto from 'crypto';

describe('Gemini Search Grounding Integration in Search Pipeline (gemini-grounding.test.ts)', () => {
  const pipeline = new SearchPipelineService();

  it('selects Gemini Search Grounding when Tavily key is absent and test Gemini key is configured', async () => {
    const userId = crypto.randomUUID();

    // Mock getDecryptedKey: null for tavily, AIzaSy-test-key for gemini
    vi.spyOn(keyVault, 'getDecryptedKey').mockImplementation(async (_uid, provider) => {
      if (provider === 'tavily') return null;
      if (provider === 'gemini') return 'AIzaSy-test-key-valid';
      return null;
    });

    const result = await pipeline.executeSearch(userId, { query: 'Next.js App Router Architecture' });

    expect(result.sourceProvider).toBe('gemini_grounding');
    expect(result.creditsUsed).toBe(0);
    expect(result.fallbackReason).toBeNull();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.grounding?.webSearchQueries).toBeDefined();
  });
});
