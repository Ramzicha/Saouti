import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email().max(320).optional(),
  avatarUrl: z.string().trim().max(2000).optional().nullable(),
});

/**
 * GET /api/user/profile
 * Returns the currently authenticated user's account profile details.
 */
export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        avatarUrl: user.avatarUrl ?? null,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/user/profile
 * Updates name, email, or avatarUrl.
 */
export async function PATCH(req: Request) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { name, email, avatarUrl } = parseResult.data;
    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateValues.name = name ? name.trim() : null;
    }

    if (avatarUrl !== undefined) {
      updateValues.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const normalizedEmail = email.toLowerCase();
      // Check if email already taken by another user
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, normalizedEmail), ne(users.id, user.id)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'This email is already in use by another account' },
          { status: 409 },
        );
      }

      updateValues.email = normalizedEmail;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        emailVerified: users.emailVerified,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 },
    );
  }
}
