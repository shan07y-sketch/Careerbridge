import { Router } from 'express';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';
import { restrictToUniversityScope } from './university.middleware';
import { UniversityController } from './university.controller';

const router = Router();

router.use(authenticate);
router.use(restrictTo('university'));
router.use(restrictToUniversityScope);

router.get('/dashboard', UniversityController.getDashboard);
router.get('/students', UniversityController.getStudents);
router.patch('/students/:studentId/verify', UniversityController.verifyStudent);

router.get('/drives', UniversityController.getCampusDrives);
router.post('/drives', UniversityController.createCampusDrive);
router.put('/drives/:id', UniversityController.updateCampusDrive);

router.get('/analytics', UniversityController.getAnalytics);
router.get('/ai-insights', UniversityController.getAIInsights);

export default router;
