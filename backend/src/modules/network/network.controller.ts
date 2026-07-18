import { Response } from 'express';
import { NetworkService } from './network.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';

export class NetworkController {
  static getConnections = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const connections = await NetworkService.listConnections(req.user!.id);
    res.status(200).json({
      success: true,
      data: connections,
      message: 'Network connections retrieved.'
    });
  });

  static requestConnection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { targetStudentProfileId } = req.body;
    if (!targetStudentProfileId || typeof targetStudentProfileId !== 'string') {
      throw new AppError('targetStudentProfileId is required.', 400, 'VALIDATION_ERROR');
    }
    const connection = await NetworkService.requestConnection(req.user!.id, targetStudentProfileId);
    res.status(201).json({
      success: true,
      data: connection,
      message: 'Connection request sent.'
    });
  });

  static acceptConnection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const connection = await NetworkService.respondToConnection(req.user!.id, req.params.id, 'accept');
    res.status(200).json({
      success: true,
      data: connection,
      message: 'Connection request accepted.'
    });
  });

  static declineConnection = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const connection = await NetworkService.respondToConnection(req.user!.id, req.params.id, 'decline');
    res.status(200).json({
      success: true,
      data: connection,
      message: 'Connection request declined.'
    });
  });
}
