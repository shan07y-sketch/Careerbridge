import { env } from './env';

export const securityConfig = {
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  bcrypt: {
    saltRounds: 10,
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP. Please try again later.',
      },
    },
  },
  rateLimits: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 mins
      max: 5,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts. Please try again in 15 minutes.'
        }
      }
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many registration requests. Please try again in an hour.'
        }
      }
    },
    forgotPassword: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset requests. Please try again in an hour.'
        }
      }
    },
    verification: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many verification attempts. Please try again in an hour.'
        }
      }
    }
  }
};
