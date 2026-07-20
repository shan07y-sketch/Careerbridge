/**
 * Authenticated encryption for small secrets held at rest (currently TOTP
 * seeds).
 *
 * A TOTP seed is a bearer credential: anyone holding it can mint valid codes
 * forever, which defeats the entire point of the second factor. Storing it in
 * the clear would mean a read-only database leak silently downgrades every
 * enrolled account back to password-only. AES-256-GCM keeps it unreadable
 * without the key and, unlike a plain cipher, detects tampering.
 */
import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits, the size GCM is specified for.
const KEY_LENGTH = 32;

/**
 * Derives the 256-bit key. When no dedicated key is configured we fall back to
 * HKDF over the JWT secret with a distinct `info` label, so the derived key is
 * unrelated to the one signing sessions even though it shares an input.
 */
function encryptionKey(): Buffer {
  const configured = env.TWO_FACTOR_ENCRYPTION_KEY;
  if (configured) {
    return crypto.createHash('sha256').update(configured).digest();
  }

  return Buffer.from(
    crypto.hkdfSync('sha256', env.JWT_ACCESS_SECRET, 'careerbridge-2fa', 'totp-secret-v1', KEY_LENGTH)
  );
}

/** Encrypts to `v1.<iv>.<authTag>.<ciphertext>`, all base64url. */
export function sealSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // The version prefix leaves room to rotate algorithm or key derivation later
  // without having to guess at the format of already-stored values.
  return ['v1', iv.toString('base64url'), authTag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

/** Reverses `sealSecret`. Throws if the value was tampered with or truncated. */
export function openSecret(sealed: string): string {
  const [version, iv, authTag, ciphertext] = sealed.split('.');
  if (version !== 'v1' || !iv || !authTag || !ciphertext) {
    throw new Error('Malformed sealed secret');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
