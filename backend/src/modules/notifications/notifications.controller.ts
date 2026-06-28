import { Response } from 'express';
import { NotificationsService } from './notifications.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class NotificationsController {
  static getNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await NotificationsService.getNotifications(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Student notifications retrieved.'
    });
  });

  static markAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await NotificationsService.markAsRead(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Notification marked as read.'
    });
  });

  static markAllAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await NotificationsService.markAllAsRead(req.user!.id);
    res.status(200).json({
      success: true,
      data: {},
      message: 'All notifications marked as read.'
    });
  });

  static deleteNotification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await NotificationsService.deleteNotification(req.user!.id, req.params.id);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Notification deleted successfully.'
    });
  });
}
