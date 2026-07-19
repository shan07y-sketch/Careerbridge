import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { catchAsync } from '../../utils/catch-async';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

/**
 * Resolved version of an installed package, or null if it cannot be read.
 * Primary path is `require('<pkg>/package.json')`, but some packages (notably
 * `unpdf`) don't expose `./package.json` in their `exports` map, so that throws
 * ERR_PACKAGE_PATH_NOT_EXPORTED and previously reported a false `null` that
 * looked like a broken deploy. Fall back to resolving the entry point and
 * walking up to the owning package.json.
 */
function safeVersion(pkg: string): string | null {
  try {
    return require(`${pkg}/package.json`).version as string;
  } catch {
    // fall through to the exports-safe resolution below
  }
  try {
    let dir = path.dirname(require.resolve(pkg));
    for (let i = 0; i < 6; i++) {
      const pj = path.join(dir, 'package.json');
      if (fs.existsSync(pj)) {
        const parsed = JSON.parse(fs.readFileSync(pj, 'utf8'));
        if (parsed.name === pkg) return (parsed.version as string) ?? null;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // ignore
  }
  return null;
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
      // Which commit is actually live. Railway injects RAILWAY_GIT_COMMIT_SHA
      // at build time; without this, deploy provenance can only be inferred
      // from uptime vs. commit timestamps, which is exactly the guessing game
      // that let a pushed-but-not-deployed fix look deployed. Short SHA only;
      // not a secret. Null when the var is absent (e.g. local dev).
      commit: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
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
