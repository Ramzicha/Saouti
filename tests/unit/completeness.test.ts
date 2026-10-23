import { describe, it, expect } from 'vitest';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';

describe('Profile Completeness Scoring', () => {
  it('returns low score for empty profile with helpful starter tip', () => {
    const result = calculateProfileCompleteness({});
    expect(result.score).toBe(0);
    expect(result.level).toBe('starter');
    expect(result.nextTip).toContain('professional role');
  });

  it('calculates intermediate score for fast-track activated profile', () => {
    const result = calculateProfileCompleteness({
      role: 'Staff Architect',
      platformsCount: 1,
      samplesCount: 1,
    });

    // Role (15) + Platforms (10) + Sample (5) = 30
    expect(result.score).toBe(30);
    expect(result.level).toBe('starter');
  });

  it('calculates optimal 100% score for comprehensively populated profile', () => {
    const result = calculateProfileCompleteness({
      role: 'Founder & CTO',
      identityData: {
        role: 'Founder & CTO',
        industry: 'Fintech',
        expertise: ['Payments', 'Security'],
        positioning: 'Democratizing cross-border finance',
      },
      principlesData: {
        values: ['Transparency', 'Speed'],
        topicsToAvoid: ['Politics'],
        toneRedLines: ['No hype'],
      },
      audienceData: {
        persona: 'Tech leaders and founders',
        expertiseLevel: 'expert',
        interests: ['API economics'],
      },
      objectivesData: {
        primaryObjective: 'authority',
      },
      styleData: {
        formality: 4,
        hookStyle: 'bold_statement',
      },
      platformsCount: 2,
      hasRedditRules: true,
      samplesCount: 4,
    });

    expect(result.score).toBe(100);
    expect(result.level).toBe('optimal');
    expect(result.nextTip).toBeUndefined();
  });
});
