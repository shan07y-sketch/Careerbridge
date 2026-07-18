import bcrypt from 'bcrypt';
import os from 'os';
import { AdminRepository } from './admin.repository';
import { FeatureFlagsService } from './feature-flags.service';
import { AdminAIEngineClient } from './admin-ai-engine.client';
import { prisma } from '../../config/database';
import { UserRole } from '@prisma/client';
import { logger } from '../../config/logger';
import { AppError } from '../../utils/app-error';

const PERIOD_TO_DAYS: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 };

export class AdminService {
  static async getUsers(page: number, limit: number, search?: string, role?: string) {
    try {
      return await AdminRepository.getUsersList(page, limit, search, role);
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch users list from database. Returning empty result.');
      return { users: [], total: 0, page, limit };
    }
  }

  static async suspendUser(adminId: string, id: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.updateUserState(id, { isDeleted: true });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_SUSPEND_USER',
          ipAddress,
          details: JSON.stringify({
            targetUserId: id,
            before: { isDeleted: false },
            after: { isDeleted: true },
            requestId
          })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist suspension audit log.');
    }

    return result;
  }

  static async activateUser(adminId: string, id: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.updateUserState(id, { isDeleted: false });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_ACTIVATE_USER',
          ipAddress,
          details: JSON.stringify({
            targetUserId: id,
            before: { isDeleted: true },
            after: { isDeleted: false },
            requestId
          })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist activation audit log.');
    }

    return result;
  }

  static async verifyUser(adminId: string, id: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.updateUserState(id, { isVerified: true });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_VERIFY_USER',
          ipAddress,
          details: JSON.stringify({
            targetUserId: id,
            before: { isVerified: false },
            after: { isVerified: true },
            requestId
          })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist user verification audit log.');
    }

    return result;
  }

  static async resetUserPassword(adminId: string, id: string, newPass: string, ipAddress?: string, requestId?: string) {
    const hash = await bcrypt.hash(newPass, 12);
    const result = await AdminRepository.updateUserState(id, { passwordHash: hash });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_RESET_PASSWORD',
          ipAddress,
          details: JSON.stringify({
            targetUserId: id,
            requestId
          })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist password reset audit log.');
    }

    return result;
  }

  static async changeUserRole(adminId: string, id: string, role: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.updateUserState(id, { role: role as UserRole });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_CHANGE_ROLE',
          ipAddress,
          details: JSON.stringify({
            targetUserId: id,
            role,
            requestId
          })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist role change audit log.');
    }

    return result;
  }

  static async toggleCompanyState(adminId: string, companyId: string, isDeleted: boolean, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.updateCompanyState(companyId, isDeleted);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: isDeleted ? 'ADMIN_DEACTIVATE_COMPANY' : 'ADMIN_ACTIVATE_COMPANY',
          ipAddress,
          details: JSON.stringify({ companyId, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist company state toggle audit log.');
    }

    return result;
  }

  static async getCompanies(page: number, limit: number, search?: string) {
    try {
      return await AdminRepository.getCompaniesList(page, limit, search);
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch companies list. Returning empty result.');
      return { companies: [], total: 0, page, limit };
    }
  }

  static async verifyCompany(adminId: string, id: string, isVerified: boolean, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.setCompanyVerified(id, isVerified);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: isVerified ? 'ADMIN_VERIFY_COMPANY' : 'ADMIN_UNVERIFY_COMPANY',
          ipAddress,
          details: JSON.stringify({ companyId: id, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist company verification audit log.');
    }

    return result;
  }

  static async getUniversities(page: number, limit: number, search?: string) {
    try {
      return await AdminRepository.getUniversitiesList(page, limit, search);
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch universities list. Returning empty result.');
      return { universities: [], total: 0, page, limit };
    }
  }

  static async toggleUniversityState(adminId: string, id: string, isDeleted: boolean, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.updateUniversityState(id, isDeleted);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: isDeleted ? 'ADMIN_DEACTIVATE_UNIVERSITY' : 'ADMIN_ACTIVATE_UNIVERSITY',
          ipAddress,
          details: JSON.stringify({ universityId: id, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist university state toggle audit log.');
    }

    return result;
  }

  static async verifyUniversity(adminId: string, id: string, isVerified: boolean, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.setUniversityVerified(id, isVerified);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: isVerified ? 'ADMIN_VERIFY_UNIVERSITY' : 'ADMIN_UNVERIFY_UNIVERSITY',
          ipAddress,
          details: JSON.stringify({ universityId: id, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist university verification audit log.');
    }

    return result;
  }

  static async getAuditLogs(filters: any, page: number, limit: number) {
    try {
      return await AdminRepository.getAuditLogs(filters, page, limit);
    } catch (err) {
      logger.warn({ err }, 'Failed to query audit logs. Returning empty result.');
      return { logs: [], total: 0, page, limit };
    }
  }

  static async getGlobalStats() {
    try {
      return await AdminRepository.getGlobalStats();
    } catch (err) {
      logger.warn({ err }, 'Failed to query global statistics. Returning fallback stats.');
      return {
        totalUsers: 0,
        companiesCount: 0,
        universitiesCount: 0,
        jobsPublished: 0,
        applicationsCount: 0,
        newUsersToday: 0,
        activeUsersToday: 0,
        unverifiedCompanies: 0,
        unverifiedUniversities: 0,
        pendingStudentVerifications: 0,
        suspendedUsers: 0,
        usersByRole: []
      };
    }
  }

  static async getFeatureFlags() {
    return FeatureFlagsService.getFlagsList();
  }

  static async updateFeatureFlag(adminId: string, key: string, value: boolean, ipAddress?: string, requestId?: string) {
    const flag = await FeatureFlagsService.updateFlag(key, value, adminId);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_UPDATE_FEATURE_FLAG',
          ipAddress,
          details: JSON.stringify({ key, value, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist feature flag update audit log.');
    }

    // maintenanceMode is the single highest-blast-radius toggle in the
    // platform (it takes CareerBridge offline for every non-admin user).
    // Every other admin needs to know immediately if a colleague flips it,
    // not just whoever happens to be looking at the Command Center at the
    // time -- so this fires a real, URGENT notification to every admin
    // other than the one who made the change.
    if (key === 'maintenanceMode') {
      try {
        const otherAdmins = await prisma.user.findMany({
          where: { role: 'ADMIN', id: { not: adminId } },
          select: { id: true }
        });
        if (otherAdmins.length > 0) {
          await prisma.notification.createMany({
            data: otherAdmins.map((admin) => ({
              senderId: adminId,
              recipientId: admin.id,
              type: 'SYSTEM' as const,
              priority: 'URGENT' as const,
              title: value ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
              content: value
                ? 'CareerBridge has been taken offline for all non-admin users.'
                : 'CareerBridge access has been restored for all users.'
            }))
          });
        }
      } catch (notifyErr) {
        logger.warn({ notifyErr }, 'Failed to notify admins of maintenance mode change.');
      }
    }

    return flag;
  }

  static async globalSearch(query: string) {
    try {
      return await AdminRepository.globalSearch(query);
    } catch (err) {
      logger.warn({ err }, 'Failed to perform global search. Returning empty result set.');
      return { students: [], companies: [], universities: [], jobs: [] };
    }
  }

  static async getAnnouncements(activeOnly = false) {
    try {
      return await AdminRepository.getAnnouncements(activeOnly);
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch platform announcements. Returning empty list.');
      return [];
    }
  }

  static async createAnnouncement(
    adminId: string,
    data: { title: string; content: string; severity: string; expiresAt?: string },
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await AdminRepository.createAnnouncement({
      title: data.title,
      content: data.content,
      severity: data.severity,
      createdBy: adminId,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_CREATE_ANNOUNCEMENT',
          ipAddress,
          details: JSON.stringify({ announcementId: result.id, title: data.title, severity: data.severity, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist announcement creation audit log.');
    }

    return result;
  }

  static async setAnnouncementActive(adminId: string, id: string, isActive: boolean, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.setAnnouncementActive(id, isActive);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: isActive ? 'ADMIN_ACTIVATE_ANNOUNCEMENT' : 'ADMIN_DEACTIVATE_ANNOUNCEMENT',
          ipAddress,
          details: JSON.stringify({ announcementId: id, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist announcement state audit log.');
    }

    return result;
  }

  static async deleteAnnouncement(adminId: string, id: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.deleteAnnouncement(id);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_DELETE_ANNOUNCEMENT',
          ipAddress,
          details: JSON.stringify({ announcementId: id, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist announcement deletion audit log.');
    }

    return result;
  }

  static async getSupportTickets(page: number, limit: number, status?: string) {
    try {
      return await AdminRepository.getSupportTickets(page, limit, status);
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch support tickets. Returning empty result.');
      return { tickets: [], total: 0, page, limit };
    }
  }

  static async updateSupportTicket(
    adminId: string,
    id: string,
    data: { status?: string; priority?: string; assignedToId?: string | null; resolutionNote?: string },
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await AdminRepository.updateSupportTicket(id, data);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_UPDATE_SUPPORT_TICKET',
          ipAddress,
          details: JSON.stringify({ ticketId: id, changes: data, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist support ticket update audit log.');
    }

    return result;
  }

  static async getActiveSessions(page: number, limit: number, search?: string) {
    try {
      return await AdminRepository.getActiveSessions(page, limit, search);
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch active sessions. Returning empty result.');
      return { sessions: [], total: 0, page, limit };
    }
  }

  static async revokeSession(adminId: string, id: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.revokeSession(id);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_REVOKE_SESSION',
          ipAddress,
          details: JSON.stringify({ sessionId: id, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist session revocation audit log.');
    }

    return result;
  }

  static async revokeSessionFamily(adminId: string, family: string, ipAddress?: string, requestId?: string) {
    const result = await AdminRepository.revokeSessionFamily(family);

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_REVOKE_SESSION_FAMILY',
          ipAddress,
          details: JSON.stringify({ family, requestId })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist session family revocation audit log.');
    }

    return result;
  }

  static async getSystemMonitoring() {
    const dbStart = Date.now();
    const isDbConnected = await prisma.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);
    const dbLatencyMs = Date.now() - dbStart;

    let aiLogs: any[] = [];
    try {
      aiLogs = await prisma.auditLog.findMany({
        where: { action: 'AI_USAGE' },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch AI usage logs for monitoring.');
    }

    let totalProcessingTime = 0;
    let cacheHits = 0;
    let processingSamples = 0;
    aiLogs.forEach(log => {
      try {
        const details = JSON.parse(log.details || '{}');
        if (typeof details.processingTimeMs === 'number') {
          totalProcessingTime += details.processingTimeMs;
          processingSamples++;
        }
        if (details.cacheHit) cacheHits++;
      } catch (err) {
        // Malformed details on a legacy row; skip it rather than fabricate.
      }
    });

    let recentErrorCount = 0;
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      recentErrorCount = await prisma.auditLog.count({
        where: { action: { contains: 'ERROR' }, createdAt: { gte: since } }
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to count recent error audit logs.');
    }

    const memoryUsage = process.memoryUsage();

    return {
      databaseStatus: isDbConnected ? 'HEALTHY' : 'UNREACHABLE',
      databaseLatencyMs: dbLatencyMs,
      processUptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: `${os.type()} ${os.release()}`,
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        systemFreeMb: Math.round(os.freemem() / 1024 / 1024),
        systemTotalMb: Math.round(os.totalmem() / 1024 / 1024)
      },
      aiUsageSampleSize: aiLogs.length,
      aiCacheHitRatePercent: aiLogs.length ? Math.round((cacheHits / aiLogs.length) * 100) : 0,
      aiAvgLatencyMs: processingSamples ? Math.round(totalProcessingTime / processingSamples) : 0,
      recentErrorLogsLast24h: recentErrorCount
    };
  }

  // ------------------------------------------------------------------
  // Admin AI (Phase 6): fraud detection, platform insights, moderation,
  // system health, executive reports, predictive analytics. Every method
  // gathers real, already-computed signals via AdminRepository, has the
  // ai-engine explain/prioritize them, persists the result as a
  // PlatformInsightReport row, and audit-logs the generation -- the same
  // discipline as every other AI phase in this codebase.
  // ------------------------------------------------------------------

  static async detectFraudSignals(adminId: string) {
    const [duplicateAccounts, suspiciousLogins, fakeOrgs, duplicateResumes, abnormalApplications] = await Promise.all([
      AdminRepository.getDuplicateAccountSignals(),
      AdminRepository.getSuspiciousLoginSignals(),
      AdminRepository.getFakeOrganizationSignals(),
      AdminRepository.getDuplicateResumeSignals(),
      AdminRepository.getAbnormalApplicationSignals()
    ]);

    const signalsSummary = [
      `DUPLICATE ACCOUNTS (matched by phone number): ${duplicateAccounts.length} group(s) found.`,
      ...duplicateAccounts.map(
        (g: any) => `- Phone ${g.phone}: ${g.profiles.map((p: any) => `${p.firstName} ${p.lastName} (${p.user?.email})`).join(', ')}`
      ),
      `\nSUSPICIOUS LOGIN PATTERNS (>=8 session families in 24h): ${suspiciousLogins.length} user(s) found.`,
      ...suspiciousLogins.map((s: any) => `- ${s.user?.email} (${s.user?.role}): ${s.sessionFamiliesLast24h} session families in 24h`),
      `\nSUSPICIOUS ORGANIZATIONS (unverified, 30+ days old, zero activity): ${fakeOrgs.suspiciousCompanies.length} companies, ${fakeOrgs.suspiciousUniversities.length} universities.`,
      ...fakeOrgs.suspiciousCompanies.map((c: any) => `- Company "${c.name}" (${c.industry}), created ${c.createdAt.toISOString().slice(0, 10)}, zero jobs posted`),
      ...fakeOrgs.suspiciousUniversities.map((u: any) => `- University "${u.name}" (${u.location}), created ${u.createdAt.toISOString().slice(0, 10)}, zero students`),
      `\nDUPLICATE RESUME CONTENT: ${duplicateResumes.length} group(s) of identical resume text across different students.`,
      ...duplicateResumes.map((g: any) => `- ${g.length} students share identical resume content (student IDs: ${g.map((r: any) => r.studentProfileId).join(', ')})`),
      `\nABNORMAL APPLICATION ACTIVITY (>=15 applications in 24h): ${abnormalApplications.length} student(s) found.`,
      ...abnormalApplications.map((a: any) => `- ${a.profile?.firstName} ${a.profile?.lastName} (${a.profile?.user?.email}): ${a.applicationsLast24h} applications in 24h`)
    ].join('\n');

    const result = await AdminAIEngineClient.detectFraudSignals(signalsSummary);

    const report = await AdminRepository.createPlatformInsightReport({
      reportType: 'fraud-detection',
      payload: result,
      modelVersion: result.estimated ? 'fraud-detection-v1-estimated' : 'fraud-detection-v1',
      generatedBy: adminId
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'FRAUD_DETECTION_GENERATED', details: JSON.stringify({ reportId: report.id, flaggedCount: result.flaggedItems.length }) }
    });

    return report;
  }

  static async generatePlatformInsights(adminId: string, period: string = 'weekly') {
    const days = PERIOD_TO_DAYS[period] ?? 7;
    const stats = await AdminRepository.getPlatformGrowthStats(days);

    const statsSummary = [
      `PERIOD: last ${days} day(s) (${period}).`,
      `New users: ${stats.newUsers}.`,
      `Active users by role: ${stats.activeUsersByRole.map(r => `${r.role}: ${r.count}`).join(', ') || 'none'}.`,
      `New jobs posted: ${stats.newJobs}.`,
      `New applications: ${stats.newApplications}.`,
      `Accepted offers (placements): ${stats.acceptedOffers}.`,
      `AI feature usage events: ${stats.aiFeatureUsageCount}.`,
      `Messages sent: ${stats.messagesSent}.`
    ].join('\n');

    const result = await AdminAIEngineClient.generatePlatformInsights(statsSummary);

    const report = await AdminRepository.createPlatformInsightReport({
      reportType: `platform-insights-${period}`,
      payload: result,
      modelVersion: result.estimated ? 'platform-insights-v1-estimated' : 'platform-insights-v1',
      generatedBy: adminId
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'PLATFORM_INSIGHTS_GENERATED', details: JSON.stringify({ reportId: report.id, period }) }
    });

    return report;
  }

  static async getModerationRecommendations(adminId: string) {
    const [latestFraudReport, supportTicketsResult] = await Promise.all([
      AdminRepository.getLatestPlatformInsightReport('fraud-detection'),
      AdminRepository.getSupportTickets(1, 20, 'OPEN')
    ]);

    const flaggedItems = (latestFraudReport?.payload as any)?.flaggedItems ?? [];
    const contextSummary = [
      `RECENTLY FLAGGED FRAUD ITEMS (${flaggedItems.length}):`,
      ...flaggedItems.map((f: any) => `- [${f.severity}] ${f.category}: ${f.description}`),
      `\nOPEN SUPPORT TICKETS (${supportTicketsResult.total}):`,
      ...supportTicketsResult.tickets.map((t: any) => `- ${t.subject} (priority: ${t.priority}, from: ${t.requesterEmail})`)
    ].join('\n');

    const result = await AdminAIEngineClient.getModerationRecommendations(contextSummary);

    const report = await AdminRepository.createPlatformInsightReport({
      reportType: 'moderation',
      payload: result,
      modelVersion: result.estimated ? 'moderation-v1-estimated' : 'moderation-v1',
      generatedBy: adminId
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'MODERATION_RECOMMENDATIONS_GENERATED', details: JSON.stringify({ reportId: report.id }) }
    });

    return report;
  }

  static async generateSystemHealthSummary(adminId: string) {
    const [healthSignals, monitoring] = await Promise.all([
      AdminRepository.getSystemHealthSignals(),
      this.getSystemMonitoring()
    ]);

    const healthSummary = [
      `Database status: ${monitoring.databaseStatus} (latency ${monitoring.databaseLatencyMs}ms).`,
      `Process uptime: ${monitoring.processUptimeSeconds}s. Memory: ${monitoring.memory.heapUsedMb}MB/${monitoring.memory.heapTotalMb}MB heap.`,
      `Audit events last 24h: ${healthSignals.totalEventsLast24h} (${healthSignals.errorEventsLast24h} errors).`,
      `Audit events last 7d: ${healthSignals.totalEventsLast7d} (${healthSignals.errorEventsLast7d} errors).`,
      `Top actions last 7d: ${healthSignals.topActionsLast7d.map(a => `${a.action} (${a.count})`).join(', ') || 'none'}.`,
      `AI usage sample size: ${monitoring.aiUsageSampleSize}, cache hit rate: ${monitoring.aiCacheHitRatePercent}%, avg latency: ${monitoring.aiAvgLatencyMs}ms.`
    ].join('\n');

    const result = await AdminAIEngineClient.generateSystemHealthSummary(healthSummary);

    const report = await AdminRepository.createPlatformInsightReport({
      reportType: 'system-health',
      payload: result,
      modelVersion: result.estimated ? 'system-health-v1-estimated' : 'system-health-v1',
      generatedBy: adminId
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'SYSTEM_HEALTH_SUMMARY_GENERATED', details: JSON.stringify({ reportId: report.id, healthStatus: result.healthStatus }) }
    });

    return report;
  }

  static async generateExecutiveReport(adminId: string, reportType: string) {
    const validTypes = ['weekly-platform-summary', 'placement-performance', 'company-engagement', 'university-performance', 'ai-adoption'];
    if (!validTypes.includes(reportType)) {
      throw new AppError(`Invalid report type. Must be one of: ${validTypes.join(', ')}.`, 400, 'INVALID_REPORT_TYPE');
    }

    const [globalStats, weeklyStats] = await Promise.all([
      AdminRepository.getGlobalStats(),
      AdminRepository.getPlatformGrowthStats(7)
    ]);

    const dataSummary = [
      `TOTAL USERS: ${globalStats.totalUsers} (by role: ${globalStats.usersByRole.map((r: any) => `${r.role}: ${r.count}`).join(', ')}).`,
      `COMPANIES: ${globalStats.companiesCount} (unverified: ${globalStats.unverifiedCompanies}).`,
      `UNIVERSITIES: ${globalStats.universitiesCount} (unverified: ${globalStats.unverifiedUniversities}).`,
      `JOBS PUBLISHED: ${globalStats.jobsPublished}. APPLICATIONS: ${globalStats.applicationsCount}.`,
      `NEW USERS TODAY: ${globalStats.newUsersToday}. ACTIVE USERS TODAY: ${globalStats.activeUsersToday}.`,
      `PENDING STUDENT VERIFICATIONS: ${globalStats.pendingStudentVerifications}. SUSPENDED USERS: ${globalStats.suspendedUsers}.`,
      `\nLAST 7 DAYS: ${weeklyStats.newUsers} new users, ${weeklyStats.newJobs} new jobs, ${weeklyStats.newApplications} new applications, ${weeklyStats.acceptedOffers} accepted offers, ${weeklyStats.aiFeatureUsageCount} AI feature usage events, ${weeklyStats.messagesSent} messages sent.`
    ].join('\n');

    const result = await AdminAIEngineClient.generateExecutiveReport(reportType, dataSummary);

    const report = await AdminRepository.createPlatformInsightReport({
      reportType: `executive-report-${reportType}`,
      payload: result,
      modelVersion: result.estimated ? 'executive-report-v1-estimated' : 'executive-report-v1',
      generatedBy: adminId
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'EXECUTIVE_REPORT_GENERATED', details: JSON.stringify({ reportId: report.id, reportType }) }
    });

    return report;
  }

  static async generatePredictiveAnalytics(adminId: string) {
    const [trends, growth] = await Promise.all([
      AdminRepository.getHistoricalTrends(6),
      AdminRepository.getPlatformGrowthStats(30)
    ]);

    const historicalSummary = [
      `APPLICATIONS BY MONTH (last 6 months): ${trends.applicationsByMonth.map(m => `${m.month}: ${m.count}`).join(', ') || 'no data'}.`,
      `PLACEMENTS (ACCEPTED OFFERS) BY MONTH (last 6 months): ${trends.placementsByMonth.map(m => `${m.month}: ${m.count}`).join(', ') || 'no data'}.`,
      `LAST 30 DAYS: ${growth.newUsers} new users, ${growth.newJobs} new jobs, ${growth.newApplications} new applications, ${growth.acceptedOffers} accepted offers.`
    ].join('\n');

    const result = await AdminAIEngineClient.generatePredictiveAnalytics(historicalSummary);

    const report = await AdminRepository.createPlatformInsightReport({
      reportType: 'predictive-analytics',
      payload: result,
      modelVersion: result.estimated ? 'predictive-analytics-v1-estimated' : 'predictive-analytics-v1',
      generatedBy: adminId
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: 'PREDICTIVE_ANALYTICS_GENERATED', details: JSON.stringify({ reportId: report.id }) }
    });

    return report;
  }

  static async getLatestInsightReport(reportType: string) {
    return AdminRepository.getLatestPlatformInsightReport(reportType);
  }
}
