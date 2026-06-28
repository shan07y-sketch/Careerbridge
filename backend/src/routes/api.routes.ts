import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import authRoutes from '../modules/auth/auth.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import profileRoutes from '../modules/profile/profile.routes';
import jobsRoutes from '../modules/jobs/jobs.routes';
import applicationsRoutes from '../modules/applications/applications.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import messagesRoutes from '../modules/messages/messages.routes';
import resumeRoutes from '../modules/resume/resume.routes';
import careerRoutes from '../modules/career/career.routes';
import aiRoutes from '../modules/ai/ai.routes';
import employerRoutes from '../modules/employer/employer.routes';
import universityRoutes from '../modules/university/university.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/student/profile', profileRoutes);
router.use('/jobs', jobsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/messages', messagesRoutes);
router.use('/resume', resumeRoutes);
router.use('/career', careerRoutes);
router.use('/ai', aiRoutes);
router.use('/employer', employerRoutes);
router.use('/university', universityRoutes);
router.use('/admin', adminRoutes);

export default router;
