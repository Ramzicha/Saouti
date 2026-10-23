import { describe, it, expect } from 'vitest';
import {
  generateToken,
  hashToken,
  calculateExpiry,
  isTokenExpired,
} from '@/lib/auth/tokens';

describe('Single-Use Token Utilities', () => {
  it('generates 64-character hex strings with 256 bits of entropy', () => {
    const token1 = generateToken();
    const token2 = generateToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('generates deterministic SHA-256 hashes of tokens', () => {
    const token =
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });

  it('correctly identifies expired vs non-expired tokens', () => {
    const past = new Date(Date.now() - 1000);
    const future = calculateExpiry(1);

    expect(isTokenExpired(past)).toBe(true);
    expect(isTokenExpired(future)).toBe(false);
  });
});
