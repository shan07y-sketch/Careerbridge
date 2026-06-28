import { Response } from 'express';
import { ApplicationsService } from './applications.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class ApplicationsController {
  static getApplications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await ApplicationsService.getApplications(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Student job applications list retrieved.'
    });
  });

  static getApplicationById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const app = await ApplicationsService.getApplicationById(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: app,
      message: 'Application tracking timeline retrieved.'
    });
  });

  static applyToJob = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const app = await ApplicationsService.applyToJob(req.user!.id, req.body.jobId, req.body.coverLetter);
    res.status(201).json({
      success: true,
      data: app,
      message: 'Application submitted successfully.'
    });
  });

  static retractApplication = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await ApplicationsService.retractApplication(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Application retracted successfully.'
    });
  });
}
