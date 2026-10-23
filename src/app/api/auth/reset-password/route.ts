import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { hashToken, isTokenExpired } from '@/lib/auth/tokens';
import { revokeAllUserSessions } from '@/lib/auth/session';
import { eq, and, isNull } from 'drizzle-orm';

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }

    const { token, password } = result.data;
    const tokenHash = hashToken(token);

    const tokenRecords = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1);

    if (tokenRecords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or already used reset token.' },
        { status: 400 },
      );
    }

    const resetRecord = tokenRecords[0];

    if (isTokenExpired(resetRecord.expiresAt)) {
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    const newPasswordHash = await hashPassword(password);

    await db.transaction(async (tx) => {
      // Mark token as redeemed
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      // Update password hash
      await tx
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, resetRecord.userId));
    });

    // Invalidate all active sessions for this user across all devices
    await revokeAllUserSessions(resetRecord.userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 },
    );
  }
}
