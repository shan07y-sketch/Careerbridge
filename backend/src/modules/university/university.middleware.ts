import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { catchAsync } from '../../utils/catch-async';
import { UniversityRequest } from './university.types';

export const restrictToUniversityScope = catchAsync(async (req: UniversityRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'university') {
    return next(new AppError('Only university officers can access campus admin portals.', 403, 'FORBIDDEN'));
  }

  const university = await prisma.university.findUnique({
    where: { userId: req.user.id }
  });

  if (!university) {
    return next(new AppError('No university profile associated with this account.', 403, 'NO_UNIVERSITY_PROFILE'));
  }

  req.universityId = university.id;
  next();
});
