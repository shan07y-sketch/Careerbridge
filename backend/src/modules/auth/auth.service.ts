import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../shared/email.service';
import { AppError } from '../../utils/app-error';
import { securityConfig } from '../../config/security';

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

    const user = await AuthRepository.registerUser({
      email: body.email,
      passwordHash,
      role: body.role,
      verificationToken,
      firstName: body.firstName,
      lastName: body.lastName,
      companyName: body.companyName,
      industry: body.industry,
      universityName: body.universityName,
      location: body.location
    });

    // Fire verification mock email
    await EmailService.sendVerificationEmail(user.email, verificationToken);
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

    const isMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401, 'AUTHENTICATION_FAILED');
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email address to log in.', 403, 'EMAIL_NOT_VERIFIED');
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      securityConfig.jwt.accessSecret,
      { expiresIn: securityConfig.jwt.accessExpiry as any }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days expiry

    await AuthRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        studentProfile: user.studentProfile,
        recruiterProfile: user.recruiterProfile,
        universityProfile: user.universityProfile
      }
    };
  }

  /**
   * Renew expired access tokens
   */
  static async refresh(tokenString: string) {
    const dbToken = await AuthRepository.findRefreshToken(tokenString);
    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
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

    return { accessToken };
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
}
