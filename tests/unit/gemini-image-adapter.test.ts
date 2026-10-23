import { describe, it, expect } from 'vitest';
import { FakeProviderAdapter } from '@/lib/ai/fake-adapter';
import { AiUnsupportedCapabilityError, QuotaExhaustedError, AiSafetyBlockError } from '@/lib/ai/errors';

describe('AI Provider Adapter Image Generation Contract (gemini-image-adapter.test.ts)', () => {
  it('successfully generates an image asset with buffer and dimensions', async () => {
    const adapter = new FakeProviderAdapter();
    adapter.setImageGenerationBehavior('success');

    const result = await adapter.generateImage('Modern solar array in the Sahara desert', {
      aspectRatio: '16:9',
    });

    expect(result).toBeDefined();
    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.imageBuffer).toBeDefined();
    expect(result.imageBuffer?.length).toBeGreaterThan(0);
    expect(result.width).toBe(800);
    expect(result.height).toBe(450);
  });

  it('fails gracefully with AiUnsupportedCapabilityError when key tier lacks image support', async () => {
    const adapter = new FakeProviderAdapter();
    adapter.setImageGenerationBehavior('unsupported_tier');

    await expect(
      adapter.generateImage('A futuristic green train in Algiers'),
    ).rejects.toThrow(AiUnsupportedCapabilityError);
  });

  it('detects capability status accurately via checkImageCapability', async () => {
    const adapter = new FakeProviderAdapter();
    adapter.setImageGenerationBehavior('unsupported_tier');

    const statusUnsupported = await adapter.checkImageCapability();
    expect(statusUnsupported.supported).toBe(false);
    expect(statusUnsupported.reason).toBeDefined();

    adapter.setImageGenerationBehavior('success');
    const statusSupported = await adapter.checkImageCapability();
    expect(statusSupported.supported).toBe(true);
  });

  it('throws QuotaExhaustedError with retry interval on rate limit', async () => {
    const adapter = new FakeProviderAdapter();
    adapter.setImageGenerationBehavior('rate_limit');

    await expect(
      adapter.generateImage('Minimalist logo sketch'),
    ).rejects.toThrow(QuotaExhaustedError);
  });

  it('throws AiSafetyBlockError when image violates safety policies', async () => {
    const adapter = new FakeProviderAdapter();
    adapter.setImageGenerationBehavior('safety_block');

    await expect(
      adapter.generateImage('Potentially unsafe visual brief'),
    ).rejects.toThrow(AiSafetyBlockError);
  });
});
