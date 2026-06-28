import { Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AdminService } from './admin.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class AdminController {
  static getUsers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await AdminService.getUsers(page, limit);
    res.status(200).json({ success: true, data });
  });

  static suspendUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.suspendUser(req.user!.id, req.params.id, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'User suspended successfully.' });
  });

  static activateUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.activateUser(req.user!.id, req.params.id, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'User activated successfully.' });
  });

  static verifyUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.verifyUser(req.user!.id, req.params.id, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'User verified successfully.' });
  });

  static resetPassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.resetUserPassword(req.user!.id, req.params.id, req.body.password, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'Password reset completed.' });
  });

  static changeRole = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.changeUserRole(req.user!.id, req.params.id, req.body.role, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'User role updated.' });
  });

  static toggleCompany = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.toggleCompanyState(req.user!.id, req.params.id, req.body.deactivate, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'Company visibility toggled.' });
  });

  static getAuditLogs = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      userId: req.query.userId as string,
      action: req.query.action as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };
    const data = await AdminService.getAuditLogs(filters, page, limit);
    res.status(200).json({ success: true, data });
  });

  static getGlobalStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getGlobalStats();
    res.status(200).json({ success: true, data });
  });

  static getFeatureFlags = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getFeatureFlags();
    res.status(200).json({ success: true, data });
  });

  static updateFeatureFlag = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.updateFeatureFlag(req.user!.id, req.params.key, req.body.value, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'Feature flag status updated.' });
  });

  static globalSearch = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.globalSearch(req.query.q as string);
    res.status(200).json({ success: true, data });
  });

  static getSystemMonitoring = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getSystemMonitoring();
    res.status(200).json({ success: true, data });
  });
}
