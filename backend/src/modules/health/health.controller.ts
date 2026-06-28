import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

export const getHealth = catchAsync(async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      database: dbStatus
    },
    message: 'Operational health status verified.'
  });
});
