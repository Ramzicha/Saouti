import { hash, verify, type Options } from '@node-rs/argon2';

/**
 * Argon2id Configuration per OWASP & Saouti Security Research
 * - memoryCost: 19456 KiB (~19 MiB)
 * - timeCost: 2 iterations
 * - parallelism: 1 thread
 */
const ARGON2_OPTIONS: Options = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Hashes a plaintext password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against an Argon2id hash in constant time.
 */
export async function verifyPassword(
  hashString: string,
  candidate: string,
): Promise<boolean> {
  try {
    return await verify(hashString, candidate, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
