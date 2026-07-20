import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validation.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
  confirmTwoFactorSchema,
  verifyTwoFactorLoginSchema,
  disableTwoFactorSchema
} from './auth.validation';
import rateLimit from 'express-rate-limit';
import { securityConfig } from '../../config/security';

const router = Router();

// Configure independent rate limiters
const loginLimiter = rateLimit(securityConfig.rateLimits.login);
const registerLimiter = rateLimit(securityConfig.rateLimits.register);
const forgotPasswordLimiter = rateLimit(securityConfig.rateLimits.forgotPassword);
const verificationLimiter = rateLimit(securityConfig.rateLimits.verification);

router.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/verify-email', verificationLimiter, validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), AuthController.resendVerification);

// Second login step. Rate limited with the same budget as /login: without it
// a stolen challenge token could be brute-forced against a 6-digit code space.
router.post(
  '/2fa/verify-login',
  loginLimiter,
  validate(verifyTwoFactorLoginSchema),
  AuthController.verifyTwoFactorLogin
);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.get('/2fa/status', authenticate, AuthController.twoFactorStatus);
router.post('/2fa/setup', authenticate, AuthController.beginTwoFactor);
router.post('/2fa/confirm', authenticate, validate(confirmTwoFactorSchema), AuthController.confirmTwoFactor);
router.post('/2fa/disable', authenticate, validate(disableTwoFactorSchema), AuthController.disableTwoFactor);
router.post('/2fa/recovery-codes', authenticate, AuthController.regenerateRecoveryCodes);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

// Optional authentication parser for health checks
router.get('/check', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    authenticate(req, res, next);
  } else {
    next();
  }
}, AuthController.check);

export default router;
