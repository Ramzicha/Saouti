import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/auth/me
 * Returns the currently authenticated user with their profile details and derived display name.
 */
export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const profile = userProfiles[0] || null;

    // Use user.name if set, or derive from email prefix (e.g. "ramzi@saouti.local" -> "Ramzi")
    const emailPrefix = user.email.split('@')[0];
    const derivedName = emailPrefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ') || 'User';

    const displayName = user.name || derivedName;

    // Capitalize role from profile if present
    const rawRole = profile?.identityData?.role;
    const formattedRole = rawRole
      ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1)
      : 'Creator';

    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: displayName,
        avatarUrl: user.avatarUrl || null,
        role: formattedRole,
        industry: profile?.identityData?.industry || null,
        initials,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch current user' },
      { status: 500 },
    );
  }
}
