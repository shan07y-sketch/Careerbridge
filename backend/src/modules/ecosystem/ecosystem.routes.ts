import { Router } from 'express';
import { EcosystemController } from './ecosystem.controller';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';

/**
 * Role-gated ecosystem discovery. All endpoints are READ-ONLY and require
 * authentication. Discovery shape is scoped to the role that is allowed to see
 * it -- students cannot reach the employer talent pool, etc. No write path
 * here, so existing ownership/permission rules are untouched.
 */
const router = Router();
router.use(authenticate);

// STUDENT ecosystem
router.get('/student/recommendations', restrictTo('student'), EcosystemController.studentRecommendations);

// EMPLOYER ecosystem
router.get('/employer/talent-pool', restrictTo('employer'), EcosystemController.talentPool);
router.get('/employer/candidate-matches', restrictTo('employer'), EcosystemController.rankCandidates);
router.get('/employer/overview', restrictTo('employer'), EcosystemController.employerOverview);

// UNIVERSITY ecosystem
router.get('/university/overview', restrictTo('university'), EcosystemController.universityOverview);

export default router;
