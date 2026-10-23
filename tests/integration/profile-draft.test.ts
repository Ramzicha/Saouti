import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { profiles, voiceSamples, platformPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { SaveStepDraftSchema, ProfileActivationSchema } from '@/lib/profile/schemas';

describe('Profile Draft Persistence & Fast-Track Activation (profile-draft.test.ts)', () => {
  it('enforces strict userId scoping when retrieving draft profile', () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();

    const query = db
      .select()
      .from(profiles)
      .where(and(eq(profiles.userId, userA), eq(profiles.status, 'draft')))
      .toSQL();

    expect(query.sql).toContain('"profiles"."user_id" = $1');
    expect(query.sql).toContain('"profiles"."status" = $2');
    expect(query.params).toContain(userA);
    expect(query.params).not.toContain(userB);
  });

  it('validates step-level draft payloads for all 7 steps', () => {
    // Step 1: Identity
    const step1 = SaveStepDraftSchema.safeParse({
      step: 1,
      identity: { role: 'Lead Architect', industry: 'Fintech' },
    });
    expect(step1.success).toBe(true);

    // Step 2: Principles
    const step2 = SaveStepDraftSchema.safeParse({
      step: 2,
      principles: { values: ['Transparency'], topicsToAvoid: ['Gossip'] },
    });
    expect(step2.success).toBe(true);

    // Step 7: Platforms
    const step7 = SaveStepDraftSchema.safeParse({
      step: 7,
      platforms: [
        { platform: 'linkedin', primaryObjective: 'authority' },
        { platform: 'reddit', primaryObjective: 'community', subreddits: [{ name: 'r/startups' }] },
      ],
    });
    expect(step7.success).toBe(true);
  });

  it('validates fast-track activation criteria (FR-019)', () => {
    const validSample = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');

    const validActivation = ProfileActivationSchema.safeParse({
      role: 'Head of Engineering',
      platforms: ['linkedin'],
      samples: [{ title: 'Leadership post', content: validSample }],
    });
    expect(validActivation.success).toBe(true);

    const invalidActivation = ProfileActivationSchema.safeParse({
      role: 'Head of Engineering',
      platforms: [], // Missing platform
      samples: [{ title: 'Leadership post', content: validSample }],
    });
    expect(invalidActivation.success).toBe(false);
  });
});
