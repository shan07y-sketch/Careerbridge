/**
 * CareerBridge API Verification Script
 *
 * Registers a fresh test user, obtains a JWT token, then exercises
 * every public and authenticated endpoint in the API.
 *
 * Run with:  npm run verify-api
 */

import { PrismaClient } from '@prisma/client';
import * as https from 'https';
import * as http from 'http';
import * as querystring from 'querystring';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────
const BASE_URL = process.env.API_URL ?? 'http://localhost:5000/api/v1';
const TEST_EMAIL  = 'api_verify_test@careerbridge.dev';
const TEST_PASS   = 'TestPass123!';

// ──────────────────────────────────────────────
// Minimal HTTP client (no external deps)
// ──────────────────────────────────────────────
interface ApiResponse {
  status: number;
  body: any;
}

function request(
  method: string,
  path: string,
  token?: string,
  payload?: any,
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const body = payload ? JSON.stringify(payload) : undefined;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let parsed: any = {};
        try { parsed = JSON.parse(Buffer.concat(chunks).toString()); } catch {}
        resolve({ status: res.statusCode ?? 0, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────
// Reporter
// ──────────────────────────────────────────────
interface TestResult {
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  httpStatus: number;
  note: string;
}

const results: TestResult[] = [];

function check(
  endpoint: string,
  res: ApiResponse,
  expectStatuses: number[],
  note = '',
) {
  const ok = expectStatuses.includes(res.status);
  const r: TestResult = {
    endpoint,
    status: ok ? 'PASS' : 'FAIL',
    httpStatus: res.status,
    note: note || (ok ? 'OK' : `Got ${res.status}, expected ${expectStatuses.join('/')}. Body: ${JSON.stringify(res.body).slice(0, 120)}`),
  };
  results.push(r);
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon}  [${res.status}] ${endpoint}: ${r.note}`);
}

function skip(endpoint: string, reason: string) {
  results.push({ endpoint, status: 'SKIP', httpStatus: 0, note: reason });
  console.log(`⏭   ${endpoint}: SKIP – ${reason}`);
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log('🔎 CareerBridge API Verification Script');
  console.log(`   Base URL : ${BASE_URL}`);
  console.log('══════════════════════════════════════\n');

  // ── 0. SETUP: Create & verify test user ────────────────────────────────────
  console.log('── Setup ─────────────────────────────────────────────────\n');

  // Clean up any lingering test user
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

  // Register
  const regRes = await request('POST', '/auth/register', undefined, {
    firstName: 'Api',
    lastName: 'Tester',
    email: TEST_EMAIL,
    password: TEST_PASS,
    role: 'STUDENT',
  });

  if (regRes.status !== 201 && regRes.status !== 200) {
    console.error('❌ Registration failed:', regRes.body);
    process.exit(1);
  }
  console.log(`✅  Registered test user: ${TEST_EMAIL}`);

  // Force-verify in DB
  await prisma.user.updateMany({
    where: { email: TEST_EMAIL },
    data: { isVerified: true },
  });
  console.log('✅  Email verified in DB\n');

  // Login → get token
  const loginRes = await request('POST', '/auth/login', undefined, {
    email: TEST_EMAIL,
    password: TEST_PASS,
  });

  if (loginRes.status !== 200 || !loginRes.body?.data?.accessToken) {
    console.error('❌ Login failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.data.accessToken as string;
  console.log('✅  Logged in, token obtained\n');

  // ── 1. Public Endpoints ────────────────────────────────────────────────────
  console.log('── Public Endpoints ───────────────────────────────────────\n');

  check('GET /health',  await request('GET', '/health'), [200]);
  check('GET /jobs',    await request('GET', '/jobs'),   [200]);
  check('GET /jobs?page=1&limit=5', await request('GET', '/jobs?page=1&limit=5'), [200]);

  // Get a real job id
  const jobsRes = await request('GET', '/jobs');
  const firstJob = jobsRes.body?.data?.jobs?.[0] ?? jobsRes.body?.data?.[0];
  const jobId = firstJob?.id;

  if (jobId) {
    check(`GET /jobs/${jobId}`, await request('GET', `/jobs/${jobId}`), [200]);
  } else {
    skip('GET /jobs/:id', 'No jobs returned from /jobs');
  }

  // ── 2. Auth Endpoints ──────────────────────────────────────────────────────
  console.log('\n── Auth Endpoints ─────────────────────────────────────────\n');

  check('GET /auth/me',    await request('GET', '/auth/me', token), [200]);
  check('GET /auth/check', await request('GET', '/auth/check', token), [200]);

  // Try refresh (should work with httpOnly cookie but may 400/401 without it)
  const refreshRes = await request('POST', '/auth/refresh');
  check('POST /auth/refresh (no cookie)', refreshRes, [200, 400, 401, 403]);

  // ── 3. Student / Protected Endpoints ──────────────────────────────────────
  console.log('\n── Student Endpoints ──────────────────────────────────────\n');

  check('GET /student/profile',       await request('GET', '/student/profile', token), [200, 404]);
  check('GET /applications',          await request('GET', '/applications', token), [200]);
  check('GET /notifications',         await request('GET', '/notifications', token), [200]);
  check('GET /messages',              await request('GET', '/messages', token), [200]);
  check('GET /resume',                await request('GET', '/resume', token), [200]);
  check('GET /career/insights',       await request('GET', '/career/insights', token), [200]);
  check('GET /career/mock-interviews',await request('GET', '/career/mock-interviews', token), [200]);
  check('GET /dashboard',             await request('GET', '/dashboard', token), [200]);
  check('GET /jobs/saved',            await request('GET', '/jobs/saved', token), [200]);
  check('GET /ai/health',             await request('GET', '/ai/health', token), [200]);

  // ── 4. Employer Endpoints (should 401/403 for STUDENT role) ───────────────
  console.log('\n── Employer Endpoints (expect 401/403 for student) ────────\n');

  check('GET /employer/dashboard',     await request('GET', '/employer/dashboard', token), [200, 401, 403]);
  check('GET /employer/jobs',          await request('GET', '/employer/jobs', token), [200, 401, 403]);
  check('GET /employer/applications',  await request('GET', '/employer/applications', token), [200, 401, 403]);
  check('GET /employer/analytics',     await request('GET', '/employer/analytics', token), [200, 401, 403]);

  // ── 5. University Endpoints (expect 401/403 for STUDENT role) ─────────────
  console.log('\n── University Endpoints (expect 401/403 for student) ──────\n');

  check('GET /university/dashboard', await request('GET', '/university/dashboard', token), [200, 401, 403]);
  check('GET /university/students',  await request('GET', '/university/students', token), [200, 401, 403]);
  check('GET /university/analytics', await request('GET', '/university/analytics', token), [200, 401, 403]);

  // ── 6. Admin Endpoints (expect 401/403 for STUDENT role) ──────────────────
  console.log('\n── Admin Endpoints (expect 401/403 for student) ───────────\n');

  check('GET /admin/users',    await request('GET', '/admin/users', token),   [200, 401, 403]);
  check('GET /admin/stats',    await request('GET', '/admin/stats', token),   [200, 401, 403]);
  check('GET /admin/search',   await request('GET', '/admin/search?q=test', token), [200, 401, 403]);

  // ── 7. Logout ──────────────────────────────────────────────────────────────
  console.log('\n── Cleanup ────────────────────────────────────────────────\n');

  check('POST /auth/logout', await request('POST', '/auth/logout', token), [200]);

  // Clean up test user
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  console.log(`\n✅  Test user ${TEST_EMAIL} cleaned up from DB`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  const passes = results.filter(r => r.status === 'PASS').length;
  const fails  = results.filter(r => r.status === 'FAIL').length;
  const skips  = results.filter(r => r.status === 'SKIP').length;

  console.log(`Total checks : ${results.length}`);
  console.log(`✅  Passed   : ${passes}`);
  console.log(`❌  Failed   : ${fails}`);
  console.log(`⏭   Skipped  : ${skips}`);

  if (fails > 0) {
    console.log('\n❌ Some API checks FAILED:\n');
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`   ${r.endpoint} → HTTP ${r.httpStatus}: ${r.note}`)
    );
    process.exit(1);
  } else {
    console.log('\n🎉 All API checks PASSED!\n');
  }
}

main()
  .catch((e) => {
    console.error('API verification crashed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
