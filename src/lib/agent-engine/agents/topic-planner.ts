import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateUserStructured } from '@/lib/ai/service';
import {
  TopicPlannerOutputSchema,
  type TopicPlannerOutput,
} from '@/lib/explore/schemas';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { escapeXmlEntities } from '../prompt-builder';
import { logger } from '@/lib/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TOPIC_PLANNER_PROMPT_VERSION = 'v1';

export function loadTopicPlannerPrompt(
  version = TOPIC_PLANNER_PROMPT_VERSION,
): string {
  try {
    const filePath = path.join(
      __dirname,
      '..',
      'prompts',
      `topic-planner.${version}.md`,
    );
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to read topic-planner prompt file, using fallback');
  }

  return `You are the Topic Planner agent for Saouti. Analyze the author's Voice Profile inside <profile_context> and propose 5 to 8 timely search topic phrases (2 to 6 words each) without personal names or confidential identifiers.`;
}

export function assembleTopicPlannerPrompt(params: {
  role?: string | undefined;
  industry?: string | undefined;
  expertise?: string[] | undefined;
  positioning?: string | undefined;
  persona?: string | undefined;
  primaryObjective?: string | undefined;
  promptVersion?: string | undefined;
}): string {
  const instructions = loadTopicPlannerPrompt(
    params.promptVersion || TOPIC_PLANNER_PROMPT_VERSION,
  );

  const roleText = escapeXmlEntities(params.role || 'Professional');
  const industryText = escapeXmlEntities(params.industry || 'Technology');
  const expertiseText = escapeXmlEntities(
    params.expertise?.join(', ') || 'Leadership, Innovation',
  );
  const positioningText = escapeXmlEntities(
    params.positioning || 'Industry practitioner',
  );
  const personaText = escapeXmlEntities(params.persona || 'Industry peers');
  const objectiveText = escapeXmlEntities(
    params.primaryObjective || 'Thought leadership',
  );

  return `${instructions}

# AUTHOR VOICE PROFILE CONTEXT

<profile_context>
  <role>${roleText}</role>
  <industry>${industryText}</industry>
  <expertise>${expertiseText}</expertise>
  <positioning>${positioningText}</positioning>
  <target_audience>${personaText}</target_audience>
  <primary_objective>${objectiveText}</primary_objective>
</profile_context>

Formulate 5 to 8 timely search topics directly matching this profile and output valid JSON conforming strictly to the requested schema.`;
}

/**
 * Runs the Topic Planner agent to generate 5-8 relevant search topics derived from the user's Voice Profile.
 */
export async function generateTopicsFromProfile(
  userId: string,
): Promise<TopicPlannerOutput> {
  // Retrieve user's profile
  const profileRecords = await db
    .select({
      identityData: profiles.identityData,
      audienceData: profiles.audienceData,
      objectivesData: profiles.objectivesData,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const profile = profileRecords[0];

  const role = profile?.identityData?.role || 'Professional';
  const industry = profile?.identityData?.industry || 'Technology';
  const expertise = profile?.identityData?.expertise || [];
  const positioning = profile?.identityData?.positioning || '';
  const persona = profile?.audienceData?.persona || '';
  const primaryObjective = profile?.objectivesData?.primaryObjective || '';

  const prompt = assembleTopicPlannerPrompt({
    role,
    industry,
    expertise,
    positioning,
    persona,
    primaryObjective,
  });

  try {
    const result = await generateUserStructured<TopicPlannerOutput>(
      userId,
      prompt,
      {
        schema: TopicPlannerOutputSchema,
        maxTokens: 800,
        temperature: 0.7,
      },
    );

    return result.data;
  } catch (err) {
    logger.warn(
      { err, userId },
      'AI topic generation failed or not configured; using deterministic profile fallbacks',
    );

    // Fallback: build 5 deterministic topics directly from profile keywords
    const fallbackTopics: TopicPlannerOutput['topics'] = [];

    if (expertise.length > 0) {
      for (const item of expertise.slice(0, 3)) {
        fallbackTopics.push({
          phrase: `${item} industry developments`,
          reason: `Matches your expertise in ${item}`,
        });
      }
    }

    fallbackTopics.push({
      phrase: `${industry} innovations and trends`,
      reason: `Matches your focus in the ${industry} industry`,
    });

    fallbackTopics.push({
      phrase: `${role} strategic leadership`,
      reason: `Matches your professional role as ${role}`,
    });

    if (fallbackTopics.length < 5) {
      fallbackTopics.push({
        phrase: 'Applied Artificial Intelligence in enterprise',
        reason: 'Broad industry interest in enterprise automation',
      });
      fallbackTopics.push({
        phrase: 'Modern asynchronous workflow leadership',
        reason: 'Executive thought-leadership trend',
      });
    }

    return { topics: fallbackTopics.slice(0, 8) };
  }
}
