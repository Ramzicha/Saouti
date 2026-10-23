import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { sessions, users, type User } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateToken, hashToken, calculateExpiry } from './tokens';

export const SESSION_COOKIE_NAME = 'saouti-session';
export const SESSION_MAX_AGE_DAYS = 14;

export interface SessionValidationResult {
  session: { id: string; userId: string; expiresAt: Date } | null;
  user: User | null;
}

/**
 * Creates a new session in the database and sets the HTTP-only cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const sessionId = hashToken(token);
  const expiresAt = calculateExpiry(SESSION_MAX_AGE_DAYS * 24);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_MAX_AGE_DAYS,
  });

  return token;
}

/**
 * Validates the current session token from cookies.
 */
export async function validateCurrentSession(): Promise<SessionValidationResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return { session: null, user: null };
  }

  const sessionId = hashToken(token);
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    return { session: null, user: null };
  }

  const { session, user } = result[0];

  // If expired, clean up
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return { session: null, user: null };
  }

  return { session, user };
}

/**
 * Invalidates the current session and clears the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const sessionId = hashToken(token);
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Invalidates all active sessions for a user (used after password reset).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
