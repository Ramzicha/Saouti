import { describe, it, expect } from 'vitest';
import { SaveApiKeySchema } from '@/lib/ai/schemas';
import { maskApiKey } from '@/lib/crypto/key-encryption';
import { REDACT_KEYS } from '@/lib/logger';

describe('AI Key Security & Validation Rules (ai-keys.test.ts)', () => {
  it('validates a correct Gemini API key with acknowledged terms', () => {
    const valid = {
      provider: 'gemini',
      apiKey: 'AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU',
      acknowledgedTerms: true,
    };
    const result = SaveApiKeySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects keys shorter than 10 characters', () => {
    const tooShort = {
      provider: 'gemini',
      apiKey: 'AIzaSyD',
      acknowledgedTerms: true,
    };
    const result = SaveApiKeySchema.safeParse(tooShort);
    expect(result.success).toBe(false);
  });

  it('rejects keys without explicit terms acknowledgment', () => {
    const unacknowledged = {
      provider: 'gemini',
      apiKey: 'AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU',
      acknowledgedTerms: false,
    };
    const result = SaveApiKeySchema.safeParse(unacknowledged);
    expect(result.success).toBe(false);
  });

  it('trims leading and trailing whitespace from submitted keys', () => {
    const withWhitespace = {
      provider: 'gemini',
      apiKey: '   AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU   ',
      acknowledgedTerms: true,
    };
    const parsed = SaveApiKeySchema.parse(withWhitespace);
    expect(parsed.apiKey).toBe('AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU');
  });

  it('strips enclosing quotes, prefixes and zero-width characters', () => {
    const quoted = {
      provider: 'gemini',
      apiKey: 'GEMINI_API_KEY="AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU"\u200B',
      acknowledgedTerms: true,
    };
    const parsed = SaveApiKeySchema.parse(quoted);
    expect(parsed.apiKey).toBe('AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU');
  });

  it('masks keys to only display last 4 characters', () => {
    const masked = maskApiKey('AIzaSyD-1234567890abcdefGhIjKlMnOpQrStU');
    expect(masked).toBe('••••••••••••••rStU');
    expect(masked).not.toContain('AIzaSyD');
  });

  it('guarantees critical secret fields are registered in logger redaction list', () => {
    const requiredRedactions = [
      'apiKey',
      'encryptedKey',
      'geminiKey',
      'authTag',
      'nonce',
    ];

    for (const key of requiredRedactions) {
      expect(REDACT_KEYS).toContain(key);
      expect(REDACT_KEYS).toContain(`*.${key}`);
    }
  });
});
