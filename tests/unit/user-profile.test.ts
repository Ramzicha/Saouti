import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email().max(320).optional(),
  avatarUrl: z.string().trim().max(2000).optional().nullable(),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

describe('User Profile & Password Validation (user-profile.test.ts)', () => {
  it('validates profile updates with valid name, email, and avatarUrl', () => {
    const input = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    };
    const result = updateProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email formats in profile update', () => {
    const input = {
      name: 'Jane Doe',
      email: 'not-an-email',
    };
    const result = updateProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('accepts null avatarUrl to clear avatar', () => {
    const input = {
      avatarUrl: null,
    };
    const result = updateProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('validates password change when new passwords match and meet min length', () => {
    const input = {
      currentPassword: 'oldSecretPassword123',
      newPassword: 'newSecretPassword456',
      confirmPassword: 'newSecretPassword456',
    };
    const result = updatePasswordSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects password change when new password is under 8 characters', () => {
    const input = {
      currentPassword: 'oldSecretPassword123',
      newPassword: 'short',
      confirmPassword: 'short',
    };
    const result = updatePasswordSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects password change when confirm password does not match', () => {
    const input = {
      currentPassword: 'oldSecretPassword123',
      newPassword: 'validPassword123',
      confirmPassword: 'differentPassword456',
    };
    const result = updatePasswordSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('correctly hashes and verifies passwords using Argon2id', async () => {
    const plain = 'StrongP@ssw0rd!';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, 'wrongPassword');
    expect(isInvalid).toBe(false);
  });
});
