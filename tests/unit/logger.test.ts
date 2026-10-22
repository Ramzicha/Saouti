import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { REDACT_KEYS } from '@/lib/logger';

describe('Structured & Redacted Logging (logger.ts)', () => {
  function createTestLogger(destination: { write: (msg: string) => void }) {
    return pino(
      {
        level: 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: {
          paths: REDACT_KEYS,
          censor: '[REDACTED]',
        },
      },
      destination,
    );
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'password_hash',
    'apiKey',
    'api_key',
    'secret',
    'token',
    'authorization',
    'credential',
    'databaseUrl',
  ];

  it.each(sensitiveFields)(
    'redacts sensitive field "%s" and emits valid JSON',
    (fieldName) => {
      let loggedOutput = '';
      const testLogger = createTestLogger({
        write: (msg: string) => {
          loggedOutput += msg;
        },
      });

      testLogger.info(
        { [fieldName]: 'secret-plain-text-value-1234' },
        'Testing redaction',
      );

      expect(loggedOutput.length).toBeGreaterThan(0);
      const parsed = JSON.parse(loggedOutput);

      expect(parsed).toBeDefined();
      expect(parsed.msg).toBe('Testing redaction');
      expect(parsed[fieldName]).toBe('[REDACTED]');
      expect(loggedOutput).not.toContain('secret-plain-text-value-1234');
    },
  );

  it('redacts nested sensitive fields', () => {
    let loggedOutput = '';
    const testLogger = createTestLogger({
      write: (msg: string) => {
        loggedOutput += msg;
      },
    });

    testLogger.info(
      {
        user: {
          passwordHash: 'argon2id_hash_string',
          apiKey: 'key_live_5678',
        },
      },
      'User login context',
    );

    const parsed = JSON.parse(loggedOutput);
    expect(parsed.user.passwordHash).toBe('[REDACTED]');
    expect(parsed.user.apiKey).toBe('[REDACTED]');
    expect(loggedOutput).not.toContain('argon2id_hash_string');
    expect(loggedOutput).not.toContain('key_live_5678');
  });

  it('handles empty strings for sensitive fields by still redacting them', () => {
    let loggedOutput = '';
    const testLogger = createTestLogger({
      write: (msg: string) => {
        loggedOutput += msg;
      },
    });

    testLogger.info({ password: '' }, 'Empty password test');
    const parsed = JSON.parse(loggedOutput);
    expect(parsed.password).toBe('[REDACTED]');
  });

  it('exercises default logger export and custom request serializers', async () => {
    const { logger, httpLogger } = await import('@/lib/logger');
    expect(logger).toBeDefined();
    expect(httpLogger).toBeDefined();

    // Verify req serializer functionality
    const reqSerializer = (logger as any)[pino.symbols.serializersSym]?.req;
    if (reqSerializer) {
      expect(reqSerializer(null)).toBeNull();

      const mockReq = {
        id: 'req-1',
        method: 'POST',
        url: '/api/test',
        headers: {
          authorization: 'Bearer token123',
          'x-api-key': 'key123',
          cookie: 'session=abc',
          'content-type': 'application/json',
        },
      };

      const serialized = reqSerializer(mockReq);
      expect(serialized.headers.authorization).toBe('[REDACTED]');
      expect(serialized.headers['x-api-key']).toBe('[REDACTED]');
      expect(serialized.headers.cookie).toBe('[REDACTED]');
      expect(serialized.headers['content-type']).toBe('application/json');
    }
  });
});
