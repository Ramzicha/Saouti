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
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ versionNumber: string }>;
}

/**
 * POST /api/profile/versions/[versionNumber]/rollback
 * Restores a past profile snapshot as the new active version.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const { versionNumber: versionStr } = await context.params;
    const targetVersion = parseInt(versionStr, 10);
    if (isNaN(targetVersion)) {
      return NextResponse.json(
        { error: { code: 'INVALID_VERSION', message: 'Invalid version number' } },
        { status: 400 },
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
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 },
      );
    }

    // Find requested snapshot
    const versionRecords = await db
      .select()
      .from(voiceProfileVersions)
      .where(
        and(
          eq(voiceProfileVersions.profileId, profile.id),
          eq(voiceProfileVersions.versionNumber, targetVersion),
        ),
      )
      .limit(1);

    const target = versionRecords[0];
    if (!target) {
      return NextResponse.json(
        { error: { code: 'VERSION_NOT_FOUND', message: 'Version snapshot not found' } },
        { status: 404 },
      );
    }

    interface SnapshotData {
      identity?: typeof profiles.$inferSelect.identityData;
      principles?: typeof profiles.$inferSelect.principlesData;
      audience?: typeof profiles.$inferSelect.audienceData;
      objectives?: typeof profiles.$inferSelect.objectivesData;
      style?: typeof profiles.$inferSelect.styleData;
      languages?: { primary?: string; arabicDialect?: string };
      samples?: Array<{ title?: string; content: string }>;
      platforms?: Array<{
        platform: string;
        primaryObjective?: string;
        subreddits?: Array<{ name: string; rulesSummary?: string | undefined }>;
        customInstructions?: string;
      }>;
    }

    const snapshot = target.snapshot as unknown as SnapshotData;
    const newVersion = profile.currentVersion + 1;

    // Apply snapshot to profile
    await db
      .update(profiles)
      .set({
        identityData: snapshot.identity,
        principlesData: snapshot.principles,
        audienceData: snapshot.audience,
        objectivesData: snapshot.objectives,
        styleData: snapshot.style,
        primaryLanguage: snapshot.languages?.primary || profile.primaryLanguage,
        arabicDialect: snapshot.languages?.arabicDialect || profile.arabicDialect,
        currentVersion: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    // Restore samples
    await db.delete(voiceSamples).where(eq(voiceSamples.profileId, profile.id));
    if (snapshot.samples && Array.isArray(snapshot.samples)) {
      if (snapshot.samples.length > 0) {
        await db.insert(voiceSamples).values(
          snapshot.samples.map((s, idx) => ({
            profileId: profile.id,
            title: s.title || `Sample ${idx + 1}`,
            content: s.content,
            orderIndex: idx,
          })),
        );
      }
    }

    // Restore platforms
    await db
      .delete(platformPreferences)
      .where(eq(platformPreferences.profileId, profile.id));
    if (snapshot.platforms && Array.isArray(snapshot.platforms)) {
      if (snapshot.platforms.length > 0) {
        await db.insert(platformPreferences).values(
          snapshot.platforms.map((p) => ({
            profileId: profile.id,
            platform: p.platform,
            primaryObjective: p.primaryObjective || 'authority',
            subreddits: p.subreddits,
            customInstructions: p.customInstructions,
          })),
        );
      }
    }

    // Record new rollback version snapshot
    await db.insert(voiceProfileVersions).values({
      profileId: profile.id,
      versionNumber: newVersion,
      snapshot: snapshot as unknown as Record<string, unknown>,
      changeSummary: `Rolled back to Version ${targetVersion}`,
    });

    return NextResponse.json({
      success: true,
      activeVersion: newVersion,
      rolledBackFrom: targetVersion,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to rollback profile version');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to rollback version' } },
      { status: 500 },
    );
  }
}
