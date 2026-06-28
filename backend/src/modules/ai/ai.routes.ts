import { Router } from 'express';
import { AIController } from './ai.controller';

const router = Router();

router.get('/health', AIController.getHealth);
router.post('/analyze-test', AIController.analyzeTest);

export default router;
