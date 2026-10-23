import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import {
  profiles,
  platformPreferences,
  voiceProfileVersions,
  profilerSessions,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfilerProposalZodSchema } from '@/lib/profile/profiler-agent';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';
import { logger } from '@/lib/logger';

/**
 * POST /api/profile/profiler/confirm
 * Commits the AI Profiler proposal as the user's active Voice Profile.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parseResult = ProfilerProposalZodSchema.safeParse(body.proposal);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid proposal data',
          },
        },
        { status: 400 },
      );
    }

    const proposal = parseResult.data;

    // Check or insert profile
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    let profileId: string;

    const completeness = calculateProfileCompleteness({
      role: proposal.role,
      identityData: {
        role: proposal.role,
        industry: proposal.industry,
        expertise: proposal.expertise,
        positioning: proposal.positioning,
      },
      principlesData: {
        values: proposal.values,
        topicsToAvoid: proposal.topicsToAvoid,
        toneRedLines: proposal.toneRedLines,
      },
      audienceData: {
        persona: proposal.targetAudience,
        expertiseLevel: proposal.expertiseLevel,
      },
      objectivesData: {
        primaryObjective: proposal.primaryObjective,
      },
      styleData: {
        formality: proposal.formality,
        length: proposal.length,
        emoji: proposal.emoji,
        hookStyle: proposal.hookStyle,
      },
      platformsCount: proposal.platforms.length,
    });

    if (!existing[0]) {
      const inserted = await db
        .insert(profiles)
        .values({
          userId: user.id,
          status: 'active',
          currentStep: 7,
          currentVersion: 1,
          primaryLanguage: proposal.primaryLanguage,
          arabicDialect: proposal.arabicDialect,
          identityData: {
            role: proposal.role,
            industry: proposal.industry,
            expertise: proposal.expertise,
            positioning: proposal.positioning,
          },
          principlesData: {
            values: proposal.values,
            topicsToAvoid: proposal.topicsToAvoid,
            toneRedLines: proposal.toneRedLines,
          },
          audienceData: {
            persona: proposal.targetAudience,
            expertiseLevel: proposal.expertiseLevel,
          },
          objectivesData: {
            primaryObjective: proposal.primaryObjective,
          },
          styleData: {
            formality: proposal.formality,
            length: proposal.length,
            emoji: proposal.emoji,
            hookStyle: proposal.hookStyle,
          },
          completenessScore: completeness.score,
        })
        .returning({ id: profiles.id });

      profileId = inserted[0]!.id;
    } else {
      profileId = existing[0].id;
      await db
        .update(profiles)
        .set({
          status: 'active',
          currentStep: 7,
          currentVersion: 1,
          primaryLanguage: proposal.primaryLanguage,
          arabicDialect: proposal.arabicDialect,
          identityData: {
            role: proposal.role,
            industry: proposal.industry,
            expertise: proposal.expertise,
            positioning: proposal.positioning,
          },
          principlesData: {
            values: proposal.values,
            topicsToAvoid: proposal.topicsToAvoid,
            toneRedLines: proposal.toneRedLines,
          },
          audienceData: {
            persona: proposal.targetAudience,
            expertiseLevel: proposal.expertiseLevel,
          },
          objectivesData: {
            primaryObjective: proposal.primaryObjective,
          },
          styleData: {
            formality: proposal.formality,
            length: proposal.length,
            emoji: proposal.emoji,
            hookStyle: proposal.hookStyle,
          },
          completenessScore: completeness.score,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profileId));
    }

    // Insert platforms
    await db
      .delete(platformPreferences)
      .where(eq(platformPreferences.profileId, profileId));

    if (proposal.platforms.length > 0) {
      await db.insert(platformPreferences).values(
        proposal.platforms.map((p) => ({
          profileId,
          platform: p,
          primaryObjective: proposal.primaryObjective,
        })),
      );
    }

    // Create initial Version 1 snapshot
    const snapshotData = {
      identity: {
        role: proposal.role,
        industry: proposal.industry,
        expertise: proposal.expertise,
        positioning: proposal.positioning,
      },
      principles: {
        values: proposal.values,
        topicsToAvoid: proposal.topicsToAvoid,
        toneRedLines: proposal.toneRedLines,
      },
      audience: {
        persona: proposal.targetAudience,
        expertiseLevel: proposal.expertiseLevel,
      },
      objectives: {
        primaryObjective: proposal.primaryObjective,
      },
      style: {
        formality: proposal.formality,
        length: proposal.length,
        emoji: proposal.emoji,
        hookStyle: proposal.hookStyle,
      },
      languages: {
        primary: proposal.primaryLanguage,
        arabicDialect: proposal.arabicDialect,
      },
      samples: [],
      platforms: proposal.platforms.map((p) => ({
        platform: p,
        primaryObjective: proposal.primaryObjective,
      })),
    };

    await db
      .delete(voiceProfileVersions)
      .where(eq(voiceProfileVersions.profileId, profileId));

    await db.insert(voiceProfileVersions).values({
      profileId,
      versionNumber: 1,
      snapshot: snapshotData,
      changeSummary: 'Created via AI Profiler interview synthesis',
    });

    // Mark profiler session completed
    await db
      .update(profilerSessions)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(profilerSessions.userId, user.id));

    return NextResponse.json({
      success: true,
      profileId,
      status: 'active',
      completeness,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to confirm AI profiler proposal');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm profile' } },
      { status: 500 },
    );
  }
}
