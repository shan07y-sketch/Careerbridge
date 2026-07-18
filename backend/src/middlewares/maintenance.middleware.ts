import { Request, Response, NextFunction } from 'express';
import { FeatureFlagsService } from '../modules/admin/feature-flags.service';
import { logger } from '../config/logger';

/**
 * Real maintenance-mode enforcement, backed by the `maintenanceMode`
 * FeatureFlag row an admin toggles from the Command Center. When active,
 * every request is rejected with 503 EXCEPT: admin-namespace routes (so an
 * administrator can still operate the platform and turn maintenance mode
 * back off), auth routes (so an admin can still log in), and the health
 * check (so infrastructure monitoring doesn't misreport an outage).
 *
 * This reads the flag on every request rather than caching it in memory --
 * a stale in-memory cache would mean "flip maintenance mode off" doesn't
 * take effect until a restart, defeating the point of a live toggle.
 */
export async function maintenanceModeGuard(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl || req.url;
  const isExempt =
    path.startsWith('/health') ||
    path.includes('/api/v1/admin') ||
    path.includes('/api/v1/auth');

  if (isExempt) {
    return next();
  }

  try {
    const isMaintenanceMode = await FeatureFlagsService.getFlag('maintenanceMode');
    if (isMaintenanceMode) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'CareerBridge is currently undergoing scheduled maintenance. Please check back shortly.',
          code: 'MAINTENANCE_MODE'
        }
      });
    }
  } catch (err) {
    // If the flag can't be read, fail open rather than taking down the
    // whole platform because of a transient DB blip on this one check.
    logger.warn({ err }, 'Failed to evaluate maintenance mode flag; allowing request through.');
  }

  next();
}
