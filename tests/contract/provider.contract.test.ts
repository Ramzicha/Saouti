import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { FakeProviderAdapter } from '@/lib/ai/fake-adapter';
import { AiProviderAdapter } from '@/lib/ai/provider';
import { QuotaExhaustedError, InvalidApiKeyError } from '@/lib/ai/errors';

/**
 * Reusable contract suite that ANY AiProviderAdapter must pass.
 */
export function runProviderContractTests(
  providerName: string,
  createAdapter: () => AiProviderAdapter,
) {
  describe(`AiProviderAdapter Contract: ${providerName}`, () => {
    it('validates key existence and format', async () => {
      const adapter = createAdapter();
      const isValid = await adapter.validateKey('valid_test_key_123456');
      expect(isValid).toBe(true);

      const isInvalid = await adapter.validateKey('invalid_key_xyz');
      expect(isInvalid).toBe(false);
    });

    it('generates text with prompt token usage metrics', async () => {
      const adapter = createAdapter();
      const result = await adapter.generateText('Write a LinkedIn post about AI.');

      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.usage).toBeDefined();
      expect(result.usage?.promptTokens).toBeGreaterThan(0);
    });

    it('generates structured data strictly validated against a Zod schema', async () => {
      const adapter = createAdapter();
      const ReviewSchema = z.object({
        status: z.enum(['pass', 'revise', 'fail']),
        score: z.number().min(0).max(100),
        feedback: z.string(),
      });

      const result = await adapter.generateStructured('Critique this draft post.', {
        schema: ReviewSchema,
        schemaName: 'CriticReview',
      });

      expect(result.data).toBeDefined();
      expect(['pass', 'revise', 'fail']).toContain(result.data.status);
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(typeof result.data.feedback).toBe('string');
      expect(result.rawText).toBeDefined();
    });

    it('generates image assets conforming to ImageGenerationResult', async () => {
      const adapter = createAdapter();
      const result = await adapter.generateImage('Minimalist architectural workspace', {
        aspectRatio: '16:9',
      });

      expect(result.imageUrls).toBeInstanceOf(Array);
      expect(result.imageUrls.length).toBeGreaterThan(0);
      expect(result.mimeType).toContain('image/');
      expect(result.prompt).toBe('Minimalist architectural workspace');
    });
  });
}

// Execute contract tests against FakeProviderAdapter
runProviderContractTests('FakeProviderAdapter', () => {
  return new FakeProviderAdapter({
    mockStructuredData: {
      status: 'pass',
      score: 92,
      feedback: 'Excellent authentic tone match',
    },
  });
});

describe('FakeProviderAdapter Error Simulation', () => {
  it('throws simulated errors in FIFO order', async () => {
    const fake = new FakeProviderAdapter();
    fake.setSimulatedErrors([
      new QuotaExhaustedError('Rate limit exceeded'),
      new InvalidApiKeyError('Key revoked'),
    ]);

    await expect(fake.generateText('First call')).rejects.toThrow(QuotaExhaustedError);
    await expect(fake.generateText('Second call')).rejects.toThrow(InvalidApiKeyError);
    // Third call has empty error queue and succeeds
    const success = await fake.generateText('Third call');
    expect(success.text).toBeDefined();
  });
});
