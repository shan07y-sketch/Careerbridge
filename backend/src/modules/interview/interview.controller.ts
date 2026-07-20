import { Response } from 'express';
import { z } from 'zod';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { InterviewService } from './interview.service';
import { AppError } from '../../utils/app-error';

type MulterFiles = { [fieldname: string]: Express.Multer.File[] };

const startSchema = z.object({
  interviewType: z.enum(['HR', 'TECHNICAL', 'BEHAVIORAL', 'APTITUDE', 'MIXED']).default('MIXED'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  numQuestions: z.coerce.number().int().min(3).max(12).default(6),
  jobId: z.string().uuid().optional(),
  jobTitle: z.string().trim().min(2).max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  targetRole: z.string().trim().max(120).optional()
});
// No job identifier is required to start a session. This used to demand
// `jobId || jobTitle`, which made the mobile mock interview impossible to
// start: that screen offers a single "Target role (optional)" field and sends
// it as `targetRole`, so the check failed on every attempt and reported two
// field names the mobile UI does not even have.
//
// InterviewContextService already resolves the role through a documented
// fallback chain (explicit job -> jobTitle -> the student's preferredRole ->
// a sensible default), so an unspecified session is still personalised rather
// than empty. The desktop screen keeps its own stricter guard.

const answerSchema = z.object({
  questionIndex: z.coerce.number().int().min(0).max(50),
  transcript: z.string().trim().min(1, 'An answer transcript is required.').max(20000),
  answerMethod: z.enum(['voice', 'text']).default('voice'),
  durationSec: z.coerce.number().min(0).max(3600).optional()
});

const observationSchema = z.object({
  type: z.string().trim().min(1).max(60),
  detail: z.string().trim().max(200).optional()
});

export class InterviewController {
  static startInterview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid interview setup.', 400, 'VALIDATION_ERROR');
    }
    const result = await InterviewService.startInterview(req.user!.id, parsed.data);
    res.status(201).json({ success: true, data: result, message: 'Mock interview session started.' });
  });

  static submitAnswer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = answerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid answer payload.', 400, 'VALIDATION_ERROR');
    }
    const files = req.files as MulterFiles | undefined;
    const result = await InterviewService.submitAnswer(req.user!.id, req.params.id, parsed.data.questionIndex, {
      transcript: parsed.data.transcript,
      answerMethod: parsed.data.answerMethod,
      durationSec: parsed.data.durationSec,
      audioFile: files?.audio?.[0],
      videoFile: files?.video?.[0]
    });
    res.status(200).json({ success: true, data: result, message: 'Answer evaluated.' });
  });

  static addObservation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = observationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid observation payload.', 400, 'VALIDATION_ERROR');
    }
    const result = await InterviewService.addObservation(req.user!.id, req.params.id, parsed.data.type, parsed.data.detail);
    res.status(200).json({ success: true, data: result });
  });

  static endInterview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await InterviewService.endInterview(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: result, message: 'Interview report generated.' });
  });

  static getHistory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await InterviewService.getHistory(req.user!.id);
    res.status(200).json({ success: true, data: result });
  });

  static getSessionDetail = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await InterviewService.getSessionDetail(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  });

  static downloadReportPdf = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { buffer, fileName } = await InterviewService.getReportPdf(req.user!.id, req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.status(200).end(buffer);
  });

  static setSharing = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const shared = req.body?.shared;
    if (typeof shared !== 'boolean') {
      throw new AppError('`shared` must be a boolean.', 400, 'VALIDATION_ERROR');
    }
    const result = await InterviewService.setSharing(req.user!.id, req.params.id, shared);
    res.status(200).json({
      success: true,
      data: result,
      message: shared ? 'Report shared with employers you applied to.' : 'Report sharing disabled.'
    });
  });
}
