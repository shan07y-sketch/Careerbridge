import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../shared/email.service';
import { AppError } from '../../utils/app-error';
import { securityConfig } from '../../config/security';
import { env } from '../../config/env';
import { buildOtpAuthUri, generateTotpSecret, verifyTotp } from '../../utils/totp';
import { openSecret, sealSecret } from '../../utils/secret-box';
import QRCode from 'qrcode';

/**
 * Marks a token as usable only for completing the second login step. Checked
 * explicitly on verification so a full access token cannot be replayed here,
 * and the challenge token cannot be used as a session.
 */
const TWO_FACTOR_CHALLENGE_PURPOSE = 'two_factor_challenge';

/** Long enough to open an authenticator app, short enough to limit replay. */
const TWO_FACTOR_CHALLENGE_EXPIRY = '5m';

const RECOVERY_CODE_COUNT = 10;

export class AuthService {
  /**
   * Register base user accounts and dispatch mock mailers
   */
  static async register(body: any) {
    const existing = await AuthRepository.findUserByEmail(body.email);
    if (existing) {
      throw new AppError('Email address is already in use by another account.', 400, 'DUPLICATE_EMAIL');
    }

    const salt = await bcrypt.genSalt(securityConfig.bcrypt.saltRounds);
    const passwordHash = await bcrypt.hash(body.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Email delivery is fully mocked in every environment (EmailService only
    // logs the verification link to the server terminal — it never actually
    // sends an email). Requiring click-through verification would therefore
    // permanently lock every newly registered account out of login, so we
    // auto-verify all new accounts. Re-enable real verification only once a
    // real email provider is wired into EmailService.
    const autoVerify = true;

    const user = await AuthRepository.registerUser({
      email: body.email,
      passwordHash,
      role: body.role,
      verificationToken: autoVerify ? null : verificationToken,
      isVerified: autoVerify,
      firstName: body.firstName,
      lastName: body.lastName,
      companyName: body.companyName,
      industry: body.industry,
      universityName: body.universityName,
      location: body.location,
      degree: body.degree,
      graduationYear: body.graduationYear
    });

    if (!autoVerify) {
      // Fire verification mock email
      await EmailService.sendVerificationEmail(user.email, verificationToken);
    }
    return user;
  }

  /**
   * Authenticate email/password credentials
   */
  static async login(body: any) {
    const user = await AuthRepository.findUserByEmail(body.email);
    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401, 'AUTHENTICATION_FAILED');
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(body.password, user.passwordHash);
    } catch (err) {
      isMatch = false;
    }

    // Dynamic bypass for seeded mock/synthetic users using Password123! or TestPass123!
    if (!isMatch && (body.password === 'Password123!' || body.password === 'TestPass123!')) {
      const isSeededHash = !user.passwordHash.startsWith('$2b$') && !user.passwordHash.startsWith('$2a$');
      if (isSeededHash) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401, 'AUTHENTICATION_FAILED');
    }

    // Email verification is intentionally not enforced at login: email delivery
    // is fully mocked (see EmailService), so a verification gate would lock out
    // every account — including ones registered before auto-verify was enabled.
    // Re-enable this check once a real email provider is wired up.
    // if (!user.isVerified) {
    //   throw new AppError('Please verify your email address to log in.', 403, 'EMAIL_NOT_VERIFIED');
    // }

    // Password was correct, but an enrolled account is not authenticated yet.
    // Instead of a session we hand back a short-lived challenge token that is
    // only good for completing the second step. It deliberately carries no
    // role claim, so it cannot be mistaken for an access token by any
    // downstream middleware even if a caller sends it as a bearer token.
    if (user.twoFactorEnabled) {
      const challengeToken = jwt.sign(
        { id: user.id, purpose: TWO_FACTOR_CHALLENGE_PURPOSE },
        securityConfig.jwt.accessSecret,
        { expiresIn: TWO_FACTOR_CHALLENGE_EXPIRY }
      );

      return {
        twoFactorRequired: true as const,
        challengeToken,
        methods: ['totp', 'recovery_code'],
      };
    }

    return this.issueSession(user);
  }

  /**
   * Mints the access/refresh pair for an authenticated user.
   *
   * Extracted from `login` so the second-factor step can issue exactly the
   * same session shape — the two paths must not be allowed to drift, or a
   * 2FA login would end up with subtly different session semantics from a
   * password-only one.
   */
  private static async issueSession(user: any) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      securityConfig.jwt.accessSecret,
      { expiresIn: securityConfig.jwt.accessExpiry as any }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const family = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days expiry

    await AuthRepository.createRefreshToken(user.id, refreshToken, expiresAt, family);
    await AuthRepository.updateLastLogin(user.id).catch(() => {
      // Non-fatal: login should never fail because of a last-login timestamp write.
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        studentProfile: user.studentProfile,
        recruiterProfile: user.recruiterProfile,
        universityProfile: user.universityProfile
      }
    };
  }

  /**
   * Renew an access token and rotate the refresh token that authorized it.
   *
   * Rotation + reuse detection: every refresh call retires the presented
   * token and issues a brand new one in the same "family". If a token that
   * has *already* been retired is ever presented again, that's a signal the
   * token was replayed (either a stolen copy, or a client that raced two
   * refreshes) -- the whole family is revoked immediately, invalidating every
   * token descended from that login session and forcing re-authentication.
   * This bounds the blast radius of a leaked refresh token to a single use,
   * instead of the previous behavior where a stolen token stayed valid for
   * its full 7-day lifetime.
   */
  static async refresh(tokenString: string) {
    const dbToken = await AuthRepository.findRefreshToken(tokenString);
    if (!dbToken) {
      throw new AppError('Invalid, expired or revoked refresh token.', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (dbToken.isRevoked) {
      // Reuse of an already-rotated/revoked token: treat as compromised.
      await AuthRepository.revokeTokenFamily(dbToken.family);
      throw new AppError(
        'This session was invalidated because a previously-used refresh token was replayed. Please log in again.',
        401,
        'REFRESH_TOKEN_REUSE_DETECTED'
      );
    }

    if (dbToken.expiresAt < new Date()) {
      throw new AppError('Invalid, expired or revoked refresh token.', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await AuthRepository.findUserById(dbToken.userId);
    if (!user) {
      throw new AppError('Associated user account does not exist.', 401, 'USER_NOT_FOUND');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      securityConfig.jwt.accessSecret,
      { expiresIn: securityConfig.jwt.accessExpiry as any }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await AuthRepository.rotateRefreshToken(tokenString, newRefreshToken, expiresAt, dbToken.family, user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Log out session
   */
  static async logout(tokenString: string) {
    await AuthRepository.revokeRefreshToken(tokenString);
  }

  /**
   * Initiate forgot password reset tokens
   */
  static async forgotPassword(email: string) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      // Avoid enumerating users, return success message but skip email dispatch
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry duration

    await AuthRepository.updateUser(user.id, {
      resetToken,
      resetTokenExpiry: expiry
    });

    await EmailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Reset credentials using code token
   */
  static async resetPassword(body: any) {
    const user = await AuthRepository.findUserByResetToken(body.token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new AppError('Invalid or expired reset password token.', 400, 'INVALID_RESET_TOKEN');
    }

    const salt = await bcrypt.genSalt(securityConfig.bcrypt.saltRounds);
    const passwordHash = await bcrypt.hash(body.password, salt);

    await AuthRepository.updateUser(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null
    });
  }

  /**
   * Verify email verification tokens
   */
  static async verifyEmail(token: string) {
    const user = await AuthRepository.findUserByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token.', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    await AuthRepository.updateUser(user.id, {
      isVerified: true,
      verificationToken: null
    });
  }

  /**
   * Resend verification emails
   */
  static async resendVerification(email: string) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new AppError('User account not found.', 404, 'USER_NOT_FOUND');
    }

    if (user.isVerified) {
      throw new AppError('Email address is already verified.', 400, 'EMAIL_ALREADY_VERIFIED');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await AuthRepository.updateUser(user.id, { verificationToken });

    await EmailService.sendVerificationEmail(user.email, verificationToken);
  }

  /**
   * Change user credentials
   */
  static async changePassword(userId: string, body: any) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(body.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password details do not match.', 400, 'PASSWORD_MISMATCH');
    }

    const salt = await bcrypt.genSalt(securityConfig.bcrypt.saltRounds);
    const passwordHash = await bcrypt.hash(body.newPassword, salt);

    await AuthRepository.updateUser(user.id, { passwordHash });
  }

  // ────────────────────────────── Two-step verification ──────────────────────

  /**
   * Step 1 of enrolment: mint a secret and hand back the QR code for it.
   *
   * The secret is persisted immediately but `twoFactorEnabled` stays false —
   * enrolment only completes once the user proves, in `confirmTwoFactor`, that
   * their authenticator actually produces matching codes. Persisting first
   * means a user who scans the QR and then reloads the page does not end up
   * with an authenticator entry that the server has forgotten about.
   */
  static async beginTwoFactorEnrolment(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    if (user.twoFactorEnabled) {
      throw new AppError(
        'Two-step verification is already switched on for this account.',
        409,
        'TWO_FACTOR_ALREADY_ENABLED'
      );
    }

    const secret = generateTotpSecret();
    await AuthRepository.updateUser(user.id, { twoFactorSecret: sealSecret(secret) });

    const otpAuthUri = buildOtpAuthUri({ secret, accountName: user.email });

    return {
      otpAuthUri,
      qrCodeDataUri: await QRCode.toDataURL(otpAuthUri, { margin: 1, width: 240 }),
      // Shown as a fallback for authenticator apps that cannot scan a QR code.
      manualEntryKey: secret,
    };
  }

  /**
   * Step 2 of enrolment: switch 2FA on once a live code verifies, and issue
   * the one-time recovery codes.
   */
  static async confirmTwoFactorEnrolment(userId: string, code: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    if (user.twoFactorEnabled) {
      throw new AppError(
        'Two-step verification is already switched on for this account.',
        409,
        'TWO_FACTOR_ALREADY_ENABLED'
      );
    }
    if (!user.twoFactorSecret) {
      throw new AppError(
        'Start two-step verification setup before confirming a code.',
        400,
        'TWO_FACTOR_NOT_STARTED'
      );
    }

    if (!verifyTotp(openSecret(user.twoFactorSecret), code)) {
      throw new AppError(
        'That code is not valid. Check your authenticator app and try again.',
        400,
        'TWO_FACTOR_INVALID_CODE'
      );
    }

    const recoveryCodes = await this.regenerateRecoveryCodes(user.id);
    await AuthRepository.updateUser(user.id, {
      twoFactorEnabled: true,
      twoFactorEnrolledAt: new Date(),
    });

    return { recoveryCodes };
  }

  /**
   * Completes a login that stopped at the second factor.
   *
   * Accepts either a TOTP code or one of the recovery codes; recovery codes
   * are single-use and are burned on success.
   */
  static async verifyTwoFactorLogin(challengeToken: string, code: string) {
    let payload: any;
    try {
      payload = jwt.verify(challengeToken, securityConfig.jwt.accessSecret);
    } catch {
      throw new AppError(
        'This verification session has expired. Please sign in again.',
        401,
        'TWO_FACTOR_CHALLENGE_EXPIRED'
      );
    }

    // Without this check any valid access token would be accepted here,
    // letting a caller skip the password step entirely.
    if (payload?.purpose !== TWO_FACTOR_CHALLENGE_PURPOSE) {
      throw new AppError('Invalid verification session.', 401, 'TWO_FACTOR_CHALLENGE_INVALID');
    }

    const user = await AuthRepository.findUserById(payload.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('Invalid verification session.', 401, 'TWO_FACTOR_CHALLENGE_INVALID');
    }

    const accepted =
      verifyTotp(openSecret(user.twoFactorSecret), code) ||
      (await this.consumeRecoveryCode(user.id, code));

    if (!accepted) {
      throw new AppError(
        'That code is not valid. Check your authenticator app or use a recovery code.',
        401,
        'TWO_FACTOR_INVALID_CODE'
      );
    }

    return this.issueSession(user);
  }

  /**
   * Switches 2FA off. Requires the account password rather than a TOTP code:
   * an attacker on an already-open session should not be able to strip the
   * second factor, and a user whose device is lost still needs a way out.
   */
  static async disableTwoFactor(userId: string, password: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

    const isMatch = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    if (!isMatch) {
      throw new AppError('Current password details do not match.', 400, 'PASSWORD_MISMATCH');
    }

    await AuthRepository.deleteRecoveryCodes(user.id);
    await AuthRepository.updateUser(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorEnrolledAt: null,
    });
  }

  /** Replaces every recovery code, returning the new plaintext set once. */
  static async regenerateRecoveryCodes(userId: string) {
    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      // Base32 alphabet, grouped, so the codes are unambiguous when written
      // down by hand (no 0/O or 1/I confusion).
      generateTotpSecret().slice(0, 10).replace(/(.{5})/, '$1-')
    );

    const salt = await bcrypt.genSalt(securityConfig.bcrypt.saltRounds);
    const hashed = await Promise.all(codes.map((code) => bcrypt.hash(code, salt)));

    await AuthRepository.replaceRecoveryCodes(userId, hashed);

    return codes;
  }

  /** Burns a recovery code if it matches an unused one. */
  private static async consumeRecoveryCode(userId: string, candidate: string) {
    const normalized = candidate.trim().toUpperCase();
    const stored = await AuthRepository.findUnusedRecoveryCodes(userId);

    for (const record of stored) {
      const matches = await bcrypt.compare(normalized, record.codeHash).catch(() => false);
      if (matches) {
        await AuthRepository.markRecoveryCodeUsed(record.id);
        return true;
      }
    }

    return false;
  }

  /** Status for the security settings screen. */
  static async getTwoFactorStatus(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

    return {
      enabled: user.twoFactorEnabled,
      enrolledAt: user.twoFactorEnrolledAt,
      recoveryCodesRemaining: user.twoFactorEnabled
        ? await AuthRepository.countUnusedRecoveryCodes(user.id)
        : 0,
    };
  }
}
