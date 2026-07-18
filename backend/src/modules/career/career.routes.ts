import { Router } from 'express';
import { CareerController } from './career.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/insights', CareerController.getCareerInsights);
router.get('/mock-interviews', CareerController.getMockInterviewReports);
router.post('/insight', CareerController.generateInsight);

export default router;
