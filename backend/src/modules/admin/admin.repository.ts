import { prisma } from '../../config/database';
import { UserRole } from '@prisma/client';

export class AdminRepository {
  static async getUsersList(page: number, limit: number, search?: string, role?: string) {
    const where: any = {};
    if (search) where.email = { contains: search, mode: 'insensitive' };
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          studentProfile: { select: { firstName: true, lastName: true } },
          recruiterProfile: { select: { id: true, title: true } },
          universityProfile: { select: { name: true } },
          company: { select: { name: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    return { users, total, page, limit };
  }

  static async updateUserState(id: string, updates: { isDeleted?: boolean; isVerified?: boolean; role?: UserRole; passwordHash?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        isDeleted: updates.isDeleted,
        deletedAt: updates.isDeleted ? new Date() : updates.isDeleted === false ? null : undefined,
        isVerified: updates.isVerified,
        role: updates.role,
        passwordHash: updates.passwordHash
      }
    });
  }

  static async getCompaniesList(page: number, limit: number, search?: string) {
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { jobs: true, recruiters: true } } }
      }),
      prisma.company.count({ where })
    ]);

    return { companies, total, page, limit };
  }

  static async updateCompanyState(id: string, isDeleted: boolean) {
    return prisma.company.update({
      where: { id },
      data: {
        isDeleted,
        deletedAt: isDeleted ? new Date() : null
      }
    });
  }

  static async setCompanyVerified(id: string, isVerified: boolean) {
    return prisma.company.update({
      where: { id },
      data: { isVerified, verifiedAt: isVerified ? new Date() : null }
    });
  }

  static async getUniversitiesList(page: number, limit: number, search?: string) {
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [universities, total] = await Promise.all([
      prisma.university.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { students: true, placementDrives: true } } }
      }),
      prisma.university.count({ where })
    ]);

    return { universities, total, page, limit };
  }

  static async updateUniversityState(id: string, isDeleted: boolean) {
    return prisma.university.update({
      where: { id },
      data: {
        isDeleted,
        deletedAt: isDeleted ? new Date() : null
      }
    });
  }

  static async setUniversityVerified(id: string, isVerified: boolean) {
    return prisma.university.update({
      where: { id },
      data: { isVerified, verifiedAt: isVerified ? new Date() : null }
    });
  }

  static async getAuditLogs(filters: { userId?: string; action?: string; startDate?: Date; endDate?: Date }, page: number, limit: number) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total, page, limit };
  }

  static async getGlobalStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      companiesCount,
      universitiesCount,
      jobsCount,
      applicationsCount,
      newUsersToday,
      activeUsersToday,
      unverifiedCompanies,
      unverifiedUniversities,
      pendingStudentVerifications,
      suspendedUsers,
      usersByRole
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count({ where: { isDeleted: false } }),
      prisma.university.count({ where: { isDeleted: false } }),
      prisma.job.count(),
      prisma.application.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: startOfDay } } }),
      prisma.company.count({ where: { isVerified: false, isDeleted: false } }),
      prisma.university.count({ where: { isVerified: false, isDeleted: false } }),
      prisma.studentProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } })
    ]);

    return {
      totalUsers,
      companiesCount,
      universitiesCount,
      jobsPublished: jobsCount,
      applicationsCount,
      newUsersToday,
      activeUsersToday,
      unverifiedCompanies,
      unverifiedUniversities,
      pendingStudentVerifications,
      suspendedUsers,
      usersByRole: usersByRole.map((r: { role: string; _count: { _all: number } }) => ({ role: r.role, count: r._count._all })),
      mockInterviews: await this.getInterviewAnalytics()
    };
  }

  /**
   * Platform-wide Mock Interview analytics, aggregated from the same stored
   * reports students/employers/universities see. `estimatedReports` counts
   * fallback-engine reports, i.e. real Gemini usage = total - estimated.
   */
  static async getInterviewAnalytics() {
    const [total, completed, inProgress, abandoned, shared, reportAgg, estimatedReports] = await Promise.all([
      prisma.mockInterview.count(),
      prisma.mockInterview.count({ where: { status: 'COMPLETED' } }),
      prisma.mockInterview.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.mockInterview.count({ where: { status: 'ABANDONED' } }),
      prisma.mockInterview.count({ where: { sharedWithEmployers: true } }),
      prisma.mockInterviewReport.aggregate({
        _count: { _all: true },
        _avg: { score: true, interviewReadiness: true }
      }),
      prisma.mockInterviewReport.count({ where: { estimated: true } })
    ]);
    return {
      totalSessions: total,
      completedSessions: completed,
      inProgressSessions: inProgress,
      abandonedSessions: abandoned,
      sharedWithEmployers: shared,
      totalReports: reportAgg._count._all,
      averageScore: reportAgg._avg.score != null ? Math.round(reportAgg._avg.score) : null,
      averageReadiness: reportAgg._avg.interviewReadiness != null ? Math.round(reportAgg._avg.interviewReadiness) : null,
      aiGeneratedReports: reportAgg._count._all - estimatedReports,
      estimatedReports
    };
  }

  static async globalSearch(query: string) {
    const students = await prisma.studentProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: { user: { select: { email: true } } }
    });

    const companies = await prisma.company.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 5
    });

    const universities = await prisma.university.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 5
    });

    const jobs = await prisma.job.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: 5,
      include: { company: { select: { name: true } } }
    });

    return { students, companies, universities, jobs };
  }

  static async getAnnouncements(activeOnly = false) {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    }
    return prisma.platformAnnouncement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { email: true } } }
    });
  }

  static async createAnnouncement(data: { title: string; content: string; severity: string; createdBy: string; expiresAt?: Date | null }) {
    return prisma.platformAnnouncement.create({ data });
  }

  static async setAnnouncementActive(id: string, isActive: boolean) {
    return prisma.platformAnnouncement.update({ where: { id }, data: { isActive } });
  }

  static async deleteAnnouncement(id: string) {
    return prisma.platformAnnouncement.delete({ where: { id } });
  }

  static async getSupportTickets(page: number, limit: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { email: true } } }
      }),
      prisma.supportTicket.count({ where })
    ]);

    return { tickets, total, page, limit };
  }

  static async updateSupportTicket(id: string, data: { status?: string; priority?: string; assignedToId?: string | null; resolutionNote?: string }) {
    return prisma.supportTicket.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : undefined
      }
    });
  }

  /**
   * "Sessions & devices" is the real RefreshToken table: every row is one
   * issued session, `family` groups the rotations of a single login, and
   * revoking here is the same revoke path used by logout/reuse-detection.
   * There is no separate device-tracking table -- this reads the session
   * data that already exists rather than inventing a parallel model.
   */
  static async getActiveSessions(page: number, limit: number, search?: string) {
    const where: any = { isRevoked: false, expiresAt: { gt: new Date() } };
    if (search) {
      where.user = { email: { contains: search, mode: 'insensitive' } };
    }

    const [sessions, total] = await Promise.all([
      prisma.refreshToken.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } }
      }),
      prisma.refreshToken.count({ where })
    ]);

    return { sessions, total, page, limit };
  }

  static async revokeSession(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { isRevoked: true, revokedAt: new Date() } });
  }

  static async revokeSessionFamily(family: string) {
    return prisma.refreshToken.updateMany({ where: { family, isRevoked: false }, data: { isRevoked: true, revokedAt: new Date() } });
  }

  // ------------------------------------------------------------------
  // Admin AI (Phase 6): fraud detection, platform insights, moderation,
  // system health, executive reports, predictive analytics.
  //
  // Every method below computes real, deterministic signals from existing
  // tables -- there is no separate fraud/analytics tracking schema. The AI
  // layer only ever explains and prioritizes what these queries actually
  // find.
  // ------------------------------------------------------------------

  /** Student profiles sharing the same phone number -- a real, if imperfect, duplicate-account signal. */
  static async getDuplicateAccountSignals() {
    const withPhone = await prisma.studentProfile.groupBy({
      by: ['phone'],
      where: { phone: { not: null } },
      _count: { _all: true },
      having: { phone: { _count: { gt: 1 } } }
    });

    const details = await Promise.all(
      withPhone.map(async (row: { phone: string | null; _count: { _all: number } }) => {
        const profiles = await prisma.studentProfile.findMany({
          where: { phone: row.phone },
          select: { id: true, firstName: true, lastName: true, userId: true, user: { select: { email: true } } }
        });
        return { phone: row.phone, count: row._count._all, profiles };
      })
    );

    return details;
  }

  /**
   * Users who created an unusual number of login sessions (RefreshToken
   * families) in the last 24 hours -- a real signal for credential-stuffing
   * or brute-force attempts, computed from the actual session table rather
   * than a separate login-attempt log (which the schema doesn't have).
   */
  static async getSuspiciousLoginSignals(thresholdPerDay = 8) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessions = await prisma.refreshToken.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true, family: true, createdAt: true }
    });

    const byUser = new Map<string, Set<string>>();
    for (const s of sessions) {
      if (!byUser.has(s.userId)) byUser.set(s.userId, new Set());
      byUser.get(s.userId)!.add(s.family);
    }

    const flaggedUserIds = Array.from(byUser.entries())
      .filter(([, families]) => families.size >= thresholdPerDay)
      .map(([userId, families]) => ({ userId, sessionFamiliesLast24h: families.size }));

    if (flaggedUserIds.length === 0) return [];

    const users = await prisma.user.findMany({
      where: { id: { in: flaggedUserIds.map(f => f.userId) } },
      select: { id: true, email: true, role: true }
    });
    const userById = new Map(users.map((u: { id: string; email: string; role: string }) => [u.id, u]));

    return flaggedUserIds.map(f => ({ ...f, user: userById.get(f.userId) }));
  }

  /** Unverified companies/universities with no real recruiting/placement activity, created a while ago. */
  static async getFakeOrganizationSignals() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const suspiciousCompanies = await prisma.company.findMany({
      where: { isVerified: false, isDeleted: false, createdAt: { lte: thirtyDaysAgo }, jobs: { none: {} } },
      select: { id: true, name: true, industry: true, createdAt: true }
    });

    const suspiciousUniversities = await prisma.university.findMany({
      where: { isVerified: false, isDeleted: false, createdAt: { lte: thirtyDaysAgo }, students: { none: {} } },
      select: { id: true, name: true, location: true, createdAt: true }
    });

    return { suspiciousCompanies, suspiciousUniversities };
  }

  /** Active resumes whose full parsed text is identical across different students -- a real duplicate-content signal. */
  static async getDuplicateResumeSignals() {
    const resumes = await prisma.resume.findMany({
      where: { isActive: true, parsedText: { not: null } },
      select: { id: true, studentProfileId: true, parsedText: true, fileName: true }
    });

    const byText = new Map<string, { id: string; studentProfileId: string; fileName: string }[]>();
    for (const r of resumes) {
      const text = (r.parsedText || '').trim();
      if (text.length < 200) continue; // too short to be a meaningful duplicate signal
      if (!byText.has(text)) byText.set(text, []);
      byText.get(text)!.push({ id: r.id, studentProfileId: r.studentProfileId, fileName: r.fileName });
    }

    return Array.from(byText.values()).filter(group => new Set(group.map(g => g.studentProfileId)).size > 1);
  }

  /** Students who submitted an unusually high number of applications in the last 24 hours. */
  static async getAbnormalApplicationSignals(thresholdPerDay = 15) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const grouped = await prisma.application.groupBy({
      by: ['studentProfileId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      having: { studentProfileId: { _count: { gte: thresholdPerDay } } }
    });

    if (grouped.length === 0) return [];

    const profiles = await prisma.studentProfile.findMany({
      where: { id: { in: grouped.map((g: { studentProfileId: string }) => g.studentProfileId) } },
      select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } }
    });
    const profileById = new Map(profiles.map((p: { id: string }) => [p.id, p]));

    return grouped.map((g: { studentProfileId: string; _count: { _all: number } }) => ({
      studentProfileId: g.studentProfileId,
      applicationsLast24h: g._count._all,
      profile: profileById.get(g.studentProfileId)
    }));
  }

  /**
   * Real, already-computed platform growth/engagement metrics over a given
   * lookback window -- reused for both Platform Insights and Predictive
   * Analytics (which needs the same numbers broken out by period).
   */
  static async getPlatformGrowthStats(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [newUsers, usersByRole, newJobs, newApplications, acceptedOffers, aiUsageCount, messagesCount] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.groupBy({ by: ['role'], where: { lastLoginAt: { gte: since } }, _count: { _all: true } }),
      prisma.job.count({ where: { createdAt: { gte: since } } }),
      prisma.application.count({ where: { createdAt: { gte: since } } }),
      prisma.offer.count({ where: { status: 'ACCEPTED', respondedAt: { gte: since } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since }, action: { contains: 'GENERATED' } } }),
      prisma.message.count({ where: { createdAt: { gte: since } } })
    ]);

    return {
      windowDays: days,
      newUsers,
      activeUsersByRole: usersByRole.map((r: { role: string; _count: { _all: number } }) => ({ role: r.role, count: r._count._all })),
      newJobs,
      newApplications,
      acceptedOffers,
      aiFeatureUsageCount: aiUsageCount,
      messagesSent: messagesCount
    };
  }

  /** Real audit log volume/error stats used for System Health AI and Executive Reports. */
  static async getSystemHealthSignals() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalLast24h, errorsLast24h, totalLast7d, errorsLast7d, actionBreakdown] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: since24h } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since24h }, action: { contains: 'ERROR' } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since7d } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since7d }, action: { contains: 'ERROR' } } }),
      prisma.auditLog.groupBy({ by: ['action'], where: { createdAt: { gte: since7d } }, _count: { _all: true }, orderBy: { _count: { action: 'desc' } }, take: 10 })
    ]);

    return {
      totalEventsLast24h: totalLast24h,
      errorEventsLast24h: errorsLast24h,
      totalEventsLast7d: totalLast7d,
      errorEventsLast7d: errorsLast7d,
      topActionsLast7d: actionBreakdown.map((a: { action: string; _count: { _all: number } }) => ({ action: a.action, count: a._count._all }))
    };
  }

  /** Real month-over-month application/placement trend data for Predictive Analytics. */
  static async getHistoricalTrends(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const [applications, offers, departmentRows] = await Promise.all([
      prisma.application.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.offer.findMany({ where: { respondedAt: { gte: since }, status: 'ACCEPTED' }, select: { respondedAt: true } }),
      prisma.studentProfile.groupBy({ by: ['departmentId', 'verificationStatus'], where: { updatedAt: { gte: since } }, _count: { _all: true } })
    ]);

    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const applicationsByMonth = new Map<string, number>();
    for (const a of applications) {
      const key = monthKey(a.createdAt);
      applicationsByMonth.set(key, (applicationsByMonth.get(key) || 0) + 1);
    }

    const placementsByMonth = new Map<string, number>();
    for (const o of offers) {
      if (!o.respondedAt) continue;
      const key = monthKey(o.respondedAt);
      placementsByMonth.set(key, (placementsByMonth.get(key) || 0) + 1);
    }

    return {
      applicationsByMonth: Array.from(applicationsByMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
      placementsByMonth: Array.from(placementsByMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
      departmentActivitySample: departmentRows.length
    };
  }

  static async createPlatformInsightReport(data: {
    reportType: string;
    payload: any;
    modelVersion: string;
    generatedBy: string;
  }) {
    return prisma.platformInsightReport.create({ data });
  }

  static async getLatestPlatformInsightReport(reportType: string) {
    return prisma.platformInsightReport.findFirst({
      where: { reportType },
      orderBy: { createdAt: 'desc' }
    });
  }
}
