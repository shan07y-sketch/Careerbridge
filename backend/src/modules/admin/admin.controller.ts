import { Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AdminService } from './admin.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class AdminController {
  static getUsers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const data = await AdminService.getUsers(page, limit, search, role);
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

  static getCompanies = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const data = await AdminService.getCompanies(page, limit, search);
    res.status(200).json({ success: true, data });
  });

  static verifyCompany = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const isVerified = req.body.isVerified !== false;
    const data = await AdminService.verifyCompany(req.user!.id, req.params.id, isVerified, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: isVerified ? 'Company verified.' : 'Company verification revoked.' });
  });

  static getUniversities = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const data = await AdminService.getUniversities(page, limit, search);
    res.status(200).json({ success: true, data });
  });

  static toggleUniversity = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.toggleUniversityState(req.user!.id, req.params.id, req.body.deactivate, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'University visibility toggled.' });
  });

  static verifyUniversity = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const isVerified = req.body.isVerified !== false;
    const data = await AdminService.verifyUniversity(req.user!.id, req.params.id, isVerified, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: isVerified ? 'University verified.' : 'University verification revoked.' });
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

  static getAnnouncements = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const activeOnly = req.query.activeOnly === 'true';
    const data = await AdminService.getAnnouncements(activeOnly);
    res.status(200).json({ success: true, data });
  });

  static createAnnouncement = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.createAnnouncement(req.user!.id, req.body, req.ip, req.headers['x-request-id'] as string);
    res.status(201).json({ success: true, data, message: 'Announcement published.' });
  });

  static setAnnouncementActive = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const isActive = req.body.isActive !== false;
    const data = await AdminService.setAnnouncementActive(req.user!.id, req.params.id, isActive, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: isActive ? 'Announcement activated.' : 'Announcement deactivated.' });
  });

  static deleteAnnouncement = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await AdminService.deleteAnnouncement(req.user!.id, req.params.id, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, message: 'Announcement deleted.' });
  });

  static getSupportTickets = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const data = await AdminService.getSupportTickets(page, limit, status);
    res.status(200).json({ success: true, data });
  });

  static updateSupportTicket = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.updateSupportTicket(req.user!.id, req.params.id, req.body, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'Support ticket updated.' });
  });

  static getActiveSessions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const data = await AdminService.getActiveSessions(page, limit, search);
    res.status(200).json({ success: true, data });
  });

  static revokeSession = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.revokeSession(req.user!.id, req.params.id, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'Session revoked.' });
  });

  static revokeSessionFamily = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.revokeSessionFamily(req.user!.id, req.params.family, req.ip, req.headers['x-request-id'] as string);
    res.status(200).json({ success: true, data, message: 'All sessions for this login revoked.' });
  });

  static detectFraudSignals = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.detectFraudSignals(req.user!.id);
    res.status(201).json({ success: true, data, message: 'Fraud detection report generated.' });
  });

  static getLatestFraudReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getLatestInsightReport('fraud-detection');
    res.status(200).json({ success: true, data });
  });

  static generatePlatformInsights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const period = (req.query.period as string) || 'weekly';
    const data = await AdminService.generatePlatformInsights(req.user!.id, period);
    res.status(201).json({ success: true, data, message: 'Platform insights generated.' });
  });

  static getLatestPlatformInsights = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const period = (req.query.period as string) || 'weekly';
    const data = await AdminService.getLatestInsightReport(`platform-insights-${period}`);
    res.status(200).json({ success: true, data });
  });

  static getModerationRecommendations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getModerationRecommendations(req.user!.id);
    res.status(201).json({ success: true, data, message: 'Moderation recommendations generated.' });
  });

  static getLatestModerationReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getLatestInsightReport('moderation');
    res.status(200).json({ success: true, data });
  });

  static generateSystemHealthSummary = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.generateSystemHealthSummary(req.user!.id);
    res.status(201).json({ success: true, data, message: 'System health summary generated.' });
  });

  static getLatestSystemHealthReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getLatestInsightReport('system-health');
    res.status(200).json({ success: true, data });
  });

  static generateExecutiveReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.generateExecutiveReport(req.user!.id, req.body.reportType);
    res.status(201).json({ success: true, data, message: 'Executive report generated.' });
  });

  static getLatestExecutiveReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getLatestInsightReport(`executive-report-${req.params.reportType}`);
    res.status(200).json({ success: true, data });
  });

  static generatePredictiveAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.generatePredictiveAnalytics(req.user!.id);
    res.status(201).json({ success: true, data, message: 'Predictive analytics generated.' });
  });

  static getLatestPredictiveAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await AdminService.getLatestInsightReport('predictive-analytics');
    res.status(200).json({ success: true, data });
  });
}
