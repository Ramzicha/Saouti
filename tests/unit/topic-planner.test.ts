import { describe, it, expect } from 'vitest';
import {
  assembleTopicPlannerPrompt,
  loadTopicPlannerPrompt,
} from '@/lib/agent-engine/agents/topic-planner';
import { TopicPlannerOutputSchema } from '@/lib/explore/schemas';

describe('Topic Planner Agent Unit Tests (topic-planner.test.ts)', () => {
  it('loads prompt markdown with strict privacy rules', () => {
    const prompt = loadTopicPlannerPrompt();
    expect(prompt).toContain('STRICT PRIVACY');
    expect(prompt).toContain('MUST NEVER');
    expect(prompt).toContain('2 and 6 words');
  });

  it('assembles prompt with XML-escaped profile fields', () => {
    const assembled = assembleTopicPlannerPrompt({
      role: 'VP of AI & Cloud',
      industry: 'Software <SaaS>',
      expertise: ['Autonomous Agents', 'Distributed Systems'],
      positioning: 'Technical visionary & founder',
    });

    expect(assembled).toContain('<role>VP of AI &amp; Cloud</role>');
    expect(assembled).toContain('<industry>Software &lt;SaaS&gt;</industry>');
    expect(assembled).toContain(
      '<expertise>Autonomous Agents, Distributed Systems</expertise>',
    );
  });

  it('validates structured JSON output schema', () => {
    const mockOutput = {
      topics: [
        {
          phrase: 'Enterprise Generative AI agents',
          reason: 'Matches your expertise in AI orchestration',
        },
        {
          phrase: 'Distributed Cloud Observability',
          reason: 'Relevant to your software engineering focus',
        },
      ],
    };

    const parsed = TopicPlannerOutputSchema.safeParse(mockOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.topics).toHaveLength(2);
      expect(parsed.data.topics[0].phrase).toBe(
        'Enterprise Generative AI agents',
      );
    }
  });

  it('rejects empty topics array', () => {
    const invalid = TopicPlannerOutputSchema.safeParse({ topics: [] });
    expect(invalid.success).toBe(false);
  });
});
