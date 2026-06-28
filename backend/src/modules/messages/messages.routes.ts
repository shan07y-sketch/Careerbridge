import { Router } from 'express';
import { MessagesController } from './messages.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', MessagesController.getConversations);
router.post('/start', MessagesController.startConversation);
router.get('/:conversationId', MessagesController.getMessages);
router.post('/:conversationId', MessagesController.sendMessage);

export default router;
