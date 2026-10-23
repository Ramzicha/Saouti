import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users, verificationTokens } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { generateToken, hashToken, calculateExpiry } from '@/lib/auth/tokens';
import { emailService } from '@/lib/auth/email';
import { eq } from 'drizzle-orm';

const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(320),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      // Generic success notice to prevent email enumeration
      return NextResponse.json(
        {
          message:
            'If this email is not registered, a verification link has been sent.',
        },
        { status: 200 },
      );
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        emailVerified: false,
      })
      .returning({ id: users.id, email: users.email });

    // Generate 24h verification token
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = calculateExpiry(24);

    await db.insert(verificationTokens).values({
      userId: newUser.id,
      tokenHash,
      expiresAt,
    });

    // Dispatch verification email
    const verifyUrl = `${request.headers.get('origin') || 'http://localhost:3000'}/api/auth/verify?token=${token}`;
    await emailService.sendEmail({
      to: newUser.email,
      subject: 'Verify your Saouti account',
      text: `Welcome to Saouti! Click here to verify your account: ${verifyUrl}`,
      html: `<p>Welcome to Saouti!</p><p><a href="${verifyUrl}">Click here to verify your account</a> (valid for 24 hours).</p>`,
    });

    return NextResponse.json(
      {
        message:
          'Account created. Please check your email to verify your address.',
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred during signup.' },
      { status: 500 },
    );
  }
}
