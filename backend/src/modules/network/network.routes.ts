import { Router } from 'express';
import { NetworkController } from './network.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/connections', NetworkController.getConnections);
router.post('/connect', NetworkController.requestConnection);
router.patch('/connections/:id/accept', NetworkController.acceptConnection);
router.patch('/connections/:id/decline', NetworkController.declineConnection);

export default router;
