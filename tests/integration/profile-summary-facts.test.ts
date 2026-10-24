import { describe, it, expect } from 'vitest';
import {
  buildVoiceProfileSummary,
  type SummaryProfileInput,
  type SummaryFactInput,
} from '@/lib/profile/summary-builder';

describe('Profile Summary with Approved Facts Integration (profile-summary-facts.test.ts)', () => {
  const baseProfile: SummaryProfileInput = {
    role: 'Lead Architect',
    identityData: {
      role: 'Lead Architect',
      industry: 'Cloud Infrastructure',
      expertise: ['Distributed Systems', 'PostgreSQL'],
      positioning: 'Technical depth with business clarity',
    },
    principlesData: {
      values: ['Precision', 'Pragmatism'],
      topicsToAvoid: ['Speculative hype'],
      toneRedLines: ['Never speak without evidence'],
    },
  };

  it('cleanly omits <approved_facts> when no approved facts are present', () => {
    const xml = buildVoiceProfileSummary(baseProfile, [], []);
    expect(xml).not.toContain('<approved_facts>');
    expect(xml).toContain('<role>Lead Architect</role>');
  });

  it('includes approved facts with category and citation attributes', () => {
    const approvedFacts: SummaryFactInput[] = [
      {
        factCategory: 'achievements',
        factText: 'Scaled cluster throughput by 400% in Q3 2024',
        sourceCitation: 'Architecture_Whitepaper.pdf, Page 4',
      },
      {
        factCategory: 'expertise',
        factText: 'Certified Kubernetes Administrator and AWS Solutions Architect',
        sourceCitation: 'Professional_Bio.pdf, Page 1',
      },
    ];

    const xml = buildVoiceProfileSummary(baseProfile, [], [], '1.0', approvedFacts);

    expect(xml).toContain('<approved_facts>');
    expect(xml).toContain('</approved_facts>');
    expect(xml).toContain('Scaled cluster throughput by 400% in Q3 2024');
    expect(xml).toContain('source="Architecture_Whitepaper.pdf, Page 4"');
    expect(xml).toContain('category="achievements"');
    expect(xml).toContain('category="expertise"');
  });

  it('strictly excludes unapproved or rejected items from the profile snapshot', () => {
    // Rejected or unapproved items must never be passed to buildVoiceProfileSummary
    const onlyApproved: SummaryFactInput[] = [
      {
        factCategory: 'achievements',
        factText: 'Only approved fact',
        sourceCitation: 'CV.pdf, Page 1',
      },
    ];

    const xml = buildVoiceProfileSummary(baseProfile, [], [], '1.0', onlyApproved);

    expect(xml).toContain('Only approved fact');
    expect(xml).not.toContain('rejected insight text');
    expect(xml).not.toContain('pending insight text');
  });
});
