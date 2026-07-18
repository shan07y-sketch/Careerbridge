import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { securityConfig } from '../../../config/security';
import { errorHandler } from '../../../middlewares/error.middleware';

// Regression test for the Phase 0 audit's Critical finding: the AI module's
// routes were the only feature-module routes in the whole API not gated by
// `authenticate`. This locks in that /analyze-test now requires a logged-in
// admin, and that /health remains public (intentionally — it's a status
// check, matching every other module's /health convention).

vi.mock('../ai-orchestrator', () => ({
  AIOrchestrator: { runAnalysis: vi.fn().mockResolvedValue({ result: 'mocked' }) }
}));

import aiRoutes from '../ai.routes';

function buildApp() {
  const app = express();
  app.use(express.json());
  process.env.NODE_ENV_ORIGINAL = process.env.NODE_ENV;
  app.use('/api/v1/ai', aiRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(role: 'student' | 'admin') {
  return jwt.sign({ id: 'u1', email: 'u@example.com', role }, securityConfig.jwt.accessSecret, { expiresIn: '15m' });
}

describe('GET /api/v1/ai/health', () => {
  it('is publicly reachable with no auth', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/ai/health');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/ai/analyze-test', () => {
  it('rejects an unauthenticated request', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/v1/ai/analyze-test').send({ text: 'hi' });
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin authenticated request', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/ai/analyze-test')
      .set('Authorization', `Bearer ${tokenFor('student')}`)
      .send({ text: 'hi' });
    expect(res.status).toBe(403);
  });

  it('is disabled outright in production, even for an admin', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { default: prodAiRoutes } = await import('../ai.routes');
    const app = express();
    app.use(express.json());
    app.use('/api/v1/ai', prodAiRoutes);
    app.use(errorHandler);

    const res = await request(app)
      .post('/api/v1/ai/analyze-test')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ text: 'hi' });

    expect(res.status).toBe(404);
    process.env.NODE_ENV = previous;
    vi.resetModules();
  });

  it('allows an admin request outside production', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/ai/analyze-test')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ text: 'hi' });
    expect(res.status).toBe(200);
  });
});
