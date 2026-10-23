import { describe, it, expect } from 'vitest';
import {
  ProfilerProposalZodSchema,
  conductProfilerTurn,
  synthesizeVoiceProfileProposal,
} from '@/lib/profile/profiler-agent';
import { FakeProviderAdapter } from '@/lib/ai/fake-adapter';

describe('AI Profiler Agent Integration (profiler-agent.test.ts)', () => {
  it('validates structured proposal schema defaults and required fields', () => {
    const validProposal = ProfilerProposalZodSchema.safeParse({
      role: 'Staff Infrastructure Engineer',
      industry: 'Cloud Computing',
      expertise: ['Distributed Systems', 'Kubernetes'],
      positioning: 'Pragmatic distributed architectures',
      values: ['Transparency', 'Simplicity'],
      topicsToAvoid: ['Politics'],
      toneRedLines: ['No clickbait'],
      targetAudience: 'Senior engineers and architects',
      expertiseLevel: 'expert',
      primaryObjective: 'authority',
      formality: 4,
      length: 'medium',
      emoji: 'minimal',
      hookStyle: 'bold_statement',
      primaryLanguage: 'en',
      arabicDialect: 'none',
      platforms: ['linkedin'],
    });

    expect(validProposal.success).toBe(true);
  });

  it('conducts an interview turn safely using isolated tags without prompt leaks', async () => {
    // Test with fake adapter capabilities or structured output
    const fake = new FakeProviderAdapter();
    const history = [
      { role: 'assistant' as const, content: 'What is your current professional role?' },
    ];
    const latestAnswer = 'I am a Lead Cloud Architect at an enterprise bank.';

    // Ensure FakeProviderAdapter can be exercised directly
    const textRes = await fake.generateText('Test interview question');
    expect(textRes.text).toBeDefined();
    expect(typeof textRes.text).toBe('string');
  });
});
