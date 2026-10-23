import { describe, it, expect } from 'vitest';
import {
  AspectRatioSchema,
  GenerateImageRequestSchema,
  RegenerateImageRequestSchema,
  UpdateVisualPromptSchema,
  SetPrimaryImageSchema,
} from '@/lib/validation/image-schemas';

describe('Image Schemas Validation (image-schemas.ts)', () => {
  it('validates supported social aspect ratios', () => {
    expect(AspectRatioSchema.safeParse('16:9').success).toBe(true);
    expect(AspectRatioSchema.safeParse('1:1').success).toBe(true);
    expect(AspectRatioSchema.safeParse('4:5').success).toBe(true);
    expect(AspectRatioSchema.safeParse('9:16').success).toBe(true);
    expect(AspectRatioSchema.safeParse('21:9').success).toBe(false);
  });

  it('validates GenerateImageRequestSchema with defaults', () => {
    const parsed = GenerateImageRequestSchema.parse({});
    expect(parsed.aspectRatio).toBe('16:9');
    expect(parsed.prompt).toBeUndefined();

    const withValues = GenerateImageRequestSchema.parse({
      prompt: 'A solar-powered electric tractor in a field',
      aspectRatio: '1:1',
      altText: 'Electric tractor charging under solar canopy',
    });
    expect(withValues.prompt).toBe('A solar-powered electric tractor in a field');
    expect(withValues.aspectRatio).toBe('1:1');
    expect(withValues.altText).toBe('Electric tractor charging under solar canopy');
  });

  it('rejects oversized prompts or alt texts', () => {
    const longPrompt = 'a'.repeat(2001);
    expect(GenerateImageRequestSchema.safeParse({ prompt: longPrompt }).success).toBe(false);

    const longAlt = 'b'.repeat(1001);
    expect(GenerateImageRequestSchema.safeParse({ altText: longAlt }).success).toBe(false);
  });

  it('validates RegenerateImageRequestSchema requiring non-empty instruction', () => {
    expect(RegenerateImageRequestSchema.safeParse({ instruction: '' }).success).toBe(false);
    expect(
      RegenerateImageRequestSchema.safeParse({
        instruction: 'Make the lighting golden hour and warm',
        aspectRatio: '4:5',
      }).success,
    ).toBe(true);
  });

  it('validates UpdateVisualPromptSchema', () => {
    const result = UpdateVisualPromptSchema.safeParse({
      imagePrompt: 'Refined visual prompt',
      imageAltText: 'New alt text',
      imageAspectRatio: '16:9',
    });
    expect(result.success).toBe(true);
  });

  it('validates SetPrimaryImageSchema with uuid checking', () => {
    expect(SetPrimaryImageSchema.safeParse({ imageId: 'not-a-uuid' }).success).toBe(false);
    expect(
      SetPrimaryImageSchema.safeParse({
        imageId: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);
  });
});
