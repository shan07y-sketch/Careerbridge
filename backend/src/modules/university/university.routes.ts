import { Router } from 'express';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';
import { restrictToUniversityScope } from './university.middleware';
import { UniversityController } from './university.controller';
import { validate } from '../../middlewares/validation.middleware';
import { verifyStudentSchema, createDriveSchema, updateDriveSchema, updateSettingsSchema, sendBroadcastSchema, supportRequestSchema } from './university.validation';

const router = Router();

router.use(authenticate);
router.use(restrictTo('university'));
router.use(restrictToUniversityScope);

router.get('/dashboard', UniversityController.getDashboard);
router.get('/students', UniversityController.getStudents);
router.get('/internships', UniversityController.getInternships);
router.patch('/students/:studentId/verify', validate(verifyStudentSchema), UniversityController.verifyStudent);

router.get('/drives', UniversityController.getCampusDrives);
router.post('/drives', validate(createDriveSchema), UniversityController.createCampusDrive);
router.put('/drives/:id', validate(updateDriveSchema), UniversityController.updateCampusDrive);
router.delete('/drives/:id', UniversityController.deleteCampusDrive);

router.get('/analytics', UniversityController.getAnalytics);
router.post('/analytics/ai-insight', UniversityController.generateDepartmentInsight);
router.post('/students/:studentId/ai-insight', UniversityController.assessStudentPlacement);
router.get('/students/:studentId/ai-insight', UniversityController.getLatestStudentInsight);
router.post('/drives/ai-recommendations', UniversityController.recommendCampusDrives);
router.post('/reports/ai-report', UniversityController.generatePlacementReport);

router.get('/companies', UniversityController.getCompanies);

router.get('/settings', UniversityController.getSettings);
router.put('/settings', validate(updateSettingsSchema), UniversityController.updateSettings);

router.post('/messages/broadcast', validate(sendBroadcastSchema), UniversityController.sendBroadcast);
router.get('/messages/sent', UniversityController.getSentBroadcasts);

router.post('/support', validate(supportRequestSchema), UniversityController.submitSupportRequest);

export default router;
