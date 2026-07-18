import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load variables from local file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  CLOUDINARY_URL: z.string().url().optional(),
  // Public origin this API is served from, used to build absolute URLs
  // (resume file links, share links) that need to work outside localhost.
  APP_BASE_URL: z.string().url().default('http://localhost:5000'),

  // --- Gemini AI (Google Generative Language API) -----------------------
  // When GEMINI_API_KEY is unset, every AI module (resume, career, interview,
  // employer, university, admin) falls back to its deterministic mock
  // generator so the platform is fully usable without a key in dev/test.
  // Set GEMINI_API_KEY to route all six modules through the real Gemini API.
  AI_PROVIDER: z.enum(['gemini']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
  // Endpoint routing: 'auto' picks by key prefix (AQ. -> Vertex express,
  // AIza -> Developer API), but some AQ. keys are dual-enrolled and only the
  // Developer API is enabled on their project — set 'developer' or 'vertex'
  // to force one.
  GEMINI_ENDPOINT: z.enum(['auto', 'developer', 'vertex']).default('auto'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failure:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

// Zod's `.min(8)` only guards length, not entropy - a short, well-known
// placeholder value like "default_secret_value" passes that check fine.
// In any non-development environment, refuse to boot if a JWT secret
// matches a known dev/placeholder value or is otherwise clearly not a
// real generated secret. This is what should have caught the hardcoded
// docker-compose.yml default before it ever reached a real deployment.
const KNOWN_WEAK_SECRETS = new Set([
  'default_secret_value',
  'secret',
  'changeme',
  'change_me',
  'your_jwt_secret',
  'careerbridge_super_access_secret_key_2026_dev',
  'careerbridge_super_refresh_secret_key_2026_dev'
]);

function assertStrongSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') {
  const value = env[name];

  if (env.NODE_ENV === 'production' && (KNOWN_WEAK_SECRETS.has(value) || value.length < 32)) {
    console.error(
      `Refusing to start in production: ${name} is a known placeholder or too short (< 32 chars). ` +
        "Generate a real secret with `openssl rand -base64 48` and set it via your deployment platform's secret manager."
    );
    process.exit(1);
  }
}

assertStrongSecret('JWT_ACCESS_SECRET');
assertStrongSecret('JWT_REFRESH_SECRET');

if (env.NODE_ENV === 'production' && !env.GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY is not set in production. All AI modules (resume, career, interview, employer, university, ' +
      'admin) will run in deterministic mock mode until a real key is configured.'
  );
}
