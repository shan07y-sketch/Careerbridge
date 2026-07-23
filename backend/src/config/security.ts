import { env } from './env';

const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';

// CORS_ORIGIN may be a single origin or a comma-separated list. We always also
// allow the Capacitor WebView origins (https://localhost on Android,
// capacitor://localhost on iOS) so the native app's API calls aren't blocked,
// plus the local dev server.
const allowedOrigins = new Set(
  [
    ...env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
    'https://localhost',
    'capacitor://localhost',
    'http://localhost:5173',
  ]
);

// `origin` callback: reflect the caller's origin when it's allowed. Requests
// with no Origin header (curl, health checks, native HTTP) are allowed through.
const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};

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
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    // Global per-IP ceiling. The old value of 100/15min was far too low for a
    // data-heavy SPA: a single user opening a dashboard and browsing a few
    // pages (jobs, applications, messages, notifications, analytics) easily
    // fires well over 100 requests, so a legitimate session tripped
    // "Too many requests from this IP" within a minute. `trust proxy` is set
    // (app.ts), so this is keyed on the real client IP, not the Railway edge —
    // 5000/15min (~5.5 req/s sustained) never inconveniences a real user while
    // still stopping a scraper doing tens of thousands of calls.
    max: isDev ? 9999999 : 5000,
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
      // 5 was brutal: two fat-fingered passwords plus a couple of 2FA code
      // retries (the 2FA step shares this limiter) locked a real user out for
      // 15 minutes. 40/15min still throttles brute force to a crawl against
      // bcrypt hashes while never blocking a genuine sign-in.
      max: isDev ? 9999999 : 40,
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
      max: isDev ? 9999999 : 50,
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
      max: isDev ? 9999999 : 20,
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
      max: isDev ? 9999999 : 30,
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
