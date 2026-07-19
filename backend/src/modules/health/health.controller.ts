import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

/** Resolved version of an installed package, or null if it cannot be read. */
function safeVersion(pkg: string): string | null {
  try {
    return require(`${pkg}/package.json`).version as string;
  } catch {
    return null;
  }
}

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
      database: dbStatus,
      // Runtime identity. Not decorative: pdf-parse silently fails to extract
      // text on Node 22 but works on Node 24, so "which Node is production
      // actually running" is a question we have had to answer the hard way.
      // Neither value is a secret.
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      // Resolved versions of the parsers behind resume extraction. The build
      // uses `npm install`, not `npm ci`, so what ships is not guaranteed to
      // match the committed lockfile - and a parser version mismatch is
      // otherwise invisible from outside the container.
      deps: {
        unpdf: safeVersion('unpdf'),
        mammoth: safeVersion('mammoth')
      }
    },
    message: 'Operational health status verified.'
  });
});
