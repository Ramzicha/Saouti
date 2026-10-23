import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { profiles, voiceSamples, platformPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile/draft
 * Retrieves user's active draft profile state, samples, and platform preferences.
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

    const draftRecords = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.userId, user.id)))
      .limit(1);

    const profile = draftRecords[0] || null;

    let samples: Array<{ id: string; title: string; content: string; orderIndex: number }> = [];
    let platforms: Array<{
      id: string;
      platform: string;
      primaryObjective: string;
      subreddits?: Array<{ name: string; rulesSummary?: string | undefined }> | null;
      customInstructions?: string | null;
    }> = [];

    if (profile) {
      const sampleRecords = await db
        .select({
          id: voiceSamples.id,
          title: voiceSamples.title,
          content: voiceSamples.content,
          orderIndex: voiceSamples.orderIndex,
        })
        .from(voiceSamples)
        .where(eq(voiceSamples.profileId, profile.id))
        .orderBy(voiceSamples.orderIndex);

      samples = sampleRecords;

      const platformRecords = await db
        .select({
          id: platformPreferences.id,
          platform: platformPreferences.platform,
          primaryObjective: platformPreferences.primaryObjective,
          subreddits: platformPreferences.subreddits,
          customInstructions: platformPreferences.customInstructions,
        })
        .from(platformPreferences)
        .where(eq(platformPreferences.profileId, profile.id));

      platforms = platformRecords;
    }

    const completeness = calculateProfileCompleteness({
      role: profile?.identityData?.role,
      identityData: profile?.identityData || undefined,
      principlesData: profile?.principlesData || undefined,
      audienceData: profile?.audienceData || undefined,
      objectivesData: profile?.objectivesData || undefined,
      styleData: profile?.styleData || undefined,
      samplesCount: samples.length,
      platformsCount: platforms.length,
      hasRedditRules: platforms.some(
        (p) => p.platform === 'reddit' && p.subreddits && p.subreddits.length > 0,
      ),
    });

    return NextResponse.json({
      hasDraft: Boolean(profile),
      profile,
      samples,
      platforms,
      completeness,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to fetch draft profile');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve profile draft' } },
      { status: 500 },
    );
  }
}
