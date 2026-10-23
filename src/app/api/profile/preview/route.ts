import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { profiles, voiceSamples, platformPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildVoiceProfileSummary } from '@/lib/profile/summary-builder';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile/preview
 * Returns the exact <voice_profile> prompt context markdown injected into autonomous agents.
 */
export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const profileRecords = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const profile = profileRecords[0];
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'No voice profile found' } },
        { status: 404 },
      );
    }

    const sampleRecords = await db
      .select({
        title: voiceSamples.title,
        content: voiceSamples.content,
        orderIndex: voiceSamples.orderIndex,
      })
      .from(voiceSamples)
      .where(eq(voiceSamples.profileId, profile.id))
      .orderBy(voiceSamples.orderIndex);

    const platformRecords = await db
      .select({
        platform: platformPreferences.platform,
        primaryObjective: platformPreferences.primaryObjective,
        subreddits: platformPreferences.subreddits,
        customInstructions: platformPreferences.customInstructions,
      })
      .from(platformPreferences)
      .where(eq(platformPreferences.profileId, profile.id));

    const summaryMarkdown = buildVoiceProfileSummary(
      profile,
      sampleRecords,
      platformRecords.map((p) => ({
        platform: p.platform,
        primaryObjective: p.primaryObjective,
        subreddits: p.subreddits || undefined,
        customInstructions: p.customInstructions || undefined,
      })),
      '1.0',
    );

    return NextResponse.json({
      summaryMarkdown,
      version: '1.0',
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to generate agent prompt preview');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate preview' } },
      { status: 500 },
    );
  }
}
