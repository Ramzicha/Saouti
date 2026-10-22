import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from 'vitest';
import { parseConfig, configSchema } from '@/lib/config';

describe('Configuration Validation (config.ts)', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://saouti:secret@localhost:5432/saouti',
    REDIS_URL: 'redis://localhost:6379',
    ENCRYPTION_KEY:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    SESSION_SECRET: 'a_very_long_session_secret_for_testing_purposes_only',
    PORT: '3000',
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
  };

  let exitMock: MockInstance;
  let stderrMock: MockInstance;

  beforeEach(() => {
    exitMock = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    stderrMock = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation((() => true) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('valid environment variables produce a frozen config object with correct types', () => {
    const config = parseConfig(validEnv, false);
    expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(config.REDIS_URL).toBe(validEnv.REDIS_URL);
    expect(config.PORT).toBe(3000);
    expect(typeof config.PORT).toBe('number');
    expect(config.NODE_ENV).toBe('test');
    expect(config.LOG_LEVEL).toBe('info');
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('defaults PORT to 3000, NODE_ENV to development, and LOG_LEVEL to info when omitted', () => {
    const minimalEnv = {
      DATABASE_URL: validEnv.DATABASE_URL,
      REDIS_URL: validEnv.REDIS_URL,
      ENCRYPTION_KEY: validEnv.ENCRYPTION_KEY,
      SESSION_SECRET: validEnv.SESSION_SECRET,
    };
    const config = parseConfig(minimalEnv, false);
    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.LOG_LEVEL).toBe('info');
  });

  it.each(['DATABASE_URL', 'REDIS_URL', 'ENCRYPTION_KEY', 'SESSION_SECRET'])(
    'calls process.exit(1) when required field %s is missing',
    (field) => {
      const invalidEnv = { ...validEnv };
      delete (invalidEnv as any)[field];

      parseConfig(invalidEnv, true);
      expect(exitMock).toHaveBeenCalledWith(1);
      expect(stderrMock).toHaveBeenCalled();
    },
  );

  it('fails with descriptive error message when ENCRYPTION_KEY is too short', () => {
    const invalidEnv = {
      ...validEnv,
      ENCRYPTION_KEY: '0123456789abcdef',
    };
    const result = configSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === 'ENCRYPTION_KEY',
      );
      expect(issue?.message).toContain('64-character hexadecimal string');
    }
  });

  it('fails with descriptive error message when ENCRYPTION_KEY is non-hex', () => {
    const invalidEnv = {
      ...validEnv,
      ENCRYPTION_KEY: 'g'.repeat(64),
    };
    const result = configSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === 'ENCRYPTION_KEY',
      );
      expect(issue?.message).toContain('64-character hexadecimal string');
    }
  });

  it('fails when SESSION_SECRET is shorter than 32 characters', () => {
    const invalidEnv = {
      ...validEnv,
      SESSION_SECRET: 'too_short',
    };
    const result = configSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === 'SESSION_SECRET',
      );
      expect(issue?.message).toContain('at least 32 characters');
    }
  });

  it('throws ZodError when exitOnError is false', () => {
    const invalidEnv = { ...validEnv, DATABASE_URL: 'not-a-valid-url' };
    expect(() => parseConfig(invalidEnv, false)).toThrow();
  });
});
