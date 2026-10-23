import { describe, it, expect } from 'vitest';
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from '@/lib/crypto/key-encryption';

describe('AES-256-GCM Key Encryption (key-encryption.ts)', () => {
  const masterKey =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const sampleApiKey = 'AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU';

  it('correctly extracts and formats the last four characters for masking', () => {
    const masked = maskApiKey(sampleApiKey);
    expect(masked).toBe('••••••••••••••rStU');
    expect(masked.endsWith('rStU')).toBe(true);
  });

  it('masks short keys safely', () => {
    expect(maskApiKey('abcd')).toBe('••••••••••••••abcd');
    expect(maskApiKey('ab')).toBe('••••••••••••••ab');
  });

  it('encrypts an API key and produces valid hex ciphertext, nonce, and authTag', () => {
    const encrypted = encryptApiKey(sampleApiKey, masterKey);

    expect(encrypted.encryptedKey).toBeDefined();
    expect(encrypted.nonce).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.lastFour).toBe('rStU');

    // 12 bytes = 24 hex characters
    expect(encrypted.nonce).toHaveLength(24);
    // 16 bytes = 32 hex characters
    expect(encrypted.authTag).toHaveLength(32);
    // Ciphertext must not match or contain plaintext
    expect(encrypted.encryptedKey).not.toContain(sampleApiKey);
  });

  it('successfully decrypts encrypted payload back to original plaintext', () => {
    const encrypted = encryptApiKey(sampleApiKey, masterKey);
    const decrypted = decryptApiKey(encrypted, masterKey);

    expect(decrypted).toBe(sampleApiKey);
  });

  it('uses unique nonces so identical keys produce different ciphertexts', () => {
    const enc1 = encryptApiKey(sampleApiKey, masterKey);
    const enc2 = encryptApiKey(sampleApiKey, masterKey);

    expect(enc1.nonce).not.toBe(enc2.nonce);
    expect(enc1.encryptedKey).not.toBe(enc2.encryptedKey);
  });

  it('fails decryption with tamper error when ciphertext is modified', () => {
    const encrypted = encryptApiKey(sampleApiKey, masterKey);
    // Tamper with ciphertext
    const tamperedCiphertext =
      encrypted.encryptedKey.slice(0, -2) +
      (encrypted.encryptedKey.endsWith('0') ? '1' : '0');

    expect(() =>
      decryptApiKey(
        { ...encrypted, encryptedKey: tamperedCiphertext },
        masterKey,
      ),
    ).toThrow();
  });

  it('fails decryption with tamper error when authTag is modified', () => {
    const encrypted = encryptApiKey(sampleApiKey, masterKey);
    const tamperedAuthTag =
      encrypted.authTag.slice(0, -2) +
      (encrypted.authTag.slice(-2) === 'ff' ? '00' : 'ff');

    expect(() =>
      decryptApiKey({ ...encrypted, authTag: tamperedAuthTag }, masterKey),
    ).toThrow();
  });

  it('fails decryption when decrypted with wrong master key', () => {
    const encrypted = encryptApiKey(sampleApiKey, masterKey);
    const wrongKey =
      'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

    expect(() => decryptApiKey(encrypted, wrongKey)).toThrow();
  });
});
