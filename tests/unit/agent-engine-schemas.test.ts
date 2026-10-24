import { describe, it, expect } from 'vitest';
import {
  CreateRunRequestSchema,
  WriterOutputSchema,
  CriticOutputSchema,
  ArtDirectorOutputSchema,
  evaluateQualityThreshold,
  extractPlaceholders,
} from '@/lib/agent-engine/schemas';

describe('Agent Engine Schemas & Validation (schemas.ts)', () => {
  describe('CreateRunRequestSchema', () => {
    it('validates a valid create run request with default values', () => {
      const parsed = CreateRunRequestSchema.parse({
        topicBrief: 'Announcing our new open-source vector search engine.',
        selectedPlatforms: ['linkedin', 'x'],
      });

      expect(parsed.targetLanguage).toBe('en');
      expect(parsed.arabicDialect).toBe('none');
      expect(parsed.skipCritic).toBe(false);
      expect(parsed.selectedPlatforms).toEqual(['linkedin', 'x']);
    });

    it('rejects an empty topic brief', () => {
      expect(() =>
        CreateRunRequestSchema.parse({
          topicBrief: '   ',
          selectedPlatforms: ['linkedin'],
        }),
      ).toThrow();
    });

    it('rejects an empty selectedPlatforms list', () => {
      expect(() =>
        CreateRunRequestSchema.parse({
          topicBrief: 'Topic',
          selectedPlatforms: [],
        }),
      ).toThrow();
    });

    it('rejects an unsupported platform', () => {
      expect(() =>
        CreateRunRequestSchema.parse({
          topicBrief: 'Topic',
          selectedPlatforms: ['tiktok' as any],
        }),
      ).toThrow();
    });
  });

  describe('WriterOutputSchema', () => {
    it('accepts valid multi-platform drafted posts', () => {
      const valid = {
        posts: [
          {
            platform: 'linkedin',
            language: 'en',
            text: 'Excited to announce our milestone! We scaled to [YOUR NUMBER] users.',
            hashtags: ['#Tech', '#Growth'],
          },
          {
            platform: 'x',
            language: 'en',
            text: 'Just hit [YOUR NUMBER] users. Lessons learned 👇',
            hashtags: ['#BuildInPublic'],
          },
        ],
      };

      const result = WriterOutputSchema.parse(valid);
      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]?.platform).toBe('linkedin');
    });

    it('normalizes platform casing and variations like "x (twitter)" or "Twitter"', () => {
      const input = {
        posts: [
          {
            platform: 'x (twitter)',
            language: 'en',
            text: 'Tweet content with [YOUR NUMBER]',
          },
          {
            platform: 'LinkedIn',
            language: 'en',
            text: 'LinkedIn post content with [YOUR NUMBER]',
          },
        ],
      };

      const result = WriterOutputSchema.parse(input);
      expect(result.posts[0]?.platform).toBe('x');
      expect(result.posts[1]?.platform).toBe('linkedin');
    });

    it('rejects empty text in drafted post', () => {
      const invalid = {
        posts: [
          {
            platform: 'linkedin',
            language: 'en',
            text: '',
            hashtags: [],
          },
        ],
      };

      expect(() => WriterOutputSchema.parse(invalid)).toThrow();
    });
  });

  describe('CriticOutputSchema', () => {
    it('validates evaluations and allows up to 3 concrete issues', () => {
      const valid = {
        evaluations: [
          {
            platform: 'linkedin',
            verdict: 'revise',
            scores: {
              voiceMatch: 3,
              principleCompliance: 4,
              audienceFit: 4,
              platformFit: 4,
              specificity: 3,
              factualSafety: 3,
            },
            issues: [
              {
                exactPhrase: 'We guaranteed 100% uptime',
                problem: 'Unverified absolute claim violates factual safety',
                suggestedFix: 'Replace with [YOUR NUMBER]% uptime placeholder',
              },
            ],
            statusText: 'Needs revision for factual safety and voice alignment.',
          },
        ],
      };

      const result = CriticOutputSchema.parse(valid);
      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0]?.verdict).toBe('revise');
    });

    it('rejects more than 3 concrete issues per platform', () => {
      const tooManyIssues = {
        evaluations: [
          {
            platform: 'linkedin',
            verdict: 'revise',
            scores: {
              voiceMatch: 3,
              principleCompliance: 3,
              audienceFit: 3,
              platformFit: 3,
              specificity: 3,
              factualSafety: 3,
            },
            issues: [
              { exactPhrase: '1', problem: '1', suggestedFix: '1' },
              { exactPhrase: '2', problem: '2', suggestedFix: '2' },
              { exactPhrase: '3', problem: '3', suggestedFix: '3' },
              { exactPhrase: '4', problem: '4', suggestedFix: '4' },
            ],
            statusText: 'Too many issues',
          },
        ],
      };

      expect(() => CriticOutputSchema.parse(tooManyIssues)).toThrow();
    });
  });

  describe('ArtDirectorOutputSchema', () => {
    it('validates visual directions for approved posts', () => {
      const valid = {
        visuals: [
          {
            platform: 'linkedin',
            prompt: 'Isometric 3D clay render of a high-performance database cluster.',
            aspectRatio: '16:9',
            altText: '3D isometric clay illustration representing a reliable database infrastructure.',
          },
        ],
      };

      const result = ArtDirectorOutputSchema.parse(valid);
      expect(result.visuals[0]?.prompt).toContain('Isometric 3D');
      expect(result.visuals[0]?.aspectRatio).toBe('16:9');
    });
  });

  describe('evaluateQualityThreshold', () => {
    it('passes when average is >= 4.0, no dimension < 3, and factualSafety >= 4', () => {
      const scores = {
        voiceMatch: 4,
        principleCompliance: 5,
        audienceFit: 4,
        platformFit: 5,
        specificity: 4,
        factualSafety: 5,
      };

      const result = evaluateQualityThreshold(scores);
      expect(result.meetsThreshold).toBe(true);
      expect(result.average).toBe(4.5);
    });

    it('fails when factualSafety is less than 4', () => {
      const scores = {
        voiceMatch: 5,
        principleCompliance: 5,
        audienceFit: 5,
        platformFit: 5,
        specificity: 5,
        factualSafety: 3, // Below 4 threshold
      };

      const result = evaluateQualityThreshold(scores);
      expect(result.meetsThreshold).toBe(false);
      expect(result.reason).toContain('Factual safety scored below 4');
    });

    it('fails when any dimension is below 3', () => {
      const scores = {
        voiceMatch: 2, // below 3
        principleCompliance: 5,
        audienceFit: 5,
        platformFit: 5,
        specificity: 5,
        factualSafety: 5,
      };

      const result = evaluateQualityThreshold(scores);
      expect(result.meetsThreshold).toBe(false);
      expect(result.reason).toContain('below 3');
    });

    it('fails when average score is below 4.0', () => {
      const scores = {
        voiceMatch: 3,
        principleCompliance: 4,
        audienceFit: 4,
        platformFit: 4,
        specificity: 3,
        factualSafety: 4,
      }; // sum = 22, avg = 3.67

      const result = evaluateQualityThreshold(scores);
      expect(result.meetsThreshold).toBe(false);
      expect(result.reason).toContain('below 4.0 threshold');
    });
  });

  describe('extractPlaceholders', () => {
    it('detects and deduplicates explicit bracketed placeholders', () => {
      const text =
        'We reached [YOUR NUMBER] active creators, growing by [PERCENTAGE] in [DATE]. Confirm with [YOUR NUMBER].';
      const placeholders = extractPlaceholders(text);
      expect(placeholders).toEqual(['[YOUR NUMBER]', '[PERCENTAGE]', '[DATE]']);
    });

    it('returns empty array when no placeholders exist', () => {
      expect(extractPlaceholders('Plain post with normal text.')).toEqual([]);
    });
  });
});
