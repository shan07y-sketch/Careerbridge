import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

// AuthRepository and EmailService are mocked so these tests exercise
// AuthService's business logic in isolation, with no real database or SMTP
// connection required. This is a deliberate choice for this first test
// pass (see Phase 0 audit — no test DB is provisioned in CI yet); it still
// gives real regression coverage over the security-critical refresh-token
// rotation logic added in this phase.

vi.mock('../auth.repository', () => ({
  AuthRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeTokenFamily: vi.fn(),
    registerUser: vi.fn(),
    updateLastLogin: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../../shared/email.service', () => ({
  EmailService: {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn()
  }
}));

import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';

const mockedRepo = vi.mocked(AuthRepository);

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects registration when the email is already in use', async () => {
    mockedRepo.findUserByEmail.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      AuthService.register({ email: 'taken@example.com', password: 'Password1!', role: 'STUDENT' })
    ).rejects.toMatchObject({ statusCode: 400, errorCode: 'DUPLICATE_EMAIL' });

    expect(mockedRepo.registerUser).not.toHaveBeenCalled();
  });

  it('hashes the password before persisting a new user', async () => {
    mockedRepo.findUserByEmail.mockResolvedValue(null);
    mockedRepo.registerUser.mockResolvedValue({ id: 'new-user', email: 'new@example.com' } as any);

    await AuthService.register({ email: 'new@example.com', password: 'Password1!', role: 'STUDENT' });

    const passedArgs = mockedRepo.registerUser.mock.calls[0][0];
    expect(passedArgs.passwordHash).toBeDefined();
    expect(passedArgs.passwordHash).not.toBe('Password1!');
    expect(await bcrypt.compare('Password1!', passedArgs.passwordHash)).toBe(true);
  });
});

describe('AuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an unknown email without revealing whether the account exists', async () => {
    mockedRepo.findUserByEmail.mockResolvedValue(null);
    await expect(AuthService.login({ email: 'nobody@example.com', password: 'x' })).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'AUTHENTICATION_FAILED'
    });
  });

  it('rejects a correct email with the wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    mockedRepo.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      passwordHash,
      isVerified: true,
      role: 'STUDENT'
    } as any);

    await expect(AuthService.login({ email: 'user@example.com', password: 'wrong-password' })).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'AUTHENTICATION_FAILED'
    });
  });

  it('rejects a correct password for an unverified account', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    mockedRepo.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      passwordHash,
      isVerified: false,
      role: 'STUDENT'
    } as any);

    await expect(AuthService.login({ email: 'user@example.com', password: 'correct-password' })).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'EMAIL_NOT_VERIFIED'
    });
  });

  it('issues an access + refresh token pair on valid credentials, tagging the refresh token with a session family', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    mockedRepo.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      passwordHash,
      isVerified: true,
      role: 'STUDENT'
    } as any);

    const result = await AuthService.login({ email: 'user@example.com', password: 'correct-password' });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockedRepo.createRefreshToken).toHaveBeenCalledTimes(1);
    const [userId, token, , family] = mockedRepo.createRefreshToken.mock.calls[0];
    expect(userId).toBe('u1');
    expect(token).toBe(result.refreshToken);
    expect(family).toBeDefined();
  });
});

describe('AuthService.refresh — rotation and reuse detection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an unknown refresh token', async () => {
    mockedRepo.findRefreshToken.mockResolvedValue(null);
    await expect(AuthService.refresh('does-not-exist')).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'INVALID_REFRESH_TOKEN'
    });
  });

  it('rejects an expired-but-not-revoked refresh token', async () => {
    mockedRepo.findRefreshToken.mockResolvedValue({
      token: 't1',
      userId: 'u1',
      family: 'fam-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() - 1000)
    } as any);

    await expect(AuthService.refresh('t1')).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'INVALID_REFRESH_TOKEN'
    });
  });

  it('rotates a valid refresh token: mints a new one and revokes the presented one', async () => {
    mockedRepo.findRefreshToken.mockResolvedValue({
      token: 't1',
      userId: 'u1',
      family: 'fam-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60)
    } as any);
    mockedRepo.findUserById.mockResolvedValue({ id: 'u1', email: 'user@example.com', role: 'STUDENT' } as any);

    const result = await AuthService.refresh('t1');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe('t1');
    expect(mockedRepo.rotateRefreshToken).toHaveBeenCalledWith('t1', result.refreshToken, expect.any(Date), 'fam-1', 'u1');
    expect(mockedRepo.revokeTokenFamily).not.toHaveBeenCalled();
  });

  it('detects reuse of an already-revoked refresh token and burns the whole family', async () => {
    mockedRepo.findRefreshToken.mockResolvedValue({
      token: 't1-old',
      userId: 'u1',
      family: 'fam-1',
      isRevoked: true, // this token was already rotated away once
      expiresAt: new Date(Date.now() + 1000 * 60 * 60)
    } as any);

    await expect(AuthService.refresh('t1-old')).rejects.toMatchObject({
      statusCode: 401,
      errorCode: 'REFRESH_TOKEN_REUSE_DETECTED'
    });

    expect(mockedRepo.revokeTokenFamily).toHaveBeenCalledWith('fam-1');
    expect(mockedRepo.rotateRefreshToken).not.toHaveBeenCalled();
  });
});
