import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.post('/education', ProfileController.addEducation);
router.post('/experience', ProfileController.addExperience);
router.post('/projects', ProfileController.addProject);
router.post('/skills', ProfileController.addSkill);
router.post('/certifications', ProfileController.addCertification);

export default router;
