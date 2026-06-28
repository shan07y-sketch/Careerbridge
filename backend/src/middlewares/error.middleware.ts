import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred.';

  // Log full error parameters through Pino logger
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    req: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    }
  }, 'Central Error Handler Log');

  // Handle Schema parsing Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.errors.map(x => `${x.path.join('.')}: ${x.message}`).join(', ');
  }

  // Handle Token invalidations
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Invalid authentication token credentials.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired.';
  }

  const responsePayload: any = {
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  };

  // Append stack traces in development environment only
  if (env.NODE_ENV === 'development') {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

// 404 Route Not Found Handler middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(err);
};
