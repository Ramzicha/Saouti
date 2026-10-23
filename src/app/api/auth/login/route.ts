import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '@/lib/auth/rate-limit';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit check: max 5 attempts per 15 min per email
    const emailLimiter = await checkRateLimit(
      `email:${normalizedEmail}`,
      5,
      900,
    );
    if (!emailLimiter.allowed) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (matchedUsers.length === 0) {
      await recordFailedAttempt(`email:${normalizedEmail}`, 900);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const user = matchedUsers[0];
    const passwordMatch = await verifyPassword(user.passwordHash, password);

    if (!passwordMatch) {
      await recordFailedAttempt(`email:${normalizedEmail}`, 900);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Require email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Please verify your email address before logging in.',
          unverified: true,
        },
        { status: 403 },
      );
    }

    // Reset rate limit and issue session
    await resetRateLimit(`email:${normalizedEmail}`);
    await createSession(user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 },
    );
  }
}
