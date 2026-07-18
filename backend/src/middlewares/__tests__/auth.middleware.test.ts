import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, restrictTo, AuthenticatedRequest } from '../auth.middleware';
import { securityConfig } from '../../config/security';

// These are pure middleware-unit tests: no HTTP server, no database. They
// exercise exactly the two pieces of the RBAC system that every protected
// route in the API depends on (see the Phase 0 audit's endpoint inventory —
// 12 of 13 feature modules gate every route through these two functions).

function mockReqRes(overrides: Partial<AuthenticatedRequest> = {}) {
  const req = { headers: {}, ...overrides } as AuthenticatedRequest;
  const res = {} as any;
  const next = vi.fn();
  return { req, res, next };
}

describe('authenticate middleware', () => {
  it('rejects requests with no Authorization header', async () => {
    const { req, res, next } = mockReqRes();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const errArg = next.mock.calls[0][0];
    expect(errArg).toBeDefined();
    expect(errArg.statusCode).toBe(401);
    expect(errArg.errorCode).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed / invalid token', async () => {
    const { req, res, next } = mockReqRes({ headers: { authorization: 'Bearer not-a-real-token' } as any });
    await authenticate(req, res, next);
    const errArg = next.mock.calls[0][0];
    expect(errArg.statusCode).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: 'u1', email: 'a@b.com', role: 'student' }, 'not-the-real-secret');
    const { req, res, next } = mockReqRes({ headers: { authorization: `Bearer ${forged}` } as any });
    await authenticate(req, res, next);
    const errArg = next.mock.calls[0][0];
    expect(errArg.statusCode).toBe(401);
  });

  it('accepts a validly-signed token and attaches req.user', async () => {
    const token = jwt.sign(
      { id: 'user-123', email: 'student@example.com', role: 'student' },
      securityConfig.jwt.accessSecret,
      { expiresIn: '15m' }
    );
    const { req, res, next } = mockReqRes({ headers: { authorization: `Bearer ${token}` } as any });
    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(); // called with no error
    expect(req.user).toEqual({ id: 'user-123', email: 'student@example.com', role: 'student' });
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign(
      { id: 'user-123', email: 'student@example.com', role: 'student' },
      securityConfig.jwt.accessSecret,
      { expiresIn: '-10s' } // already expired
    );
    const { req, res, next } = mockReqRes({ headers: { authorization: `Bearer ${token}` } as any });
    await authenticate(req, res, next);
    const errArg = next.mock.calls[0][0];
    expect(errArg.statusCode).toBe(401);
  });
});

describe('restrictTo (RBAC)', () => {
  it('blocks a request with no authenticated user', () => {
    const { req, res, next } = mockReqRes();
    restrictTo('admin')(req, res, next);
    const errArg = next.mock.calls[0][0];
    expect(errArg.statusCode).toBe(403);
  });

  it('blocks a role that is not in the allow-list', () => {
    const { req, res, next } = mockReqRes({ user: { id: '1', role: 'student', email: 'a@b.com' } });
    restrictTo('admin', 'university')(req, res, next);
    const errArg = next.mock.calls[0][0];
    expect(errArg.statusCode).toBe(403);
    expect(errArg.errorCode).toBe('FORBIDDEN');
  });

  it('allows a role that is in the allow-list', () => {
    const { req, res, next } = mockReqRes({ user: { id: '1', role: 'employer', email: 'a@b.com' } });
    restrictTo('employer', 'admin')(req, res, next);
    expect(next).toHaveBeenCalledWith(); // no error passed through
  });

  it('does not accidentally allow every role (regression guard)', () => {
    // Every one of student/employer/university/admin, restricted to a
    // single different role, must be blocked. This guards against a future
    // refactor of restrictTo silently degrading to an always-allow check.
    const roles = ['student', 'employer', 'university', 'admin'] as const;
    for (const role of roles) {
      const other = roles.find((r) => r !== role)!;
      const { req, res, next } = mockReqRes({ user: { id: '1', role, email: 'a@b.com' } });
      restrictTo(other)(req, res, next);
      expect(next.mock.calls[0][0]?.statusCode).toBe(403);
    }
  });
});
