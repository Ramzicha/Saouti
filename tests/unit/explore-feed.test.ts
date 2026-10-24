import { describe, it, expect } from 'vitest';
import {
  assembleResearcherPrompt,
  loadResearcherPrompt,
  enforceWordCap,
} from '@/lib/agent-engine/agents/researcher';
import { ResearcherOutputSchema } from '@/lib/explore/schemas';

describe('Researcher Agent & Explore Feed Unit Tests (explore-feed.test.ts)', () => {
  it('loads researcher prompt with strict 40-word limit rules', () => {
    const prompt = loadResearcherPrompt();
    expect(prompt).toContain('MAXIMUM 40 WORDS');
    expect(prompt).toContain('DATA ISOLATION');
    expect(prompt).toContain('Why it matches');
  });

  it('assembles prompt with XML delimiter isolation', () => {
    const items = [
      {
        canonicalUrl: 'https://example.com/ai-study',
        title: 'Breakthroughs in AI <Enterprise>',
        sourceDomain: 'example.com',
        publishedAt: new Date('2026-10-24T12:00:00Z'),
        snippet: 'How agents & microservices interact.',
      },
    ];

    const assembled = assembleResearcherPrompt({
      topicPhrase: 'Enterprise AI',
      items,
    });

    expect(assembled).toContain('<search_results topic="Enterprise AI">');
    expect(assembled).toContain(
      '<title>Breakthroughs in AI &lt;Enterprise&gt;</title>',
    );
    expect(assembled).toContain(
      '<content>How agents &amp; microservices interact.</content>',
    );
    expect(assembled).toContain('</search_results>');
  });

  it('enforces word cap strictly under 40 words', () => {
    const shortText = 'This is a short summary under ten words.';
    expect(enforceWordCap(shortText, 40)).toBe(shortText);

    const longText = Array(50).fill('word').join(' ');
    const capped = enforceWordCap(longText, 40);
    const wordCount = capped.replace('...', '').trim().split(/\s+/).length;
    expect(wordCount).toBe(40);
    expect(capped.endsWith('...')).toBe(true);
  });

  it('validates structured Researcher output', () => {
    const validPayload = {
      articles: [
        {
          canonicalUrl: 'https://techcrunch.com/article-1',
          title: 'AI Deployment in Fortune 500',
          sourceDomain: 'techcrunch.com',
          publishedAt: '2026-10-24T10:00:00.000Z',
          summary: 'Fortune 500 companies accelerate agent adoption for mission-critical workflows.',
          matchReason: 'Directly relates to your enterprise leadership positioning',
        },
      ],
    };

    const parsed = ResearcherOutputSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.articles).toHaveLength(1);
      expect(parsed.data.articles[0].sourceDomain).toBe('techcrunch.com');
    }
  });
});
