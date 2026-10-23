import { z } from 'zod';
import { generateUserText, generateUserStructured } from '@/lib/ai/service';
import { aiConfig } from '@/lib/ai/config';
import { formatTaggedBlock } from '@/lib/ai/prompt';

export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: string | undefined;
}

export const ProfilerProposalZodSchema = z.object({
  role: z.string().min(2),
  industry: z.string().default('Technology'),
  expertise: z.array(z.string()).default([]),
  positioning: z.string().default(''),
  values: z.array(z.string()).default([]),
  topicsToAvoid: z.array(z.string()).default([]),
  toneRedLines: z.array(z.string()).default([]),
  targetAudience: z.string().default(''),
  expertiseLevel: z
    .enum(['beginner', 'intermediate', 'expert', 'general'])
    .default('general'),
  primaryObjective: z
    .enum(['authority', 'leads', 'hiring', 'community', 'sales'])
    .default('authority'),
  formality: z.number().int().min(1).max(5).default(3),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  emoji: z.enum(['none', 'minimal', 'frequent']).default('minimal'),
  hookStyle: z
    .enum(['bold_statement', 'question', 'story', 'statistic'])
    .default('bold_statement'),
  primaryLanguage: z.enum(['en', 'fr', 'ar']).default('en'),
  arabicDialect: z.enum(['none', 'msa', 'darija', 'both']).default('none'),
  platforms: z.array(z.string()).min(1).default(['linkedin']),
});

export type ProfilerProposal = z.infer<typeof ProfilerProposalZodSchema>;

/**
 * Conducts one conversational turn with the AI Profiler.
 */
export async function conductProfilerTurn(
  userId: string,
  history: ChatMessage[],
  latestUserAnswer: string,
  locale = 'en',
): Promise<{ nextQuestion: string; isComplete: boolean }> {
  const userTurns = history.filter((m) => m.role === 'user').length + 1;
  const isLastTurn = userTurns >= 10;

  const systemInstruction = `You are the Saouti Voice Profiler. You are conducting an onboarding interview with a professional to discover their unique voice, principles, audience, objectives, and style.
Language: Respond in ${locale === 'fr' ? 'French' : locale === 'ar' ? 'Arabic' : 'English'}.
Rules:
1. Ask exactly ONE question at a time. Never ask multiple questions in one turn.
2. If the user's latest answer is too brief, vague, or casual, ask a gentle clarifying follow-up before moving on.
3. Sequence of topics to cover:
   - Identity: Role, domain, and what they want to be known for
   - Principles: Core values, blacklisted topics, and tone red lines
   - Audience: Who reads them and their level
   - Objectives: Main goal (authority, leads, community)
   - Style: Formality, emoji usage, hook preferences
   - Platforms: Primary social platforms
4. Keep questions conversational, warm, concise, and professional.
5. If turn count is 10 or greater and all topics are touched upon, end with a brief concluding note letting the user know you have enough information to synthesize their profile.`;

  const historyFormatted = history
    .map((m) => `${m.role === 'assistant' ? 'Profiler' : 'User'}: ${m.content}`)
    .join('\n');

  const prompt = [
    systemInstruction,
    formatTaggedBlock('interview_history', historyFormatted),
    formatTaggedBlock('user_response', latestUserAnswer),
    `Current user turn: ${userTurns} of 10.`,
    isLastTurn
      ? 'Conclude the interview and state that you are synthesizing their voice profile proposal.'
      : 'Generate the next single question or targeted follow-up.',
  ].join('\n\n');

  const result = await generateUserText(userId, prompt, {
    model: aiConfig.models.writer,
    temperature: 0.6,
  });

  return {
    nextQuestion: result.text.trim(),
    isComplete: isLastTurn,
  };
}

/**
 * Synthesizes a structured Voice Profile proposal from the interview transcript.
 */
export async function synthesizeVoiceProfileProposal(
  userId: string,
  transcript: ChatMessage[],
  locale = 'en',
): Promise<ProfilerProposal> {
  const transcriptFormatted = transcript
    .map((m) => `${m.role === 'assistant' ? 'Profiler' : 'User'}: ${m.content}`)
    .join('\n');

  const prompt = [
    `You are the Saouti Persona Synthesizer. Review the interview transcript between the Saouti Profiler and the user, and synthesize a complete, structured voice profile.`,
    formatTaggedBlock('interview_transcript', transcriptFormatted),
    `Extract role, industry, expertise, positioning, values, topicsToAvoid, toneRedLines, targetAudience, expertiseLevel, primaryObjective, formality (1-5), length, emoji, hookStyle, primaryLanguage, arabicDialect, and platforms.`,
    `Default primaryLanguage to '${locale}'.`,
  ].join('\n\n');

  const result = await generateUserStructured<ProfilerProposal>(userId, prompt, {
    schema: ProfilerProposalZodSchema as unknown as z.ZodType<ProfilerProposal>,
    schemaName: 'VoiceProfileProposal',
    model: aiConfig.models.critic,
    temperature: 0.1,
  });

  return result.data;
}
