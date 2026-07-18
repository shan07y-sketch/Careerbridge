import { Response } from 'express';
import { EcosystemService } from './ecosystem.service';
import { catchAsync } from '../../utils/catch-async';
import { AppError } from '../../utils/app-error';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { prisma } from '../../config/database';

export class EcosystemController {
  // STUDENT
  static studentRecommendations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await EcosystemService.studentRecommendations(req.user!.id);
    res.status(200).json({ success: true, data, message: 'Personalized ecosystem recommendations retrieved.' });
  });

  // EMPLOYER
  static talentPool = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { page, pageSize, skill, university, gradYear } = req.query;
    const data = await EcosystemService.talentPool({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      skill: skill as string | undefined,
      university: university as string | undefined,
      gradYear: gradYear ? Number(gradYear) : undefined
    });
    res.status(200).json({ success: true, data, message: 'Student talent pool retrieved.' });
  });

  static rankCandidates = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const jobId = req.query.jobId as string | undefined;
    if (!jobId) throw new AppError('jobId is required', 400, 'MISSING_JOB_ID');

    // Resolve the employer's own company from their user id -- ownership guard
    // lives in the service (only ranks against the employer's own job).
    const employer = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { companyId: true } });
    if (!employer?.companyId) throw new AppError('No company associated with this employer.', 403, 'NO_COMPANY');

    const data = await EcosystemService.rankCandidates(employer.companyId, jobId, req.query.limit ? Number(req.query.limit) : 20);
    if (!data) throw new AppError('Job not found or not owned by your company.', 404, 'JOB_NOT_FOUND');
    res.status(200).json({ success: true, data, message: 'Ranked candidate matches retrieved.' });
  });

  static employerOverview = catchAsync(async (_req: AuthenticatedRequest, res: Response) => {
    const data = await EcosystemService.employerOverview();
    res.status(200).json({ success: true, data, message: 'Employer ecosystem overview retrieved.' });
  });

  // UNIVERSITY
  static universityOverview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await EcosystemService.universityOverview(req.user!.id);
    res.status(200).json({ success: true, data, message: 'University ecosystem overview retrieved.' });
  });
}
