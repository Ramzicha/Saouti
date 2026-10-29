import { describe, it, expect } from 'vitest';
import { formatChatTitle } from '@/lib/agent-engine/chat-title';

describe('formatChatTitle', () => {
  it('extracts unique title from French Explore article starter brief', () => {
    const brief =
      'Partagez une perspective authentique sur « Google’s Genie 4 world model adds audio, more realistic worlds, and real-time steering » de techcrunch.com, en analysant les points essentiels et ce que cela signifie pour notre secteur.';
    const title = formatChatTitle(brief);
    expect(title).toBe('Google’s Genie 4 world model...');
    expect(title.length).toBeLessThanOrEqual(32);
    expect(title).not.toContain('Partagez une perspective');
  });

  it('extracts unique title from English Explore article starter brief', () => {
    const brief =
      'Share an authentic perspective on "OpenAI debuts Sora video model for creators" from techcrunch.com, discussing the key takeaways and what this means for industry professionals.';
    const title = formatChatTitle(brief);
    expect(title).toBe('OpenAI debuts Sora video...');
    expect(title.length).toBeLessThanOrEqual(32);
    expect(title).not.toContain('Share an authentic perspective');
  });

  it('extracts unique title from Arabic Explore article starter brief', () => {
    const brief =
      'شارك وجهة نظر مهنية متعمقة حول "مستقبل الذكاء الاصطناعي في الرعاية الصحية" من aljazeera.net، مع استعراض أهم الأفكار وتأثيرها على مجالنا.';
    const title = formatChatTitle(brief);
    expect(title).toContain('مستقبل الذكاء الاصطناعي');
    expect(title).not.toContain('شارك وجهة نظر');
  });

  it('prioritizes explicit sourceArticle title when provided', () => {
    const sourceArticle = {
      title: 'DeepSeek-V3 Open Source Architecture Breakdown - TechCrunch',
      sourceDomain: 'techcrunch.com',
    };
    const title = formatChatTitle('Generate post about this', sourceArticle);
    expect(title).toBe('DeepSeek-V3 Open Source...');
    expect(title).not.toContain('TechCrunch');
  });

  it('strips conversational command prefixes in user prompts', () => {
    expect(formatChatTitle('Create a post about startups in algeria')).toBe('Startups in algeria');
    expect(formatChatTitle('Rédige une publication sur le recyclage des polymères')).toBe(
      'Le recyclage des polymères',
    );
    expect(formatChatTitle('Start with something different about solar storage in MENA')).toBe(
      'Solar storage in MENA',
    );
  });

  it('falls back to post content when topic brief is generic filler', () => {
    const posts = [
      {
        text: 'Additive manufacturing is revolutionizing precision aerospace components at lower cost.',
      },
    ];
    const title = formatChatTitle('Create a post about this 1', null, posts);
    expect(title).toBe('Additive manufacturing is...');
  });

  it('keeps short direct topics intact', () => {
    expect(formatChatTitle('Polymer')).toBe('Polymer');
    expect(formatChatTitle('الذكاء الاصطناعي')).toBe('الذكاء الاصطناعي');
    expect(formatChatTitle('Injection molding')).toBe('Injection molding');
    expect(formatChatTitle('Metal 3d printing')).toBe('Metal 3d printing');
  });

  it('handles null and empty values gracefully', () => {
    expect(formatChatTitle(null)).toBe('Untitled Chat');
    expect(formatChatTitle('')).toBe('Untitled Chat');
    expect(formatChatTitle('   ')).toBe('Untitled Chat');
  });
});
