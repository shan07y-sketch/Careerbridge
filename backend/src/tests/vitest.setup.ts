// Executed before every test file. `src/config/env.ts` validates
// `process.env` at import time and calls `process.exit(1)` if anything is
// missing/invalid, so every required var needs a value here *before* any
// test imports a module that (transitively) imports env.ts.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/careerbridge_test?schema=public';
process.env.JWT_ACCESS_SECRET ||= 'test_access_secret_used_only_in_automated_tests_1234567890';
process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret_used_only_in_automated_tests_1234567890';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';
process.env.REDIS_URL ||= 'redis://localhost:6379';
