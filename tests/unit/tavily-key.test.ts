import { describe, it, expect } from 'vitest';
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from '@/lib/crypto/key-encryption';
import { TavilyKeyInputSchema } from '@/lib/explore/schemas';

describe('Tavily Key Encryption & Validation', () => {
  const TEST_MASTER_KEY =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('validates proper Tavily key formats', () => {
    const validKeys = [
      'tvly-1234567890abcdef',
      'tvly-prod_alpha_beta-999',
      'tvly-TESTKEY123456789',
    ];

    for (const key of validKeys) {
      const res = TavilyKeyInputSchema.safeParse({ apiKey: key });
      expect(res.success).toBe(true);
    }
  });

  it('rejects invalid Tavily key prefixes and lengths', () => {
    const invalidKeys = [
      'sk-1234567890abcdef',
      'gemini-key-12345',
      'tvly-',
      '',
      '   ',
    ];

    for (const key of invalidKeys) {
      const res = TavilyKeyInputSchema.safeParse({ apiKey: key });
      expect(res.success).toBe(false);
    }
  });

  it('encrypts and decrypts Tavily key with AES-256-GCM', () => {
    const plaintext = 'tvly-secret_tavily_api_token_1234';
    const encrypted = encryptApiKey(plaintext, TEST_MASTER_KEY);

    expect(encrypted.encryptedKey).toBeDefined();
    expect(encrypted.nonce).toHaveLength(24); // 12 bytes in hex
    expect(encrypted.authTag).toHaveLength(32); // 16 bytes in hex
    expect(encrypted.lastFour).toBe('1234');

    const decrypted = decryptApiKey(
      {
        encryptedKey: encrypted.encryptedKey,
        nonce: encrypted.nonce,
        authTag: encrypted.authTag,
      },
      TEST_MASTER_KEY,
    );

    expect(decrypted).toBe(plaintext);
  });

  it('fails decryption if authTag is tampered with', () => {
    const plaintext = 'tvly-test_key_sample';
    const encrypted = encryptApiKey(plaintext, TEST_MASTER_KEY);

    // Tamper with the authTag (keep exact 32 hex chars)
    const tamperedTag = encrypted.authTag.startsWith('aa')
      ? 'bb' + encrypted.authTag.slice(2)
      : 'aa' + encrypted.authTag.slice(2);

    expect(() =>
      decryptApiKey(
        {
          encryptedKey: encrypted.encryptedKey,
          nonce: encrypted.nonce,
          authTag: tamperedTag,
        },
        TEST_MASTER_KEY,
      ),
    ).toThrow();
  });

  it('masks Tavily key to only show last 4 characters', () => {
    const masked = maskApiKey('tvly-sample_key_9876');
    expect(masked).toBe('••••••••••••••9876');
  });
});
