import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { profiles, voiceSamples, platformPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SaveStepDraftSchema } from '@/lib/profile/schemas';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';
import { logger } from '@/lib/logger';

/**
 * POST /api/profile/draft/step
 * Saves progress for a specific step in the guided onboarding flow.
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
    const parseResult = SaveStepDraftSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid draft payload',
          },
        },
        { status: 400 },
      );
    }

    const {
      step,
      identity,
      principles,
      audience,
      objectives,
      style,
      languages,
      samples,
      platforms,
    } = parseResult.data;

    // Find existing profile or create one
    const existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    let profileId: string;
    const existing = existingProfiles[0];

    if (!existing) {
      const inserted = await db
        .insert(profiles)
        .values({
          userId: user.id,
          status: 'draft',
          currentStep: step,
          primaryLanguage: languages?.primaryLanguage || 'en',
          arabicDialect: languages?.arabicDialect || 'none',
          ...(identity?.role !== undefined ? { identityData: { role: identity.role } } : {}),
        })
        .returning({ id: profiles.id });

      profileId = inserted[0]!.id;
    } else {
      profileId = existing.id;
      const nextStep = Math.max(existing.currentStep, step);

      const updateValues: Partial<typeof profiles.$inferInsert> = {
        currentStep: nextStep,
        updatedAt: new Date(),
      };

      if (identity) {
        updateValues.identityData = {
          role: identity.role || existing.identityData?.role || 'Professional',
          industry: identity.industry ?? existing.identityData?.industry,
          expertise: identity.expertise ?? existing.identityData?.expertise,
          positioning: identity.positioning ?? existing.identityData?.positioning,
        };
      }
      if (principles) {
        updateValues.principlesData = {
          values: principles.values ?? existing.principlesData?.values,
          topicsToAvoid: principles.topicsToAvoid ?? existing.principlesData?.topicsToAvoid,
          toneRedLines: principles.toneRedLines ?? existing.principlesData?.toneRedLines,
        };
      }
      if (audience) {
        updateValues.audienceData = {
          persona: audience.persona ?? existing.audienceData?.persona,
          expertiseLevel: audience.expertiseLevel ?? existing.audienceData?.expertiseLevel,
          interests: audience.interests ?? existing.audienceData?.interests,
        };
      }
      if (objectives) {
        updateValues.objectivesData = {
          primaryObjective: objectives.primaryObjective ?? existing.objectivesData?.primaryObjective,
          platformRankings: objectives.platformRankings ?? existing.objectivesData?.platformRankings,
        };
      }
      if (style) {
        updateValues.styleData = {
          formality: style.formality ?? existing.styleData?.formality,
          length: style.length ?? existing.styleData?.length,
          emoji: style.emoji ?? existing.styleData?.emoji,
          hookStyle: style.hookStyle ?? existing.styleData?.hookStyle,
        };
      }
      if (languages?.primaryLanguage) {
        updateValues.primaryLanguage = languages.primaryLanguage;
      }
      if (languages?.arabicDialect) {
        updateValues.arabicDialect = languages.arabicDialect;
      }

      await db
        .update(profiles)
        .set(updateValues)
        .where(eq(profiles.id, profileId));
    }

    // Upsert samples if provided on Step 6
    if (samples) {
      await db.delete(voiceSamples).where(eq(voiceSamples.profileId, profileId));
      if (samples.length > 0) {
        await db.insert(voiceSamples).values(
          samples.map((s, idx) => ({
            profileId,
            title: s.title || `Voice Sample ${idx + 1}`,
            content: s.content,
            orderIndex: idx,
          })),
        );
      }
    }

    // Upsert platforms if provided on Step 7
    if (platforms) {
      await db
        .delete(platformPreferences)
        .where(eq(platformPreferences.profileId, profileId));
      if (platforms.length > 0) {
        await db.insert(platformPreferences).values(
          platforms.map((p) => ({
            profileId,
            platform: p.platform,
            primaryObjective: p.primaryObjective || 'authority',
            subreddits: p.subreddits,
            customInstructions: p.customInstructions,
          })),
        );
      }
    }

    const completeness = calculateProfileCompleteness({
      role: identity?.role || existing?.identityData?.role,
      identityData: identity || existing?.identityData || undefined,
      principlesData: principles || existing?.principlesData || undefined,
      audienceData: audience || existing?.audienceData || undefined,
      objectivesData: objectives || existing?.objectivesData || undefined,
      styleData: style || existing?.styleData || undefined,
      samplesCount: samples?.length,
      platformsCount: platforms?.length,
    });

    await db
      .update(profiles)
      .set({ completenessScore: completeness.score })
      .where(eq(profiles.id, profileId));

    return NextResponse.json({
      success: true,
      profileId,
      step,
      completeness,
    });
  } catch (err: unknown) {
    logger.error({ err }, 'Failed to save draft step');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save step progress' } },
      { status: 500 },
    );
  }
}
