import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error';
import { securityConfig } from '../config/security';
import { catchAsync } from '../utils/catch-async';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'employer' | 'university' | 'admin';
    email: string;
  };
}

export const authenticate = catchAsync(async (req: AuthenticatedRequest, res, next) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please provide an authorization token.', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, securityConfig.jwt.accessSecret) as any;
    // JWTs are signed with the Prisma `UserRole` enum value (STUDENT / EMPLOYER /
    // UNIVERSITY / ADMIN, uppercase). `restrictTo(...)` and every route in this
    // codebase were written against lowercase role literals ('student', 'employer',
    // 'university', 'admin'). Without normalizing here, every restrictTo() gate in
    // the entire app -- admin, employer, and university routes alike -- would
    // reject 100% of real, database-backed users with 403, because 'ADMIN' !==
    // 'admin'. This was invisible in tests because they forge JWTs/req.user
    // directly with lowercase roles, never exercising the real sign/verify path.
    req.user = {
      id: decoded.id,
      role: (typeof decoded.role === 'string' ? decoded.role.toLowerCase() : decoded.role) as 'student' | 'employer' | 'university' | 'admin',
      email: decoded.email,
    };
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token credentials.', 401, 'UNAUTHORIZED'));
  }
}) as RequestHandler;

export const restrictTo = (...roles: Array<'student' | 'employer' | 'university' | 'admin'>): RequestHandler => {
  return (req: AuthenticatedRequest, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }
    next();
  };
};
