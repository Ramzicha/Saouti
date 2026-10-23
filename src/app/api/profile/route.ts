import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  profiles,
  voiceSamples,
  platformPreferences,
  voiceProfileVersions,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile
 * Returns the authenticated user's active profile and related entities.
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
      .where(and(eq(profiles.userId, user.id)))
      .limit(1);

    const profile = profileRecords[0] || null;

    let samples: Array<{ id: string; title: string; content: string; orderIndex: number }> = [];
    let platforms: Array<{
      id: string;
      platform: string;
      primaryObjective: string;
      subreddits?: Array<{ name: string; rulesSummary?: string | undefined }> | null;
      customInstructions?: string | null;
    }> = [];

    if (profile) {
      samples = await db
        .select({
          id: voiceSamples.id,
          title: voiceSamples.title,
          content: voiceSamples.content,
          orderIndex: voiceSamples.orderIndex,
        })
        .from(voiceSamples)
        .where(eq(voiceSamples.profileId, profile.id))
        .orderBy(voiceSamples.orderIndex);

      platforms = await db
        .select({
          id: platformPreferences.id,
          platform: platformPreferences.platform,
          primaryObjective: platformPreferences.primaryObjective,
          subreddits: platformPreferences.subreddits,
          customInstructions: platformPreferences.customInstructions,
        })
        .from(platformPreferences)
        .where(eq(platformPreferences.profileId, profile.id));
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
      profile,
      samples,
      platforms,
      completeness,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to fetch profile');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve profile' } },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/profile
 * Updates the user's active profile, increments version number, and stores immutable snapshot.
 */
export async function PUT(request: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      identity,
      principles,
      audience,
      objectives,
      style,
      languages,
      samples,
      platforms,
      changeSummary,
    } = body;

    const existingRecords = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const existing = existingRecords[0];
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 },
      );
    }

    const nextVersion = existing.currentVersion + 1;

    // Update profile
    await db
      .update(profiles)
      .set({
        identityData: identity || existing.identityData,
        principlesData: principles || existing.principlesData,
        audienceData: audience || existing.audienceData,
        objectivesData: objectives || existing.objectivesData,
        styleData: style || existing.styleData,
        primaryLanguage: languages?.primaryLanguage || existing.primaryLanguage,
        arabicDialect: languages?.arabicDialect || existing.arabicDialect,
        currentVersion: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existing.id));

    // Update samples if provided
    if (samples && Array.isArray(samples)) {
      await db.delete(voiceSamples).where(eq(voiceSamples.profileId, existing.id));
      if (samples.length > 0) {
        await db.insert(voiceSamples).values(
          samples.map((s, idx) => ({
            profileId: existing.id,
            title: s.title || `Sample ${idx + 1}`,
            content: s.content,
            orderIndex: idx,
          })),
        );
      }
    }

    // Update platforms if provided
    if (platforms && Array.isArray(platforms)) {
      await db
        .delete(platformPreferences)
        .where(eq(platformPreferences.profileId, existing.id));
      if (platforms.length > 0) {
        await db.insert(platformPreferences).values(
          platforms.map((p) => ({
            profileId: existing.id,
            platform: p.platform,
            primaryObjective: p.primaryObjective || 'authority',
            subreddits: p.subreddits,
            customInstructions: p.customInstructions,
          })),
        );
      }
    }

    // Fetch latest samples & platforms for snapshot
    const updatedSamples = await db
      .select()
      .from(voiceSamples)
      .where(eq(voiceSamples.profileId, existing.id));

    const updatedPlatforms = await db
      .select()
      .from(platformPreferences)
      .where(eq(platformPreferences.profileId, existing.id));

    // Save snapshot in voiceProfileVersions
    const snapshotData = {
      identity: identity || existing.identityData,
      principles: principles || existing.principlesData,
      audience: audience || existing.audienceData,
      objectives: objectives || existing.objectivesData,
      style: style || existing.styleData,
      languages: {
        primary: languages?.primaryLanguage || existing.primaryLanguage,
        arabicDialect: languages?.arabicDialect || existing.arabicDialect,
      },
      samples: updatedSamples,
      platforms: updatedPlatforms,
    };

    await db.insert(voiceProfileVersions).values({
      profileId: existing.id,
      versionNumber: nextVersion,
      snapshot: snapshotData,
      changeSummary: changeSummary || `Updated profile to Version ${nextVersion}`,
    });

    const completeness = calculateProfileCompleteness({
      role: identity?.role || existing.identityData?.role,
      identityData: identity || existing.identityData || undefined,
      principlesData: principles || existing.principlesData || undefined,
      audienceData: audience || existing.audienceData || undefined,
      objectivesData: objectives || existing.objectivesData || undefined,
      styleData: style || existing.styleData || undefined,
      samplesCount: updatedSamples.length,
      platformsCount: updatedPlatforms.length,
      hasRedditRules: updatedPlatforms.some(
        (p) => p.platform === 'reddit' && p.subreddits && p.subreddits.length > 0,
      ),
    });

    await db
      .update(profiles)
      .set({ completenessScore: completeness.score })
      .where(eq(profiles.id, existing.id));

    return NextResponse.json({
      success: true,
      currentVersion: nextVersion,
      completeness,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to update profile');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 },
    );
  }
}
