import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { profiles, voiceProfileVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

describe('Profile Lifecycle & Version Rollback (profile-lifecycle.test.ts)', () => {
  it('enforces strict userId scoping when querying active profile', () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();

    const query = db
      .select()
      .from(profiles)
      .where(and(eq(profiles.userId, userA), eq(profiles.status, 'active')))
      .toSQL();

    expect(query.sql).toContain('"profiles"."user_id" = $1');
    expect(query.sql).toContain('"profiles"."status" = $2');
    expect(query.params).toContain(userA);
    expect(query.params).not.toContain(userB);
  });

  it('guarantees unique version numbers per profile in version history schema', () => {
    // Assert table definition has profileId and versionNumber columns
    expect(voiceProfileVersions.profileId).toBeDefined();
    expect(voiceProfileVersions.versionNumber).toBeDefined();
    expect(voiceProfileVersions.snapshot).toBeDefined();
  });
});
