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
  changePasswordSchema
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

// Protected routes
router.get('/me', authenticate, AuthController.me);
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
