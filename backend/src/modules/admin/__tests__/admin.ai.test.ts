import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for Admin AI (Phase 6): fraud detection, platform
// insights, moderation recommendations, system health summaries, executive
// reports, and predictive analytics. Every method gathers real signals via
// AdminRepository, has the ai-engine explain/prioritize them, persists the
// result as a PlatformInsightReport row, and audit-logs the generation.

vi.mock('../admin.repository', () => ({
  AdminRepository: {
    getDuplicateAccountSignals: vi.fn(),
    getSuspiciousLoginSignals: vi.fn(),
    getFakeOrganizationSignals: vi.fn(),
    getDuplicateResumeSignals: vi.fn(),
    getAbnormalApplicationSignals: vi.fn(),
    getPlatformGrowthStats: vi.fn(),
    getSystemHealthSignals: vi.fn(),
    getHistoricalTrends: vi.fn(),
    getGlobalStats: vi.fn(),
    getSupportTickets: vi.fn(),
    createPlatformInsightReport: vi.fn(),
    getLatestPlatformInsightReport: vi.fn()
  }
}));

vi.mock('../admin-ai-engine.client', () => ({
  AdminAIEngineClient: {
    detectFraudSignals: vi.fn(),
    generatePlatformInsights: vi.fn(),
    getModerationRecommendations: vi.fn(),
    generateSystemHealthSummary: vi.fn(),
    generateExecutiveReport: vi.fn(),
    generatePredictiveAnalytics: vi.fn()
  }
}));

vi.mock('../feature-flags.service', () => ({
  FeatureFlagsService: { getFlagsList: vi.fn(), updateFlag: vi.fn() }
}));

// admin.service.ts imports bcrypt for resetUserPassword; the native binding
// isn't loadable in this sandbox, and this suite doesn't exercise that path
// anyway, so it's mocked out purely to allow the module to import cleanly.
vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
  hash: vi.fn(),
  compare: vi.fn()
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    auditLog: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
    $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }])
  }
}));

import { AdminService } from '../admin.service';
import { AdminRepository } from '../admin.repository';
import { AdminAIEngineClient } from '../admin-ai-engine.client';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(AdminRepository);
const mockedEngine = vi.mocked(AdminAIEngineClient);
const mockedPrisma = vi.mocked(prisma, true);

describe('AdminService (Admin AI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.auditLog.findMany.mockResolvedValue([] as any);
    mockedPrisma.auditLog.count.mockResolvedValue(0 as any);
    (mockedPrisma.$queryRaw as any).mockResolvedValue([{ ok: 1 }]);
  });

  describe('detectFraudSignals', () => {
    it('gathers all five signal types, calls the AI Engine, persists the report, and audit-logs it', async () => {
      mockedRepo.getDuplicateAccountSignals.mockResolvedValue([
        { phone: '555-0100', count: 2, profiles: [{ firstName: 'Ada', lastName: 'Lovelace', user: { email: 'ada@example.com' } }] }
      ] as any);
      mockedRepo.getSuspiciousLoginSignals.mockResolvedValue([
        { userId: 'u1', sessionFamiliesLast24h: 10, user: { email: 'x@example.com', role: 'STUDENT' } }
      ] as any);
      mockedRepo.getFakeOrganizationSignals.mockResolvedValue({ suspiciousCompanies: [], suspiciousUniversities: [] } as any);
      mockedRepo.getDuplicateResumeSignals.mockResolvedValue([] as any);
      mockedRepo.getAbnormalApplicationSignals.mockResolvedValue([] as any);

      const engineResult = {
        flaggedItems: [
          { category: 'Duplicate Account', severity: 'High', description: 'Two profiles share a phone number.', relatedIds: ['p1', 'p2'], recommendedAction: 'Review manually.' }
        ],
        summary: 'One duplicate-account cluster found.'
      };
      mockedEngine.detectFraudSignals.mockResolvedValue(engineResult as any);
      mockedRepo.createPlatformInsightReport.mockResolvedValue({ id: 'report-1', reportType: 'fraud-detection', payload: engineResult } as any);

      const result = await AdminService.detectFraudSignals('admin-1');

      expect(mockedEngine.detectFraudSignals).toHaveBeenCalledWith(expect.stringContaining('DUPLICATE ACCOUNTS'));
      expect(mockedRepo.createPlatformInsightReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'fraud-detection', modelVersion: 'fraud-detection-v1', generatedBy: 'admin-1' })
      );
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'FRAUD_DETECTION_GENERATED' }) })
      );
      expect(result).toEqual({ id: 'report-1', reportType: 'fraud-detection', payload: engineResult });
    });
  });

  describe('generatePlatformInsights', () => {
    it('maps period to a day window, calls the AI Engine, and persists a period-scoped report', async () => {
      mockedRepo.getPlatformGrowthStats.mockResolvedValue({
        windowDays: 7,
        newUsers: 12,
        activeUsersByRole: [{ role: 'STUDENT', count: 40 }],
        newJobs: 5,
        newApplications: 30,
        acceptedOffers: 3,
        aiFeatureUsageCount: 20,
        messagesSent: 15
      } as any);

      const engineResult = { insights: ['Applications up 20%.'], growthSummary: 'Solid weekly growth.', engagementSummary: 'AI usage climbing.' };
      mockedEngine.generatePlatformInsights.mockResolvedValue(engineResult as any);
      mockedRepo.createPlatformInsightReport.mockResolvedValue({ id: 'report-2', reportType: 'platform-insights-weekly', payload: engineResult } as any);

      await AdminService.generatePlatformInsights('admin-1', 'weekly');

      expect(mockedRepo.getPlatformGrowthStats).toHaveBeenCalledWith(7);
      expect(mockedEngine.generatePlatformInsights).toHaveBeenCalledWith(expect.stringContaining('12'));
      expect(mockedRepo.createPlatformInsightReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'platform-insights-weekly', modelVersion: 'platform-insights-v1' })
      );
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'PLATFORM_INSIGHTS_GENERATED' }) })
      );
    });
  });

  describe('getModerationRecommendations', () => {
    it('builds context from the latest fraud report and open tickets, then persists the recommendation', async () => {
      mockedRepo.getLatestPlatformInsightReport.mockResolvedValue({
        payload: { flaggedItems: [{ severity: 'High', category: 'Duplicate Account', description: 'desc' }] }
      } as any);
      mockedRepo.getSupportTickets.mockResolvedValue({
        tickets: [{ subject: 'Cannot log in', priority: 'HIGH', requesterEmail: 'a@example.com' }],
        total: 1,
        page: 1,
        limit: 20
      } as any);

      const engineResult = { recommendedReviews: [{ target: 'user a@example.com', reason: 'Login issue', priority: 'High' }], summary: 'One item needs review.' };
      mockedEngine.getModerationRecommendations.mockResolvedValue(engineResult as any);
      mockedRepo.createPlatformInsightReport.mockResolvedValue({ id: 'report-3', reportType: 'moderation', payload: engineResult } as any);

      await AdminService.getModerationRecommendations('admin-1');

      expect(mockedEngine.getModerationRecommendations).toHaveBeenCalledWith(expect.stringContaining('RECENTLY FLAGGED FRAUD ITEMS'));
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'MODERATION_RECOMMENDATIONS_GENERATED' }) })
      );
    });
  });

  describe('generateSystemHealthSummary', () => {
    it('combines audit log signals with system monitoring and persists the summary', async () => {
      mockedRepo.getSystemHealthSignals.mockResolvedValue({
        totalEventsLast24h: 100,
        errorEventsLast24h: 2,
        totalEventsLast7d: 700,
        errorEventsLast7d: 10,
        topActionsLast7d: [{ action: 'LOGIN', count: 300 }]
      } as any);

      const engineResult = { healthStatus: 'Healthy', issues: [], recurringPatterns: [], summary: 'All systems normal.' };
      mockedEngine.generateSystemHealthSummary.mockResolvedValue(engineResult as any);
      mockedRepo.createPlatformInsightReport.mockResolvedValue({ id: 'report-4', reportType: 'system-health', payload: engineResult } as any);

      await AdminService.generateSystemHealthSummary('admin-1');

      expect(mockedEngine.generateSystemHealthSummary).toHaveBeenCalledWith(expect.stringContaining('Database status'));
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'SYSTEM_HEALTH_SUMMARY_GENERATED' }) })
      );
    });
  });

  describe('generateExecutiveReport', () => {
    it('rejects an invalid report type', async () => {
      await expect(AdminService.generateExecutiveReport('admin-1', 'not-a-real-type')).rejects.toThrow('Invalid report type');
    });

    it('assembles global + weekly stats, calls the AI Engine, and persists a type-scoped report', async () => {
      mockedRepo.getGlobalStats.mockResolvedValue({
        totalUsers: 500,
        usersByRole: [{ role: 'STUDENT', count: 400 }],
        companiesCount: 20,
        universitiesCount: 5,
        jobsPublished: 60,
        applicationsCount: 300,
        newUsersToday: 4,
        activeUsersToday: 50,
        unverifiedCompanies: 2,
        unverifiedUniversities: 1,
        pendingStudentVerifications: 3,
        suspendedUsers: 1
      } as any);
      mockedRepo.getPlatformGrowthStats.mockResolvedValue({
        newUsers: 10, newJobs: 4, newApplications: 25, acceptedOffers: 2, aiFeatureUsageCount: 15, messagesSent: 8
      } as any);

      const engineResult = { reportType: 'weekly-platform-summary', executiveSummary: 'Steady week.', keyMetrics: ['500 total users'], recommendations: ['Verify pending companies.'] };
      mockedEngine.generateExecutiveReport.mockResolvedValue(engineResult as any);
      mockedRepo.createPlatformInsightReport.mockResolvedValue({ id: 'report-5', reportType: 'executive-report-weekly-platform-summary', payload: engineResult } as any);

      await AdminService.generateExecutiveReport('admin-1', 'weekly-platform-summary');

      expect(mockedEngine.generateExecutiveReport).toHaveBeenCalledWith('weekly-platform-summary', expect.stringContaining('TOTAL USERS'));
      expect(mockedRepo.createPlatformInsightReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'executive-report-weekly-platform-summary', modelVersion: 'executive-report-v1' })
      );
    });
  });

  describe('generatePredictiveAnalytics', () => {
    it('combines historical trends with growth stats and persists the forecast', async () => {
      mockedRepo.getHistoricalTrends.mockResolvedValue({
        applicationsByMonth: [{ month: '2026-06', count: 100 }],
        placementsByMonth: [{ month: '2026-06', count: 20 }],
        departmentActivitySample: 5
      } as any);
      mockedRepo.getPlatformGrowthStats.mockResolvedValue({
        newUsers: 50, newJobs: 10, newApplications: 100, acceptedOffers: 8
      } as any);

      const engineResult = {
        growthForecast: 'Continued modest growth.',
        hiringDemandForecast: 'Demand likely to rise.',
        decliningDepartments: [],
        interviewVolumeForecast: 'Stable.',
        summary: 'Outlook is positive.'
      };
      mockedEngine.generatePredictiveAnalytics.mockResolvedValue(engineResult as any);
      mockedRepo.createPlatformInsightReport.mockResolvedValue({ id: 'report-6', reportType: 'predictive-analytics', payload: engineResult } as any);

      await AdminService.generatePredictiveAnalytics('admin-1');

      expect(mockedEngine.generatePredictiveAnalytics).toHaveBeenCalledWith(expect.stringContaining('APPLICATIONS BY MONTH'));
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'PREDICTIVE_ANALYTICS_GENERATED' }) })
      );
    });
  });

  describe('getLatestInsightReport', () => {
    it('delegates straight to the repository', async () => {
      mockedRepo.getLatestPlatformInsightReport.mockResolvedValue({ id: 'report-7' } as any);
      const result = await AdminService.getLatestInsightReport('system-health');
      expect(mockedRepo.getLatestPlatformInsightReport).toHaveBeenCalledWith('system-health');
      expect(result).toEqual({ id: 'report-7' });
    });
  });
});
