import { Router } from 'express';
import { CoachController } from './coach.controller';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(restrictTo('student'));

router.get('/conversations', CoachController.listConversations);
router.post('/conversations', CoachController.createConversation);
router.get('/conversations/:id', CoachController.getConversation);
router.patch('/conversations/:id', CoachController.updateConversation);
router.delete('/conversations/:id', CoachController.deleteConversation);

// SSE streaming chat turn.
router.post('/chat', CoachController.streamChat);

export default router;
