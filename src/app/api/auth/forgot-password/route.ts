import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { generateToken, hashToken, calculateExpiry } from '@/lib/auth/tokens';
import { emailService } from '@/lib/auth/email';
import { eq } from 'drizzle-orm';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    // Constant success response regardless of input validity
    const genericResponse = NextResponse.json({
      message:
        'If an account exists for this email, a recovery link has been sent.',
    });

    if (!result.success) return genericResponse;

    const normalizedEmail = result.data.email.trim().toLowerCase();

    const matchedUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (matchedUsers.length === 0) return genericResponse;

    const user = matchedUsers[0];
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = calculateExpiry(1); // 1 hour expiration

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${request.headers.get('origin') || 'http://localhost:3000'}/reset-password?token=${token}`;
    await emailService.sendEmail({
      to: user.email,
      subject: 'Reset your Saouti password',
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset for your Saouti account.</p><p><a href="${resetUrl}">Click here to reset your password</a> (valid for 1 hour).</p>`,
    });

    return genericResponse;
  } catch {
    return NextResponse.json({
      message:
        'If an account exists for this email, a recovery link has been sent.',
    });
  }
}
