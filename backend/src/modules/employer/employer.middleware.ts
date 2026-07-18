import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { catchAsync } from '../../utils/catch-async';
import { EmployerRequest } from './employer.types';

export const restrictToCompany = catchAsync(async (req: EmployerRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'employer') {
    return next(new AppError('Only employers can access company dashboard portals.', 403, 'FORBIDDEN'));
  }

  const recruiter = await prisma.recruiter.findUnique({
    where: { userId: req.user.id }
  });

  if (!recruiter) {
    return next(new AppError('No recruiter profile associated with this account.', 403, 'NO_RECRUITER_PROFILE'));
  }

  req.companyId = recruiter.companyId;
  req.recruiterId = recruiter.id;
  next();
});
