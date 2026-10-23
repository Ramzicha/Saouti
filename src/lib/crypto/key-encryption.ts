import crypto from 'crypto';
import { config } from '@/lib/config';

export interface EncryptedPayload {
  encryptedKey: string; // hex
  nonce: string;        // hex (12 bytes = 24 hex characters)
  authTag: string;      // hex (16 bytes = 32 hex characters)
  lastFour: string;
}

/**
 * Returns a masked representation of an API key showing only the last 4 characters.
 */
export function maskApiKey(apiKey: string): string {
  const lastFour = apiKey.length >= 4 ? apiKey.slice(-4) : apiKey;
  return `••••••••••••••${lastFour}`;
}

/**
 * Resolves the 32-byte master encryption key buffer from hex string.
 */
function getMasterKeyBuffer(masterKeyHex?: string): Buffer {
  const hex = masterKeyHex || config.AI_KEY_ENCRYPTION_SECRET;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'AI_KEY_ENCRYPTION_SECRET must be a 64-character hexadecimal string (32 bytes)',
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts an API key using AES-256-GCM with a unique 96-bit random nonce.
 *
 * @param apiKey - Plaintext API key
 * @param masterKeyHex - Optional override for 64-char hex key (defaults to config)
 * @returns Encrypted payload containing ciphertext, nonce, auth tag, and masked suffix
 */
export function encryptApiKey(
  apiKey: string,
  masterKeyHex?: string,
): EncryptedPayload {
  const keyBuffer = getMasterKeyBuffer(masterKeyHex);
  // 12-byte (96-bit) standard nonce for AES-GCM
  const nonceBuffer = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, nonceBuffer);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTagBuffer = cipher.getAuthTag();

  return {
    encryptedKey: encrypted,
    nonce: nonceBuffer.toString('hex'),
    authTag: authTagBuffer.toString('hex'),
    lastFour: apiKey.length >= 4 ? apiKey.slice(-4) : apiKey,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plaintext.
 * Throws an error if ciphertext or authentication tag has been tampered with.
 *
 * @param payload - Ciphertext, nonce, and authTag in hex format
 * @param masterKeyHex - Optional override for 64-char hex key
 * @returns Decrypted plaintext API key
 */
export function decryptApiKey(
  payload: { encryptedKey: string; nonce: string; authTag: string },
  masterKeyHex?: string,
): string {
  const keyBuffer = getMasterKeyBuffer(masterKeyHex);
  const nonceBuffer = Buffer.from(payload.nonce, 'hex');
  const authTagBuffer = Buffer.from(payload.authTag, 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    keyBuffer,
    nonceBuffer,
  );
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(payload.encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
