import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ResumeService } from './resume.service';
import { catchAsync } from '../../utils/catch-async';

/**
 * Public resume share links. Deliberately NOT mounted behind `authenticate`
 * -- that's the point of a share link (a recruiter who was emailed the URL
 * shouldn't need a CareerBridge account to view it) -- but every access is
 * still audit-logged (see ResumeService.resolveSharedResume) and gated on
 * the link being both enabled and unexpired. Rate-limited to blunt token
 * brute-forcing, since the token itself is the only access control here.
 */
const router = Router();

const shareViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' }
  }
});

router.get(
  '/:token',
  shareViewLimiter,
  catchAsync(async (req: Request, res: Response) => {
    const target = await ResumeService.resolveSharedResume(req.params.token);
    res.setHeader('Content-Type', target.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${target.fileName}"`);
    res.sendFile(target.absolutePath);
  })
);

export default router;
