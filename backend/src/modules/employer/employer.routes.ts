import { Router } from 'express';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';
import { restrictToCompany } from './employer.middleware';
import { EmployerController } from './employer.controller';

const router = Router();

// Secure all routes under company context
router.use(authenticate);
router.use(restrictTo('employer'));
router.use(restrictToCompany);

router.get('/dashboard', EmployerController.getDashboard);
router.get('/company', EmployerController.getCompanyProfile);
router.put('/company', EmployerController.updateCompanyProfile);

router.get('/recruiters', EmployerController.getRecruiters);
router.post('/recruiters/invite', EmployerController.inviteRecruiter);

router.get('/jobs', EmployerController.getJobs);
router.post('/jobs', EmployerController.createJob);
router.put('/jobs/:id', EmployerController.updateJob);

router.get('/applications', EmployerController.getApplications);
router.patch('/applications/:id/stage', EmployerController.updateApplicationStage);
router.get('/resumes/:id/preview', EmployerController.previewResume);

router.get('/analytics', EmployerController.getAnalytics);

export default router;
