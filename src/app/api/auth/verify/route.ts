import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users, verificationTokens } from '@/lib/db/schema';
import { hashToken, isTokenExpired } from '@/lib/auth/tokens';
import { createSession } from '@/lib/auth/session';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/verify-email?error=missing`);
  }

  const tokenHash = hashToken(token);

  // Look up unredeemed token
  const records = await db
    .select({
      token: verificationTokens,
      user: users,
    })
    .from(verificationTokens)
    .innerJoin(users, eq(verificationTokens.userId, users.id))
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        isNull(verificationTokens.usedAt),
      ),
    )
    .limit(1);

  if (records.length === 0) {
    return NextResponse.redirect(`${origin}/verify-email?error=invalid`);
  }

  const { token: tokenRecord, user } = records[0];

  // Check 24-hour expiration
  if (isTokenExpired(tokenRecord.expiresAt)) {
    return NextResponse.redirect(`${origin}/verify-email?error=expired`);
  }

  // Mark token as used and user as verified
  await db.transaction(async (tx) => {
    await tx
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokens.id, tokenRecord.id));

    await tx
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  });

  // Automatically establish session upon verification
  await createSession(user.id);

  return NextResponse.redirect(`${origin}/`);
}
