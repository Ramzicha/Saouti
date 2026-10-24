import { describe, it, expect } from 'vitest';
import { detectInsightConflict, type ProfileSnapshot } from '@/lib/documents/conflict-detector';
import type { DocumentInsight } from '@/lib/db/schema';

describe('Profile Conflict Detector', () => {
  const baseProfile: ProfileSnapshot = {
    role: 'Chief Technology Officer',
    industry: 'Financial Technology',
    expertise: ['Cloud Architecture', 'Distributed Systems'],
    primaryLanguage: 'en',
  };

  const createMockInsight = (
    category: DocumentInsight['category'],
    text: string,
  ): Pick<DocumentInsight, 'id' | 'category' | 'rawText' | 'sourcePage'> => ({
    id: 'insight-1',
    category,
    rawText: text,
    sourcePage: 1,
  });

  it('detects a conflict when proposed role differs from profile role', () => {
    const insight = createMockInsight(
      'roles_experience',
      'Vice President of Engineering at Global Corp (2020-2024)',
    );

    const result = detectInsightConflict(insight, baseProfile);

    expect(result).not.toBeNull();
    expect(result?.hasConflict).toBe(true);
    expect(result?.field).toBe('role');
    expect(result?.profileValue).toBe('Chief Technology Officer');
    expect(result?.documentValue).toContain('Vice President of Engineering');
  });

  it('does not report conflict when proposed role matches or is empty', () => {
    const matchingInsight = createMockInsight(
      'roles_experience',
      'Chief Technology Officer at Startup Inc',
    );

    const result = detectInsightConflict(matchingInsight, baseProfile);
    expect(result).toBeNull();
  });

  it('does not report conflict when profile has no role specified', () => {
    const insight = createMockInsight('roles_experience', 'Lead Developer');
    const result = detectInsightConflict(insight, { ...baseProfile, role: undefined });
    expect(result).toBeNull();
  });

  it('detects conflict for language disparity', () => {
    const insight = createMockInsight('languages', 'Native Arabic speaker, fluent French');
    const result = detectInsightConflict(insight, {
      ...baseProfile,
      primaryLanguage: 'en',
    });

    expect(result).not.toBeNull();
    expect(result?.field).toBe('language');
    expect(result?.profileValue).toBe('en');
  });

  it('returns null for non-conflicting categories like achievements', () => {
    const insight = createMockInsight(
      'achievements',
      'Scaled system to 10M DAU with 99.99% uptime',
    );

    const result = detectInsightConflict(insight, baseProfile);
    expect(result).toBeNull();
  });
});
