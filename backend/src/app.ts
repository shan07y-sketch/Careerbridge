import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { securityConfig } from './config/security';
import { logger } from './config/logger';
import apiRouter from './routes/api.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { getHealth } from './modules/health/health.controller';

const app = express();

// Security Headers
app.use(helmet());

// Cross Origin Resource Sharing
app.use(cors(securityConfig.cors));

// Response Compression
app.use(compression());

// Cookie Parser
app.use(cookieParser());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import crypto from 'crypto';

// Custom Request Logger middleware with request tracing IDs
app.use((req, res, next) => {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', requestId);
  
  // Attach tracing metadata
  (req as any).id = requestId;
  const start = Date.now();

  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  }, 'Incoming request');

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, 'Request completed');
  });
  next();
});

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Global Rate Limiting
app.use(rateLimit(securityConfig.rateLimit));

// API Swagger UI routing
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint routing
app.get('/health', getHealth);
app.use('/api/v1', apiRouter);

// 404 handler
app.use(notFoundHandler);

// Global centralized error handler middleware
app.use(errorHandler);

export default app;
