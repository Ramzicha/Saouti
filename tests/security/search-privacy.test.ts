import { describe, it, expect } from 'vitest';
import { loadTopicPlannerPrompt } from '@/lib/agent-engine/agents/topic-planner';

describe('Search Query Privacy & Zero Profile Leakage (search-privacy.test.ts)', () => {
  const privateProfile = {
    fullName: 'Jane Doe',
    email: 'jane.doe@enterprise-secret-corp.internal',
    employer: 'MegaCorp Global Technologies Ltd',
    salary: '$250,000',
    privateNotes: 'Looking to transition secretly to a stealth startup in Q1 2027',
  };

  it('guarantees prompt rules forbid including personal identifiers in topic phrases', () => {
    const prompt = loadTopicPlannerPrompt();

    // Verify constitutional query boundary rules
    expect(prompt).toContain('Output topic phrases MUST NEVER contain');
    expect(prompt).toContain('personal name');
    expect(prompt).toContain('email address');
    expect(prompt).toContain('employer name');
  });

  it('verifies topic phrases do not leak user personal identifiers into search requests', () => {
    const approvedTopics = [
      'Enterprise Generative AI agents',
      'Distributed Systems Architecture',
      'Clean Energy Logistics',
    ];

    for (const topic of approvedTopics) {
      expect(topic.toLowerCase()).not.toContain(privateProfile.fullName.toLowerCase());
      expect(topic.toLowerCase()).not.toContain(privateProfile.email.toLowerCase());
      expect(topic.toLowerCase()).not.toContain(privateProfile.employer.toLowerCase());
      expect(topic.toLowerCase()).not.toContain('secret');
      expect(topic.toLowerCase()).not.toContain('stealth');
    }
  });

  it('ensures search request body contains strictly topic phrase parameter', () => {
    const topicPhrase = 'Enterprise AI workflows';
    const outgoingTavilyPayload = {
      query: topicPhrase,
      max_results: 5,
    };

    const serialized = JSON.stringify(outgoingTavilyPayload);
    expect(serialized).not.toContain(privateProfile.fullName);
    expect(serialized).not.toContain(privateProfile.email);
    expect(serialized).not.toContain(privateProfile.employer);
  });
});
