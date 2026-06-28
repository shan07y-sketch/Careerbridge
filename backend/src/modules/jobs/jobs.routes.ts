import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', JobsController.getJobs);
router.get('/saved', authenticate, JobsController.getSavedJobs);
router.get('/:id', JobsController.getJobById);
router.post('/:id/save', authenticate, JobsController.toggleSaveJob);

export default router;
