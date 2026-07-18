import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';
import { env } from '../../config/env';

const router = Router();

// Unlike every other feature module, these routes were previously reachable
// with no login at all. /health is safe to leave public (it reports status
// only, matching standard health-check convention), but /analyze-test
// triggers a real AIOrchestrator call - once a real provider key is
// configured, an anonymous, unrestricted endpoint like that is a direct
// cost/abuse vector (anyone can spam it to run up API billing). It's also a
// dev/QA tool, not a product feature, so it's additionally disabled outright
// in production regardless of role.
router.get('/health', AIController.getHealth);

router.post(
  '/analyze-test',
  authenticate,
  restrictTo('admin'),
  (req, res, next) => {
    if (env.NODE_ENV === 'production') {
      return next(new AppError('This diagnostic endpoint is disabled in production.', 404, 'NOT_FOUND'));
    }
    next();
  },
  AIController.analyzeTest
);

export default router;
