import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Security (Argon2id)', () => {
  it('hashes a password and verifies correct password successfully', async () => {
    const rawPassword = 'AStrongSecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isValid = await verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword123');
    const isValid = await verifyPassword(hash, 'WrongPassword456');
    expect(isValid).toBe(false);
  });

  it('produces different hashes for the same password due to random salting', async () => {
    const password = 'SamePasswordRepeated';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(hash1, password)).toBe(true);
    expect(await verifyPassword(hash2, password)).toBe(true);
  });
});
