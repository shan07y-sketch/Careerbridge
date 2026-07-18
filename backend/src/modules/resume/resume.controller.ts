import { Response } from 'express';
import { ResumeService } from './resume.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';

export class ResumeController {
  static getResumeHistory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await ResumeService.getResumeHistory(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: list.length ? 'Resume version history retrieved.' : 'No resumes uploaded yet.'
    });
  });

  static getResumeDetail = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const resume = await ResumeService.getResumeDetail(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: resume, message: 'Resume detail retrieved.' });
  });

  static uploadResume = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No resume file uploaded.', 400, 'FILE_REQUIRED');
    }
    const item = await ResumeService.uploadResume(req.user!.id, req.file);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Resume uploaded successfully as a new version.'
    });
  });

  static deleteResume = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await ResumeService.deleteResume(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Resume version deleted successfully.'
    });
  });

  static downloadResume = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const target = await ResumeService.getDownloadTarget(req.user!.id, req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename="${target.fileName}"`);
    res.setHeader('Content-Type', target.mimeType);
    res.sendFile(target.absolutePath);
  });

  static createShareLink = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await ResumeService.createShareLink(req.user!.id, req.params.id);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Share link created. Anyone with this link can view the resume until it expires or is revoked.'
    });
  });

  static revokeShareLink = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await ResumeService.revokeShareLink(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: {}, message: 'Share link revoked.' });
  });
}
