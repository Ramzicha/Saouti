import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token (256-bit entropy).
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes the SHA-256 hash of a token for secure database persistence.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculates token expiry date.
 */
export function calculateExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Validates whether a token has expired.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}
