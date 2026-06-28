import { Router } from 'express';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';
import { AdminController } from './admin.controller';

const router = Router();

router.use(authenticate);
router.use(restrictTo('admin'));

router.get('/users', AdminController.getUsers);
router.patch('/users/:id/suspend', AdminController.suspendUser);
router.patch('/users/:id/activate', AdminController.activateUser);
router.patch('/users/:id/verify', AdminController.verifyUser);
router.patch('/users/:id/reset-password', AdminController.resetPassword);
router.patch('/users/:id/role', AdminController.changeRole);

router.patch('/companies/:id/toggle', AdminController.toggleCompany);

router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/stats', AdminController.getGlobalStats);

router.get('/feature-flags', AdminController.getFeatureFlags);
router.patch('/feature-flags/:key', AdminController.updateFeatureFlag);

router.get('/search', AdminController.globalSearch);
router.get('/monitoring', AdminController.getSystemMonitoring);

export default router;
