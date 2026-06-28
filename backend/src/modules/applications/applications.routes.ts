import { Router } from 'express';
import { ApplicationsController } from './applications.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ApplicationsController.getApplications);
router.post('/', ApplicationsController.applyToJob);
router.get('/:id', ApplicationsController.getApplicationById);
router.delete('/:id', ApplicationsController.retractApplication);

export default router;
