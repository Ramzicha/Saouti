import { describe, it, expect } from 'vitest';
import {
  UpdatePostSchema,
  MarkAsPostedSchema,
  TagInputSchema,
  PostFilterQuerySchema,
} from '@/lib/validation/post-schemas';

describe('Post Validation Schemas', () => {
  describe('UpdatePostSchema', () => {
    it('accepts valid post edits', () => {
      const valid = {
        content: 'Updated post content with high value insight.',
        hashtags: ['#ai', '#startup', 'tech'],
        imagePrompt: 'A sleek minimal workspace at dusk',
        imageAltText: 'Minimal workspace at dusk',
        imageAspectRatio: '16:9',
        status: 'ready',
      };
      const parsed = UpdatePostSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('rejects empty content', () => {
      const invalid = { content: '' };
      const parsed = UpdatePostSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('MarkAsPostedSchema', () => {
    it('accepts valid HTTPS URL and datetime', () => {
      const valid = {
        publishedUrl: 'https://linkedin.com/posts/12345678',
        publishedAt: new Date().toISOString(),
      };
      const parsed = MarkAsPostedSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('rejects non-HTTPS URLs', () => {
      const invalid = {
        publishedUrl: 'http://insecure.com/post',
      };
      const parsed = MarkAsPostedSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('accepts empty publishedUrl', () => {
      const valid = { publishedUrl: '' };
      const parsed = MarkAsPostedSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });
  });

  describe('TagInputSchema', () => {
    it('validates tag name and trims whitespace', () => {
      const valid = { name: '  AI Innovation  ', color: '#6366f1' };
      const parsed = TagInputSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe('AI Innovation');
      }
    });

    it('rejects tag names longer than 30 characters', () => {
      const invalid = { name: 'a'.repeat(31) };
      const parsed = TagInputSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('PostFilterQuerySchema', () => {
    it('parses cursor, limit, and filter query parameters', () => {
      const raw = {
        platform: 'linkedin',
        status: 'ready',
        isTrash: 'false',
        limit: '20',
      };
      const parsed = PostFilterQuerySchema.safeParse(raw);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.isTrash).toBe(false);
        expect(parsed.data.limit).toBe(20);
        expect(parsed.data.platform).toBe('linkedin');
      }
    });
  });
});
