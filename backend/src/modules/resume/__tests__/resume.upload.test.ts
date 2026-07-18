import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { securityConfig } from '../../../config/security';
import { errorHandler } from '../../../middlewares/error.middleware';

// ResumeController is mocked so this test exercises exactly the upload
// pipeline in front of it: authentication + multer's MIME/extension
// allow-list + filename sanitization (the resume-upload security controls
// called out in the Phase 0 audit). No database or storage write happens.
vi.mock('../resume.controller', () => ({
  ResumeController: {
    getResumeHistory: (req: any, res: any) => res.status(200).json({ success: true, data: [] }),
    getResumeDetail: (req: any, res: any) => res.status(200).json({ success: true, data: {} }),
    uploadResume: vi.fn((req: any, res: any) => {
      res.status(201).json({
        success: true,
        data: { fileName: req.file?.originalname }
      });
    }),
    deleteResume: (req: any, res: any) => res.status(200).json({ success: true }),
    downloadResume: (req: any, res: any) => res.status(200).json({ success: true }),
    createShareLink: (req: any, res: any) => res.status(201).json({ success: true, data: {} }),
    revokeShareLink: (req: any, res: any) => res.status(200).json({ success: true })
  }
}));

import resumeRoutes from '../resume.routes';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/student/resume', resumeRoutes);
  app.use(errorHandler);
  return app;
}

function authHeader() {
  const token = jwt.sign({ id: 'student-1', email: 's@example.com', role: 'student' }, securityConfig.jwt.accessSecret, {
    expiresIn: '15m'
  });
  return `Bearer ${token}`;
}

describe('POST /student/resume/upload', () => {
  let app: express.Express;
  beforeEach(() => {
    app = buildApp();
  });

  it('rejects the request with no auth token', async () => {
    const res = await request(app).post('/api/v1/student/resume/upload').attach('resume', Buffer.from('%PDF-1.4'), 'resume.pdf');
    expect(res.status).toBe(401);
  });

  it('rejects a disallowed file type (e.g. .exe)', async () => {
    const res = await request(app)
      .post('/api/v1/student/resume/upload')
      .set('Authorization', authHeader())
      .attach('resume', Buffer.from('not a resume'), { filename: 'malware.exe', contentType: 'application/x-msdownload' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('rejects a mismatched extension even with an allowed MIME type spoofed', async () => {
    const res = await request(app)
      .post('/api/v1/student/resume/upload')
      .set('Authorization', authHeader())
      .attach('resume', Buffer.from('%PDF-1.4'), { filename: 'resume.exe', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('accepts a valid PDF and reaches the controller', async () => {
    const res = await request(app)
      .post('/api/v1/student/resume/upload')
      .set('Authorization', authHeader())
      .attach('resume', Buffer.from('%PDF-1.4'), { filename: 'my-resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.fileName).toBe('my-resume.pdf');
  });

  it('sanitizes a path-traversal filename before it reaches the controller', async () => {
    const res = await request(app)
      .post('/api/v1/student/resume/upload')
      .set('Authorization', authHeader())
      .attach('resume', Buffer.from('%PDF-1.4'), { filename: '../../etc/passwd.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    // path.basename + character-stripping must remove any path separators
    expect(res.body.data.fileName).not.toContain('/');
    expect(res.body.data.fileName).not.toContain('..');
  });

  it('rejects a file over the 5MB limit', async () => {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await request(app)
      .post('/api/v1/student/resume/upload')
      .set('Authorization', authHeader())
      .attach('resume', oversized, { filename: 'big.pdf', contentType: 'application/pdf' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
