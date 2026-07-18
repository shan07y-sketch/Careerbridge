/**
 * CareerBridge auth end-to-end test suite.
 * Runs against the REAL backend (http://localhost:5000) and the REAL
 * PostgreSQL database. No mocks. Exit code 0 = all tests passed.
 *
 * Usage: node auth_e2e_test.cjs
 */
const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();
const PASSWORD = 'CbSecure@123'; // min8 + upper + lower + digit (backend policy)

let passed = 0, failed = 0;
const log = (ok, name, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`);
  ok ? passed++ : failed++;
};

const cookieOf = (setCookie) => {
  if (!setCookie) return null;
  const m = /refreshToken=([^;]+)/.exec(setCookie);
  return m ? `refreshToken=${m[1]}` : null;
};

async function req(method, path, { body, token, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json, cookie: cookieOf(res.headers.get('set-cookie')) };
}

(async () => {
  console.log(`\n=== CareerBridge Auth E2E (run id ${ts}) ===\n`);

  // ---- 0. Contract guard: the ORIGINAL broken employer payload must still
  //         be rejected with the real validation error (nothing swallowed).
  {
    const r = await req('POST', '/auth/register', {
      body: { email: `old_payload_${ts}@test.com`, password: PASSWORD, role: 'EMPLOYER', firstName: 'moorthy', lastName: 'k', companyName: 'luminasystems' } // no industry
    });
    log(r.status === 400 && /Profile details/.test(r.json?.error?.message || ''),
      'Old employer payload (no industry) rejected with real validation error',
      `${r.status} ${r.json?.error?.message || ''}`);
  }

  // ---- 1. Student register + login ----
  const sEmail = `e2e_student_${ts}@test.com`;
  {
    const r = await req('POST', '/auth/register', {
      body: { email: sEmail, password: PASSWORD, role: 'STUDENT', firstName: 'Eva', lastName: 'Torres', universityName: 'Massachusetts Institute of Technology', degree: 'B.S. Computer Science', graduationYear: 2026 }
    });
    log(r.status === 201 && r.json?.success === true, 'Register Student', `${r.status}`);
  }
  let sTok, sCookie;
  {
    const r = await req('POST', '/auth/login', { body: { email: sEmail, password: PASSWORD } });
    sTok = r.json?.data?.accessToken; sCookie = r.cookie;
    const sp = r.json?.data?.user?.studentProfile;
    log(r.status === 200 && !!sTok && !!sCookie && sp?.firstName === 'Eva' && sp?.graduationYear === 2026,
      'Login Student (token + httpOnly refresh cookie + real profile)',
      `${r.status} profile=${sp?.firstName} ${sp?.lastName}, gradYear=${sp?.graduationYear}`);
  }

  // ---- 2. Employer register + login (the payload the fixed UI now sends) ----
  const eEmail = `e2e_employer_${ts}@test.com`;
  {
    const r = await req('POST', '/auth/register', {
      body: { email: eEmail, password: PASSWORD, role: 'EMPLOYER', firstName: 'Moorthy', lastName: 'V', companyName: `Lumina Systems ${ts}`, industry: 'Technology' }
    });
    log(r.status === 201 && r.json?.success === true, 'Register Employer (companyName + industry)', `${r.status} ${r.json?.error?.message || ''}`);
  }
  let eTok;
  {
    const r = await req('POST', '/auth/login', { body: { email: eEmail, password: PASSWORD } });
    eTok = r.json?.data?.accessToken;
    const rp = r.json?.data?.user?.recruiterProfile;
    log(r.status === 200 && !!eTok && rp?.company?.name === `Lumina Systems ${ts}` && rp?.firstName === 'Moorthy',
      'Login Employer (recruiter profile + company from DB)',
      `${r.status} company=${rp?.company?.name}, recruiter=${rp?.firstName}`);
  }

  // ---- 3. University register + login ----
  const uEmail = `e2e_university_${ts}@test.com`;
  {
    const r = await req('POST', '/auth/register', {
      body: { email: uEmail, password: PASSWORD, role: 'UNIVERSITY', firstName: 'Dean', lastName: 'Office', universityName: `E2E Institute ${ts}`, location: 'Chennai, IN' }
    });
    log(r.status === 201 && r.json?.success === true, 'Register University (universityName + location)', `${r.status} ${r.json?.error?.message || ''}`);
  }
  let uTok;
  {
    const r = await req('POST', '/auth/login', { body: { email: uEmail, password: PASSWORD } });
    uTok = r.json?.data?.accessToken;
    const up = r.json?.data?.user?.universityProfile;
    log(r.status === 200 && !!uTok && up?.name === `E2E Institute ${ts}`,
      'Login University (university profile from DB)', `${r.status} name=${up?.name}`);
  }

  // ---- 4. Admin login ----
  let aTok;
  {
    const r = await req('POST', '/auth/login', { body: { email: 'admin@careerbridge.com', password: 'Admin@CB2026' } });
    aTok = r.json?.data?.accessToken;
    log(r.status === 200 && !!aTok && r.json?.data?.user?.role === 'ADMIN', 'Login Admin (real DB user, no mock)', `${r.status}`);
  }

  // ---- 5. Session restore: GET /auth/me for every role ----
  for (const [name, tok, role] of [['student', sTok, 'STUDENT'], ['employer', eTok, 'EMPLOYER'], ['university', uTok, 'UNIVERSITY'], ['admin', aTok, 'ADMIN']]) {
    const r = await req('GET', '/auth/me', { token: tok });
    log(r.status === 200 && r.json?.data?.user?.role === role, `GET /auth/me restores ${name} session`, `${r.status} role=${r.json?.data?.user?.role}`);
  }

  // ---- 6. Protected routes + role guards ----
  {
    const r = await req('GET', '/dashboard', { token: sTok });
    log(r.status === 200, 'Student dashboard (protected) with student token', `${r.status}`);
  }
  {
    const r = await req('GET', '/employer/dashboard', { token: eTok });
    log(r.status === 200, 'Employer dashboard (protected) with employer token', `${r.status} ${r.json?.error?.message || ''}`);
  }
  {
    const r = await req('GET', '/employer/dashboard', { token: sTok });
    log(r.status === 403, 'Role guard: student token rejected from employer dashboard', `${r.status}`);
  }
  {
    const r = await req('GET', '/employer/dashboard', {});
    log(r.status === 401, 'JWT middleware: no token -> 401', `${r.status}`);
  }

  // ---- 7. Refresh token rotation + reuse detection ----
  let rotatedCookie;
  {
    const r = await req('POST', '/auth/refresh', { cookie: sCookie });
    rotatedCookie = r.cookie;
    log(r.status === 200 && !!r.json?.data?.accessToken && !!rotatedCookie && rotatedCookie !== sCookie,
      'Refresh token: new access token + rotated cookie', `${r.status}`);
  }
  {
    const r = await req('POST', '/auth/refresh', { cookie: sCookie }); // replay the OLD cookie
    log(r.status === 401, 'Refresh reuse detection: replayed old cookie -> 401 (family revoked)', `${r.status} ${r.json?.error?.code || ''}`);
  }

  // ---- 8. Logout revokes the refresh token ----
  {
    // The reuse detection above revoked the whole student family; use a fresh login.
    const l = await req('POST', '/auth/login', { body: { email: sEmail, password: PASSWORD } });
    const c = l.cookie;
    const out = await req('POST', '/auth/logout', { cookie: c });
    const replay = await req('POST', '/auth/refresh', { cookie: c });
    log(out.status === 200 && replay.status === 401, 'Logout revokes refresh token server-side', `logout=${out.status}, refresh-after-logout=${replay.status}`);
  }

  // ---- 9. Real errors surface (nothing swallowed) ----
  {
    const r = await req('POST', '/auth/login', { body: { email: sEmail, password: 'Wrong@Pass1' } });
    log(r.status === 401 && /Invalid email or password/.test(r.json?.error?.message || ''), 'Wrong password -> real 401 error message', `${r.status}`);
  }
  {
    const r = await req('POST', '/auth/register', { body: { email: sEmail, password: PASSWORD, role: 'STUDENT', firstName: 'Dup', lastName: 'User' } });
    log(r.status === 400 && /already in use/.test(r.json?.error?.message || ''), 'Duplicate email -> real 400 error message', `${r.status}`);
  }
  {
    const r = await req('POST', '/auth/register', { body: { email: `weakpw_${ts}@test.com`, password: 'alllowercase1', role: 'STUDENT', firstName: 'Weak', lastName: 'Pw' } });
    log(r.status === 400 && /uppercase/.test(r.json?.error?.message || ''), 'Weak password -> real validation message', `${r.status}`);
  }

  console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('SUITE CRASHED:', e); process.exit(1); });
