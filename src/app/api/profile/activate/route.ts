import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  profiles,
  voiceSamples,
  platformPreferences,
  voiceProfileVersions,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileActivationSchema } from '@/lib/profile/schemas';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';
import { logger } from '@/lib/logger';

/**
 * POST /api/profile/activate
 * Validates mandatory fast-track onboarding requirements, transitions profile to 'active',
 * and creates initial Version 1 snapshot.
 */
export async function POST() {
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
        { error: { code: 'PROFILE_NOT_FOUND', message: 'No draft profile found to activate' } },
        { status: 404 },
      );
    }

    const sampleRecords = await db
      .select({
        id: voiceSamples.id,
        title: voiceSamples.title,
        content: voiceSamples.content,
        orderIndex: voiceSamples.orderIndex,
      })
      .from(voiceSamples)
      .where(eq(voiceSamples.profileId, profile.id));

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

    // Validate fast-track activation criteria
    const validation = ProfileActivationSchema.safeParse({
      role: profile.identityData?.role || '',
      platforms: platformRecords.map((p) => p.platform),
      samples: sampleRecords.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        orderIndex: s.orderIndex,
      })),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'ACTIVATION_CRITERIA_UNMET',
            message:
              validation.error.issues[0]?.message ||
              'Role, at least 1 platform, and at least 1 voice sample (50-1,000 words) are required to activate.',
          },
        },
        { status: 400 },
      );
    }

    // Calculate completeness
    const completeness = calculateProfileCompleteness({
      role: profile.identityData?.role,
      identityData: profile.identityData || undefined,
      principlesData: profile.principlesData || undefined,
      audienceData: profile.audienceData || undefined,
      objectivesData: profile.objectivesData || undefined,
      styleData: profile.styleData || undefined,
      samplesCount: sampleRecords.length,
      platformsCount: platformRecords.length,
      hasRedditRules: platformRecords.some(
        (p) => p.platform === 'reddit' && p.subreddits && p.subreddits.length > 0,
      ),
    });

    // Update profile to active status and set currentVersion = 1
    await db
      .update(profiles)
      .set({
        status: 'active',
        currentVersion: 1,
        completenessScore: completeness.score,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    // Create initial Version 1 snapshot
    const snapshotData = {
      identity: profile.identityData,
      principles: profile.principlesData,
      audience: profile.audienceData,
      objectives: profile.objectivesData,
      style: profile.styleData,
      languages: {
        primary: profile.primaryLanguage,
        arabicDialect: profile.arabicDialect,
      },
      samples: sampleRecords,
      platforms: platformRecords,
    };

    // Remove any existing v1 snapshot before inserting
    await db
      .delete(voiceProfileVersions)
      .where(eq(voiceProfileVersions.profileId, profile.id));

    await db.insert(voiceProfileVersions).values({
      profileId: profile.id,
      versionNumber: 1,
      snapshot: snapshotData,
      changeSummary: 'Initial activation from onboarding',
    });

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      status: 'active',
      completeness,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to activate voice profile');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to activate profile' } },
      { status: 500 },
    );
  }
}
