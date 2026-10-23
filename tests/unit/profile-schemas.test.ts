import { describe, it, expect } from 'vitest';
import {
  IdentitySchema,
  PrinciplesSchema,
  VoiceSampleSchema,
  SubredditRuleSchema,
  ProfileActivationSchema,
  countWords,
} from '@/lib/profile/schemas';

describe('Profile Validation Schemas', () => {
  describe('IdentitySchema', () => {
    it('accepts valid role and positioning', () => {
      const result = IdentitySchema.safeParse({
        role: 'Senior Staff Engineer',
        industry: 'Cloud Infrastructure',
        expertise: ['Kubernetes', 'Distributed Systems'],
        positioning: 'Pragmatic distributed architectures',
      });
      expect(result.success).toBe(true);
    });

    it('rejects role shorter than 2 characters', () => {
      const result = IdentitySchema.safeParse({
        role: 'A',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('VoiceSampleSchema & countWords', () => {
    it('accurately counts whitespace-separated words', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('hello   world')).toBe(2);
      expect(countWords('one two three four five')).toBe(5);
    });

    it('rejects sample under 50 words', () => {
      const words = Array.from({ length: 49 }, (_, i) => `word${i}`).join(' ');
      const result = VoiceSampleSchema.safeParse({
        title: 'Too Short',
        content: words,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('50');
      }
    });

    it('accepts sample with 50 to 1000 words', () => {
      const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
      const result = VoiceSampleSchema.safeParse({
        title: 'Good Sample',
        content: words,
      });
      expect(result.success).toBe(true);
    });

    it('rejects sample over 1000 words', () => {
      const words = Array.from({ length: 1001 }, (_, i) => `word${i}`).join(' ');
      const result = VoiceSampleSchema.safeParse({
        title: 'Too Long',
        content: words,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('1,000');
      }
    });
  });

  describe('SubredditRuleSchema', () => {
    it('validates r/subreddit name pattern', () => {
      expect(SubredditRuleSchema.safeParse({ name: 'r/startups' }).success).toBe(true);
      expect(SubredditRuleSchema.safeParse({ name: 'r/devops' }).success).toBe(true);
      expect(SubredditRuleSchema.safeParse({ name: 'invalid-name' }).success).toBe(false);
      expect(SubredditRuleSchema.safeParse({ name: 'r/' }).success).toBe(false);
    });
  });

  describe('ProfileActivationSchema (FR-019 Fast-Track)', () => {
    it('passes when minimal criteria are satisfied (Role, 1+ platform, 1+ sample)', () => {
      const sampleWords = Array.from({ length: 55 }, (_, i) => `test${i}`).join(' ');
      const result = ProfileActivationSchema.safeParse({
        role: 'CTO',
        platforms: ['linkedin'],
        samples: [{ title: 'Post 1', content: sampleWords }],
      });
      expect(result.success).toBe(true);
    });

    it('fails when samples array is empty', () => {
      const result = ProfileActivationSchema.safeParse({
        role: 'CTO',
        platforms: ['linkedin'],
        samples: [],
      });
      expect(result.success).toBe(false);
    });

    it('fails when platforms array is empty', () => {
      const sampleWords = Array.from({ length: 55 }, (_, i) => `test${i}`).join(' ');
      const result = ProfileActivationSchema.safeParse({
        role: 'CTO',
        platforms: [],
        samples: [{ title: 'Post 1', content: sampleWords }],
      });
      expect(result.success).toBe(false);
    });
  });
});
