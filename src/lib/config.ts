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
    }
    throw result.error;
  }

  return Object.freeze(result.data);
}

// In test environment, do not automatically exit process if env vars are being mocked by tests
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST;

export const config: Config = parseConfig(
  process.env,
  !isTestEnv,
);
