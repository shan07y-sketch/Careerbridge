import { describe, it, expect } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildOtpAuthUri,
  generateTotp,
  generateTotpSecret,
  verifyTotp,
} from '../totp';

/**
 * The shared secret from RFC 6238 Appendix B ("12345678901234567890"), which
 * every published test vector is computed against.
 */
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890', 'ascii'));

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    const input = Buffer.from([0x00, 0xff, 0x10, 0x7a, 0x93, 0x02, 0xc1]);
    expect(base32Decode(base32Encode(input))).toEqual(input);
  });

  it('matches known RFC 4648 encodings', () => {
    expect(base32Encode(Buffer.from('foobar', 'ascii'))).toBe('MZXW6YTBOI');
  });

  it('rejects characters outside the alphabet', () => {
    expect(() => base32Decode('MZXW6YTB!')).toThrow(/Invalid base32/);
  });
});

describe('generateTotp — RFC 6238 vectors', () => {
  // Appendix B publishes 8-digit codes; we emit 6, which is the low-order
  // 6 digits of the same truncated value.
  const vectors: Array<[seconds: number, code: string]> = [
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
  ];

  it.each(vectors)('T=%i produces %s', (seconds, expected) => {
    expect(generateTotp(RFC_SECRET, seconds * 1000)).toBe(expected);
  });
});

describe('verifyTotp', () => {
  const now = 1111111111 * 1000;

  it('accepts the current code', () => {
    expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, now), { atMs: now })).toBe(true);
  });

  it('accepts the adjacent steps, absorbing clock drift', () => {
    const previous = generateTotp(RFC_SECRET, now - 30_000);
    const next = generateTotp(RFC_SECRET, now + 30_000);
    expect(verifyTotp(RFC_SECRET, previous, { atMs: now })).toBe(true);
    expect(verifyTotp(RFC_SECRET, next, { atMs: now })).toBe(true);
  });

  it('rejects codes beyond the drift window', () => {
    const stale = generateTotp(RFC_SECRET, now - 120_000);
    expect(verifyTotp(RFC_SECRET, stale, { atMs: now })).toBe(false);
  });

  it('rejects malformed input without throwing', () => {
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 34 56 78']) {
      expect(verifyTotp(RFC_SECRET, bad, { atMs: now })).toBe(false);
    }
  });

  it('tolerates spaces in otherwise valid codes', () => {
    const code = generateTotp(RFC_SECRET, now);
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
    expect(verifyTotp(RFC_SECRET, spaced, { atMs: now })).toBe(true);
  });
});

describe('generateTotpSecret', () => {
  it('produces a decodable 160-bit secret', () => {
    const secret = generateTotpSecret();
    expect(base32Decode(secret)).toHaveLength(20);
  });

  it('does not repeat', () => {
    const secrets = new Set(Array.from({ length: 50 }, () => generateTotpSecret()));
    expect(secrets.size).toBe(50);
  });
});

describe('buildOtpAuthUri', () => {
  it('encodes issuer and account for authenticator apps', () => {
    const uri = buildOtpAuthUri({ secret: 'JBSWY3DPEHPK3PXP', accountName: 'ada@example.com' });
    expect(uri).toMatch(/^otpauth:\/\/totp\/CareerBridge%3Aada%40example\.com\?/);
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=CareerBridge');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });
});
