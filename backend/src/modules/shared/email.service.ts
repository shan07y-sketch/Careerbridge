import { logger } from '../../config/logger';

export class EmailService {
  /**
   * Logs a clickable verification email link to the system terminal logs
   */
  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `http://localhost:5000/api/v1/auth/verify-email?token=${token}`;
    logger.info(
      `
========================================================================
📧 [EMAIL MOCK] Verification Email Dispatched to: ${email}
👉 Verification Link: ${verificationUrl}
💡 Token: ${token}
========================================================================
      `
    );
  }

  /**
   * Logs a password reset link to the system terminal logs
   */
  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
    logger.info(
      `
========================================================================
📧 [EMAIL MOCK] Password Reset Email Dispatched to: ${email}
👉 Password Reset Link: ${resetUrl}
💡 Token: ${token}
========================================================================
      `
    );
  }
}
