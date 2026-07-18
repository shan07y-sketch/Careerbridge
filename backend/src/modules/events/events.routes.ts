import { Router } from 'express';
import { EventsController } from './events.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Public events list + detail
router.get('/', EventsController.getEvents);
router.get('/:id', EventsController.getEventById);

// Registration requires authentication
router.post('/:id/register', authenticate, EventsController.registerForEvent);
router.delete('/:id/register', authenticate, EventsController.unregisterFromEvent);

export default router;
