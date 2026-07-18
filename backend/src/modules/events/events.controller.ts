import { Response, Request } from 'express';
import { EventsService } from './events.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class EventsController {
  static getEvents = catchAsync(async (req: Request, res: Response) => {
    const events = await EventsService.getEvents();
    res.status(200).json({ success: true, data: events, message: 'Events retrieved.' });
  });

  static getEventById = catchAsync(async (req: Request, res: Response) => {
    const event = await EventsService.getEventById(req.params.id);
    res.status(200).json({ success: true, data: event, message: 'Event retrieved.' });
  });

  static registerForEvent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await EventsService.registerForEvent(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: result, message: 'Registered for event.' });
  });

  static unregisterFromEvent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await EventsService.unregisterFromEvent(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: {}, message: 'Unregistered from event.' });
  });
}
