/**
 * TOTP (RFC 6238) and the Base32 codec it needs, implemented on Node's crypto.
 *
 * Deliberately dependency-free: this sits directly in the authentication path,
 * so the smaller and more auditable the code, the better. The algorithm is
 * ~40 lines and stable since 2011 — a third-party package here would buy
 * nothing and add supply-chain surface to the login flow.
 *
 * Defaults (SHA-1, 6 digits, 30s period) are not a security choice but an
 * interoperability one: Google Authenticator, Authy, 1Password and Microsoft
 * Authenticator all assume them, and several silently ignore other values.
 */
import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DIGITS = 6;
const PERIOD_SECONDS = 30;

/**
 * How many periods either side of "now" are accepted. One step (±30s) absorbs
 * ordinary clock drift and the seconds a user spends typing, without
 * meaningfully widening the window for an attacker.
 */
const DEFAULT_WINDOW = 1;

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];

  return output;
}

export function base32Decode(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/** Generates a fresh 160-bit secret, the size RFC 4226 recommends for SHA-1. */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/** Computes the TOTP code for a given counter step. */
function hotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  // Counter is a 64-bit big-endian integer. Node's writeBigUInt64BE avoids the
  // precision loss of doing this with two 32-bit halves.
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto.createHmac('sha1', secret).update(counterBuffer).digest();

  // Dynamic truncation (RFC 4226 §5.3).
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];

  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/** The code an authenticator app would currently be showing. */
export function generateTotp(secretBase32: string, atMs: number = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / PERIOD_SECONDS);
  return hotp(base32Decode(secretBase32), counter);
}

/**
 * Verifies a user-supplied code against the secret.
 *
 * Comparison is constant-time so the endpoint cannot be turned into an oracle
 * that leaks the expected code digit by digit through response timing.
 */
export function verifyTotp(
  secretBase32: string,
  token: string,
  { window = DEFAULT_WINDOW, atMs = Date.now() }: { window?: number; atMs?: number } = {}
): boolean {
  const candidate = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(candidate)) return false;

  const secret = base32Decode(secretBase32);
  const counter = Math.floor(atMs / 1000 / PERIOD_SECONDS);
  const candidateBuffer = Buffer.from(candidate);

  let matched = false;
  for (let drift = -window; drift <= window; drift += 1) {
    const expected = Buffer.from(hotp(secret, counter + drift));
    // Do not break on a match: an early exit would reintroduce the timing
    // signal that timingSafeEqual exists to remove.
    if (
      expected.length === candidateBuffer.length &&
      crypto.timingSafeEqual(expected, candidateBuffer)
    ) {
      matched = true;
    }
  }

  return matched;
}

/**
 * Builds the otpauth:// URI that authenticator apps consume via QR code.
 * The issuer is repeated in both the label and the query string because some
 * apps read only one of the two.
 */
export function buildOtpAuthUri(params: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = params.issuer ?? 'CareerBridge';
  const label = encodeURIComponent(`${issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });

  return `otpauth://totp/${label}?${query.toString()}`;
}
