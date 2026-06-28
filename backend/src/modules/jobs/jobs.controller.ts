import { Response } from 'express';
import { JobsService } from './jobs.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { getPaginationParams, formatPaginatedResult } from '../../utils/pagination';

export class JobsController {
  static getJobs = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const params = getPaginationParams(req);
    const filters = {
      workMode: req.query.workMode,
      jobType: req.query.jobType,
      location: req.query.location
    };

    const { records, totalRecords } = await JobsService.getJobs(params, filters);
    const payload = formatPaginatedResult(records, totalRecords, params, 'Jobs list retrieved.');
    res.status(200).json(payload);
  });

  static getJobById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const job = await JobsService.getJobById(req.params.id);
    let isSaved = false;
    if (req.user) {
      isSaved = await JobsService.isJobSaved(req.user.id, job.id);
    }
    res.status(200).json({
      success: true,
      data: {
        ...job,
        isSaved
      },
      message: 'Job posting details retrieved.'
    });
  });

  static toggleSaveJob = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await JobsService.toggleSaveJob(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result,
      message: result.saved ? 'Job added to saved list.' : 'Job removed from saved list.'
    });
  });

  static getSavedJobs = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await JobsService.getSavedJobs(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Saved jobs list retrieved.'
    });
  });
}
