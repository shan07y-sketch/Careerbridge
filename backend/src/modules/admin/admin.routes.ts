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

router.get('/companies', AdminController.getCompanies);
router.patch('/companies/:id/toggle', AdminController.toggleCompany);
router.patch('/companies/:id/verify', AdminController.verifyCompany);

router.get('/universities', AdminController.getUniversities);
router.patch('/universities/:id/toggle', AdminController.toggleUniversity);
router.patch('/universities/:id/verify', AdminController.verifyUniversity);

router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/stats', AdminController.getGlobalStats);

router.get('/feature-flags', AdminController.getFeatureFlags);
router.patch('/feature-flags/:key', AdminController.updateFeatureFlag);

router.get('/search', AdminController.globalSearch);
router.get('/monitoring', AdminController.getSystemMonitoring);

router.get('/announcements', AdminController.getAnnouncements);
router.post('/announcements', AdminController.createAnnouncement);
router.patch('/announcements/:id/active', AdminController.setAnnouncementActive);
router.delete('/announcements/:id', AdminController.deleteAnnouncement);

router.get('/support-tickets', AdminController.getSupportTickets);
router.patch('/support-tickets/:id', AdminController.updateSupportTicket);

router.get('/sessions', AdminController.getActiveSessions);
router.delete('/sessions/:id', AdminController.revokeSession);
router.delete('/sessions/family/:family', AdminController.revokeSessionFamily);

router.post('/ai/fraud-detection', AdminController.detectFraudSignals);
router.get('/ai/fraud-detection', AdminController.getLatestFraudReport);

router.post('/ai/platform-insights', AdminController.generatePlatformInsights);
router.get('/ai/platform-insights', AdminController.getLatestPlatformInsights);

router.post('/ai/moderation', AdminController.getModerationRecommendations);
router.get('/ai/moderation', AdminController.getLatestModerationReport);

router.post('/ai/system-health', AdminController.generateSystemHealthSummary);
router.get('/ai/system-health', AdminController.getLatestSystemHealthReport);

router.post('/ai/executive-report', AdminController.generateExecutiveReport);
router.get('/ai/executive-report/:reportType', AdminController.getLatestExecutiveReport);

router.post('/ai/predictive-analytics', AdminController.generatePredictiveAnalytics);
router.get('/ai/predictive-analytics', AdminController.getLatestPredictiveAnalytics);

export default router;
