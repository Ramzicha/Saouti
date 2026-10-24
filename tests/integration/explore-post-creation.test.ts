import { describe, it, expect } from 'vitest';
import { CreateRunRequestSchema } from '@/lib/agent-engine/schemas';
import { db } from '@/lib/db/client';
import { runs } from '@/lib/db/schema';
import crypto from 'crypto';

describe('Explore Article to Post Creation Pipeline (explore-post-creation.test.ts)', () => {
  const sampleArticle = {
    title: 'Breakthrough in Clean Energy Storage',
    sourceDomain: 'technologyreview.com',
    url: 'https://technologyreview.com/clean-energy-storage',
    summary: 'Researchers developed a solid-state battery with 50% higher density and faster charge times.',
  };

  it('validates run creation request with attached sourceArticle', () => {
    const input = {
      topicBrief: 'Share an insight on battery storage breakthroughs',
      selectedPlatforms: ['linkedin', 'x'],
      targetLanguage: 'en',
      sourceArticle: sampleArticle,
    };

    const parsed = CreateRunRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sourceArticle).toBeDefined();
      expect(parsed.data.sourceArticle?.title).toBe(sampleArticle.title);
      expect(parsed.data.sourceArticle?.sourceDomain).toBe(sampleArticle.sourceDomain);
    }
  });

  it('rejects sourceArticle with invalid structure', () => {
    const invalidInput = {
      topicBrief: 'Test brief',
      selectedPlatforms: ['linkedin'],
      sourceArticle: {
        title: '', // Empty title
        sourceDomain: 'technologyreview.com',
        url: 'https://technologyreview.com',
        summary: '',
      },
    };

    const parsed = CreateRunRequestSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);
  });

  it('generates correct SQL and attributes for run database record', () => {
    const userId = crypto.randomUUID();
    const chatId = crypto.randomUUID();

    const query = db
      .insert(runs)
      .values({
        userId,
        chatId,
        topicBrief: 'Insight on clean energy',
        selectedPlatforms: ['linkedin', 'x'],
        targetLanguage: 'en',
        arabicDialect: 'none',
        skipCritic: false,
        status: 'pending',
      })
      .toSQL();

    expect(query.sql.toLowerCase()).toContain('insert into "runs"');
    expect(query.sql).toContain('"topic_brief"');
    expect(query.params).toContain(userId);
    expect(query.params).toContain(chatId);
  });
});
