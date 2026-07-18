import { Router } from 'express';
import { ScheduledInterviewController } from './scheduled-interview.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ScheduledInterviewController.getScheduledInterviews);
router.get('/:id', ScheduledInterviewController.getScheduledInterviewById);

export default router;
