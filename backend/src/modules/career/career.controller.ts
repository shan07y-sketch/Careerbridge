import { Response } from 'express';
import { CareerService } from './career.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class CareerController {
  static getCareerInsights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await CareerService.getCareerInsights(req.user!.id);
    res.status(200).json({
      success: true,
      data: list[0] || null,
      message: 'Student AI career insights retrieved.'
    });
  });

  static getMockInterviewReports = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await CareerService.getMockInterviewReports(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Student mock interview reports list retrieved.'
    });
  });

  static generateInsight = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { targetRole } = req.body as { targetRole?: string };
    const insight = await CareerService.generateCareerInsight(req.user!.id, targetRole ?? '');
    res.status(201).json({
      success: true,
      data: insight,
      message: 'Career readiness insight generated.'
    });
  });
}
