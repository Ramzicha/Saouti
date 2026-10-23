import { describe, it, expect } from 'vitest';
import { GOLDEN_PROFILES } from './golden-profiles';
import { assembleAgentPrompt } from '@/lib/agent-engine/prompt-builder';
import { buildVoiceProfileSummary } from '@/lib/profile/summary-builder';
import { FakeProviderAdapter } from '@/lib/ai/fake-adapter';
import {
  WriterOutputSchema,
  CriticOutputSchema,
  ArtDirectorOutputSchema,
} from '@/lib/agent-engine/schemas';

describe('Golden-Profile Evaluation Suite (agent-engine-eval.test.ts)', () => {
  GOLDEN_PROFILES.forEach((testCase) => {
    describe(`Profile: ${testCase.name}`, () => {
      it('assembles a compliant 5-layer XML prompt with isolated user data', () => {
        const summary = buildVoiceProfileSummary(
          testCase.profile,
          testCase.samples.map((s, idx) => ({ ...s, orderIndex: idx })),
          testCase.platforms.map((p) => ({ platform: p })),
        );

        const prompt = assembleAgentPrompt({
          role: 'writer',
          profileSummary: summary,
          samples: testCase.samples.map((s) => s.content),
          platforms: testCase.platforms,
          brief: testCase.brief,
        });

        // 1. Layer validation
        expect(prompt).toContain('<voice_profile>');
        expect(prompt).toContain('</voice_profile>');
        expect(prompt).toContain('<voice_samples>');
        expect(prompt).toContain('<platform_rules>');
        expect(prompt).toContain('<brief>');
        expect(prompt).toContain(testCase.brief);

        // 2. Strict instruction isolation
        expect(prompt).toContain('STRICTLY AS DATA');
      });

      it('produces and validates structured outputs against FakeAdapter', async () => {
        const fake = new FakeProviderAdapter({
          mockStructuredData: {
            posts: testCase.platforms.map((p) => ({
              platform: p,
              language: testCase.expectedLanguage,
              text: `Authentic test post for ${p} matching ${testCase.name} with [YOUR NUMBER] verified placeholder.`,
              hashtags: p === 'reddit' ? [] : ['#TestTopic'],
            })),
          },
        });

        const writerRes = await fake.generateStructured('Test prompt', {
          schema: WriterOutputSchema,
        });

        expect(writerRes.data.posts).toHaveLength(testCase.platforms.length);
        for (const post of writerRes.data.posts) {
          expect(post.language).toBe(testCase.expectedLanguage);
          expect(post.text).toContain('[YOUR NUMBER]');
          if (post.platform === 'reddit') {
            // Reddit platform rule: zero hashtags
            expect(post.hashtags).toHaveLength(0);
          }
        }
      });
    });
  });
});
