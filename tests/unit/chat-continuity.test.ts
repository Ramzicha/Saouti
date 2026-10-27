import { describe, it, expect } from 'vitest';
import { assembleAgentPrompt } from '@/lib/agent-engine/prompt-builder';

describe('Chat Session Continuity & Multi-turn History (chat-continuity.test.ts)', () => {
  it('formats multi-turn conversation history into <conversation_history> block', () => {
    const prompt = assembleAgentPrompt({
      role: 'writer',
      profileSummary: 'Tech Founder Voice Profile',
      platforms: ['reddit'],
      brief: 'generate the same for reddit',
      sourceArticle: {
        title: "Google’s Genie 4 world model adds audio",
        sourceDomain: 'techcrunch.com',
        url: 'https://techcrunch.com/google-genie-4',
        summary: 'Genie 4 brings audio and real-time interactive steering.',
      },
      conversationHistory: [
        {
          topicBrief: 'Partagez une perspective authentique sur Google Genie 4',
          posts: [
            {
              platform: 'linkedin',
              text: 'We are witnessing a massive shift in how we prototype reality with Genie 4.',
            },
            {
              platform: 'x',
              text: 'Google Genie 4 is pushing world models toward real-time interactivity. #AI',
            },
          ],
        },
      ],
    });

    expect(prompt).toContain('<conversation_history>');
    expect(prompt).toContain('Turn 1:');
    expect(prompt).toContain('User Request: &quot;Partagez une perspective authentique sur Google Genie 4&quot;');
    expect(prompt).toContain('[Platform: LINKEDIN]');
    expect(prompt).toContain('We are witnessing a massive shift in how we prototype reality with Genie 4.');
    expect(prompt).toContain('[Platform: X]');
    expect(prompt).toContain('Google Genie 4 is pushing world models toward real-time interactivity.');
    expect(prompt).toContain('</conversation_history>');

    expect(prompt).toContain('<brief>');
    expect(prompt).toContain('generate the same for reddit');
    expect(prompt).toContain('</brief>');

    expect(prompt).toContain('<source_article>');
    expect(prompt).toContain('Title: Google’s Genie 4 world model adds audio');
    expect(prompt).toContain('</source_article>');
  });

  it('omits <conversation_history> tag when history is empty or not provided', () => {
    const prompt = assembleAgentPrompt({
      role: 'writer',
      profileSummary: 'Tech Founder Voice Profile',
      platforms: ['x'],
      brief: 'Standalone post request',
    });

    expect(prompt).not.toContain('<conversation_history>');
    expect(prompt).toContain('<brief>');
    expect(prompt).toContain('Standalone post request');
  });
});
