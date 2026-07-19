import { Response } from 'express';
import { CoverLetterService } from './cover-letter.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class CoverLetterController {
  static list = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const letters = await CoverLetterService.list(req.user!.id);
    res.status(200).json({
      success: true,
      data: letters,
      message: 'Cover letters retrieved.'
    });
  });

  static getById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const letter = await CoverLetterService.getById(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: letter,
      message: 'Cover letter retrieved.'
    });
  });

  static generate = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { jobId, targetRole, companyName, tone } = req.body as {
      jobId?: string;
      targetRole?: string;
      companyName?: string;
      tone?: string;
    };
    const letter = await CoverLetterService.generate(req.user!.id, { jobId, targetRole, companyName, tone });
    res.status(201).json({
      success: true,
      data: letter,
      message: 'Cover letter generated.'
    });
  });

  static remove = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await CoverLetterService.delete(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Cover letter deleted.'
    });
  });
}
