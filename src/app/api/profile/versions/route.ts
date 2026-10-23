import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { profiles, voiceProfileVersions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile/versions
 * Returns the version audit history for the authenticated user's profile.
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
      .select({ id: profiles.id, currentVersion: profiles.currentVersion })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const profile = profileRecords[0];
    if (!profile) {
      return NextResponse.json({ versions: [] });
    }

    const versions = await db
      .select({
        id: voiceProfileVersions.id,
        versionNumber: voiceProfileVersions.versionNumber,
        changeSummary: voiceProfileVersions.changeSummary,
        createdAt: voiceProfileVersions.createdAt,
      })
      .from(voiceProfileVersions)
      .where(eq(voiceProfileVersions.profileId, profile.id))
      .orderBy(desc(voiceProfileVersions.versionNumber));

    return NextResponse.json({
      currentVersion: profile.currentVersion,
      versions,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to fetch profile versions');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve version history' } },
      { status: 500 },
    );
  }
}
