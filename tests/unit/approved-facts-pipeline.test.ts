import { describe, it, expect } from 'vitest';
import { assembleAgentPrompt } from '@/lib/agent-engine/prompt-builder';

describe('Approved Facts Pipeline & Prompt Assembly (approved-facts-pipeline.test.ts)', () => {
  const baseProfile = '<voice_profile><identity><role>Founder</role></identity></voice_profile>';

  it('assembles Writer prompt with <approved_facts> block when provided', () => {
    const facts = [
      {
        factText: 'Bootstrapped SaaS to $2M ARR with 0 funding in 2024',
        sourceCitation: 'Pitch_Deck.pdf, Page 3',
        factCategory: 'achievements',
      },
      {
        factText: 'Author of 3 published whitepapers on AI agents',
        sourceCitation: 'Articles.pdf, Page 1',
        factCategory: 'expertise',
      },
    ];

    const prompt = assembleAgentPrompt({
      role: 'writer',
      profileSummary: baseProfile,
      platforms: ['linkedin'],
      brief: 'Share reflections on scaling a bootstrapped company',
      approvedFacts: facts,
      promptVersion: 'v2',
    });

    expect(prompt).toContain('<approved_facts>');
    expect(prompt).toContain('</approved_facts>');
    expect(prompt).toContain('Bootstrapped SaaS to $2M ARR with 0 funding in 2024');
    expect(prompt).toContain('(Source: Pitch_Deck.pdf, Page 3)');
    expect(prompt).toContain('[achievements]');
    expect(prompt).toContain('[expertise]');
    expect(prompt).toContain('FACTUAL GROUNDING & APPROVED FACTS');
  });

  it('cleanly omits <approved_facts> block when user has zero documents', () => {
    const prompt = assembleAgentPrompt({
      role: 'writer',
      profileSummary: baseProfile,
      platforms: ['linkedin'],
      brief: 'General networking thoughts',
      promptVersion: 'v2',
    });

    expect(prompt).not.toContain('</approved_facts>');
    expect(prompt).toContain('<voice_profile>');
    expect(prompt).toContain('<brief>');
  });

  it('assembles Critic prompt v2 with <approved_facts> for factual claim auditing', () => {
    const facts = [
      {
        factText: 'Over 10,000 active developers using our API',
        sourceCitation: 'Company_Brochure.pdf, Page 2',
        factCategory: 'metrics',
      },
    ];

    const drafts = [
      {
        platform: 'linkedin',
        language: 'en',
        text: 'Thrilled to hit 10,000 active developers using our API this quarter! [YOUR NUMBER] new signups daily.',
      },
    ];

    const prompt = assembleAgentPrompt({
      role: 'critic',
      profileSummary: baseProfile,
      platforms: ['linkedin'],
      brief: 'Community milestone post',
      draftedPosts: drafts,
      approvedFacts: facts,
      promptVersion: 'v2',
    });

    expect(prompt).toContain('<approved_facts>');
    expect(prompt).toContain('Over 10,000 active developers using our API');
    expect(prompt).toContain('SIX-DIMENSIONAL EVALUATION');
    expect(prompt).toContain('factualSafety');
  });
});
