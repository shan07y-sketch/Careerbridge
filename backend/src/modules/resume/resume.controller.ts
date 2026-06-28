import { Response } from 'express';
import { ResumeService } from './resume.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';

export class ResumeController {
  static getResumes = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await ResumeService.getResumes(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Student uploaded resumes list retrieved.'
    });
  });

  static uploadResume = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No resume file uploaded.', 400, 'FILE_REQUIRED');
    }
    const item = await ResumeService.uploadResume(req.user!.id, req.file);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Resume uploaded successfully.'
    });
  });

  static deleteResume = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await ResumeService.deleteResume(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Resume deleted successfully.'
    });
  });
}
