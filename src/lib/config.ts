import { z } from 'zod';

export const configSchema = z.object({
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL' }),
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid connection URL' }),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/, { message: 'ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)' }),
  SESSION_SECRET: z
    .string()
    .min(32, { message: 'SESSION_SECRET must be at least 32 characters long' }),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function parseConfig(
  env: Record<string, string | undefined> = process.env,
  exitOnError: boolean = true,
): Config {
  const result = configSchema.safeParse(env);

  if (!result.success) {
    if (exitOnError) {
      process.stderr.write('❌ Configuration validation failed:\n');
      for (const issue of result.error.issues) {
        process.stderr.write(`  - ${issue.path.join('.')}: ${issue.message}\n`);
      }
      process.exit(1);
      return undefined as unknown as Config;
    }
    throw result.error;
  }

  return Object.freeze(result.data);
}

// In test environment, do not automatically exit process or throw if env vars are being mocked by tests
const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

const fallbackTestEnv: Record<string, string> = {
  DATABASE_URL: 'postgresql://saouti:secret@localhost:5432/saouti',
  REDIS_URL: 'redis://localhost:6379',
  ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  SESSION_SECRET: 'test_session_secret_at_least_32_characters_long_for_safety',
  PORT: '3000',
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
};

export const config: Config = parseConfig(
  isTestEnv ? { ...fallbackTestEnv, ...process.env } : process.env,
  !isTestEnv,
);
