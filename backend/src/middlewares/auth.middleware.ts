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
    req.user = {
      id: decoded.id,
      role: decoded.role,
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
