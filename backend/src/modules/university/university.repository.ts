import { prisma } from '../../config/database';
import { VerificationStatus } from '@prisma/client';

export class UniversityRepository {
  static async getStudents(universityId: string) {
    return prisma.studentProfile.findMany({
      where: { universityId },
      include: {
        user: true,
        department: true,
        skills: { include: { skill: true } },
        resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
        projects: true,
        certifications: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findStudentInUniversity(universityId: string, studentProfileId: string) {
    return prisma.studentProfile.findFirst({
      where: { id: studentProfileId, universityId }
    });
  }

  static async updateStudentStatus(studentProfileId: string, status: VerificationStatus) {
    return prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { verificationStatus: status }
    });
  }

  /**
   * University dashboard overview. Every value is a real aggregate over this
   * university's own students / applications / offers / drives -- no mock or
   * fabricated figures. Returned as a superset of the original shape so the
   * existing desktop consumer of `/university/dashboard` keeps working.
   *
   * Honesty notes:
   *  - "Placed" == a student flagged PLACEMENT_COMPLETED. "Seeking" ==
   *    PLACEMENT_ELIGIBLE, "Pending" == PENDING verification. These are the real
   *    VerificationStatus states; there is no separate placement table.
   *  - "Graduated" == graduationYear strictly before the current calendar year
   *    (the only completion signal in the schema); everyone else is "active".
   *  - Packages come from ACCEPTED offers of this university's students (any job
   *    type), matching the existing analytics endpoint.
   *  - Internships are derived from applications to INTERNSHIP-type jobs. There
   *    is NO internship lifecycle/end date, so "completed" cannot be computed --
   *    only currently-active (started) vs upcoming, plus a success rate.
   */
  static async getDashboard(universityId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();

    const [
      totalStudents, graduatedStudents, statusGroups,
      departmentsCount, drivesCount, upcomingDrives, university, apps
    ] = await Promise.all([
      prisma.studentProfile.count({ where: { universityId } }),
      prisma.studentProfile.count({ where: { universityId, graduationYear: { lt: currentYear } } }),
      prisma.studentProfile.groupBy({ by: ['verificationStatus'], where: { universityId }, _count: { _all: true } }),
      prisma.department.count({ where: { universityId } }),
      prisma.placementDrive.count({ where: { universityId, isDeleted: false } }),
      prisma.placementDrive.findMany({
        where: { universityId, isDeleted: false, scheduledAt: { gte: now } },
        orderBy: { scheduledAt: 'asc' },
        take: 5
      }),
      prisma.university.findUnique({ where: { id: universityId }, select: { name: true, logoUrl: true, location: true } }),
      prisma.application.findMany({
        where: { studentProfile: { universityId } },
        select: {
          status: true, createdAt: true,
          studentProfile: { select: { id: true, firstName: true, lastName: true } },
          job: { select: { id: true, title: true, jobType: true, companyId: true, company: { select: { name: true } } } },
          offer: { select: { status: true, startDate: true, respondedAt: true, createdAt: true, salary: true } }
        }
      })
    ]);

    // ── Student status breakdown ──
    const byStatus: Record<string, number> = {
      PENDING: 0, VERIFIED: 0, PLACEMENT_ELIGIBLE: 0, PLACEMENT_COMPLETED: 0, REJECTED: 0
    };
    for (const g of statusGroups) byStatus[g.verificationStatus] = g._count._all;
    const placed = byStatus.PLACEMENT_COMPLETED;
    const pending = byStatus.PENDING;
    const seeking = byStatus.PLACEMENT_ELIGIBLE;
    const activeStudents = totalStudents - graduatedStudents;
    const placementRate = totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0;

    // ── Companies connected (distinct companies students applied to) ──
    const companyIds = new Set<string>();
    for (const a of apps) companyIds.add(a.job.companyId);

    // ── Placement packages + trend (accepted offers, any job type) ──
    const acceptedOffers = apps.map(a => a.offer).filter(o => o && o.status === 'ACCEPTED') as
      { status: string; startDate: Date; respondedAt: Date | null; createdAt: Date; salary: number }[];
    const salaries = acceptedOffers.map(o => o.salary).filter(n => typeof n === 'number');
    const averagePackage = salaries.length > 0 ? Math.round(salaries.reduce((s, n) => s + n, 0) / salaries.length) : null;
    const highestPackage = salaries.length > 0 ? Math.max(...salaries) : null;
    const trendMap = new Map<string, number>();
    for (const o of acceptedOffers) {
      // Match the existing analytics endpoint: fall back to the offer's real
      // createdAt (never "now") when respondedAt is missing in seeded data.
      const y = new Date(o.respondedAt || o.createdAt).getFullYear().toString();
      trendMap.set(y, (trendMap.get(y) || 0) + 1);
    }
    const placementTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, placements]) => ({ year, placements }));

    // ── Internships (INTERNSHIP-type jobs) ──
    const internApps = apps.filter(a => a.job.jobType === 'INTERNSHIP');
    const internAccepted = internApps.filter(a => a.offer?.status === 'ACCEPTED');
    const internCompanyIds = new Set(internApps.map(a => a.job.companyId));
    const internStudentIds = new Set(internAccepted.map(a => a.studentProfile.id));
    const activeInternships = internAccepted.filter(a => a.offer!.startDate && new Date(a.offer!.startDate) <= now).length;
    const upcomingInternships = internAccepted.filter(a => a.offer!.startDate && new Date(a.offer!.startDate) > now).length;
    const internshipSuccessRate = internApps.length > 0 ? Math.round((internAccepted.length / internApps.length) * 100) : null;
    const internshipPercentage = totalStudents > 0 ? Math.round((internStudentIds.size / totalStudents) * 100) : 0;

    // ── Recent activity (real rows only) ──
    type Activity = { type: 'APPLICATION' | 'PLACEMENT' | 'DRIVE'; summary: string; timestamp: string };
    const activities: Activity[] = [];
    for (const a of apps) {
      const name = `${a.studentProfile.firstName} ${a.studentProfile.lastName}`.trim();
      activities.push({
        type: 'APPLICATION',
        summary: `${name} applied to ${a.job.title} at ${a.job.company.name}`,
        timestamp: new Date(a.createdAt).toISOString()
      });
      if (a.offer?.status === 'ACCEPTED' && a.offer.respondedAt) {
        activities.push({
          type: 'PLACEMENT',
          summary: `${name} accepted an offer from ${a.job.company.name}`,
          timestamp: new Date(a.offer.respondedAt).toISOString()
        });
      }
    }
    for (const d of upcomingDrives) {
      activities.push({
        type: 'DRIVE',
        summary: `Campus drive "${d.title}" scheduled at ${d.location}`,
        timestamp: new Date(d.createdAt).toISOString()
      });
    }
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 10);

    return {
      // ── existing fields (backward compatible) ──
      placementRate,
      studentsPlaced: placed,
      pendingVerificationsCount: pending,
      totalStudents,
      upcomingDrives,
      // ── Module 1 additions ──
      university: university || { name: 'University', logoUrl: null, location: '' },
      students: {
        total: totalStudents,
        active: activeStudents,
        graduated: graduatedStudents,
        byStatus
      },
      departmentsCount,
      drivesCount,
      companiesConnected: companyIds.size,
      placement: {
        placed,
        pending,
        seeking,
        placementPercentage: placementRate,
        highestPackage,
        averagePackage,
        trend: placementTrend
      },
      internships: {
        totalApplications: internApps.length,
        accepted: internAccepted.length,
        active: activeInternships,
        upcoming: upcomingInternships,
        companiesOffering: internCompanyIds.size,
        successRate: internshipSuccessRate,
        studentsWithInternship: internStudentIds.size,
        internshipPercentage,
        completionTracked: false
      },
      recentActivity
    };
  }

  /**
   * Real placement analytics computed from actual Application/Offer data for
   * this university's students -- no hardcoded salary or trend figures.
   */
  static async getAnalytics(universityId: string) {
    const totalStudents = await prisma.studentProfile.count({ where: { universityId } });
    const placed = await prisma.studentProfile.count({ where: { universityId, verificationStatus: 'PLACEMENT_COMPLETED' } });

    const acceptedOffers = await prisma.offer.findMany({
      where: {
        status: 'ACCEPTED',
        application: { studentProfile: { universityId } }
      },
      select: { salary: true, respondedAt: true, createdAt: true }
    });

    const salaries = acceptedOffers.map((o: { salary: number }) => o.salary);
    const averageSalary = salaries.length > 0 ? Math.round(salaries.reduce((s: number, n: number) => s + n, 0) / salaries.length) : null;
    const highestPackage = salaries.length > 0 ? Math.max(...salaries) : null;

    const byYear = new Map<string, number>();
    for (const offer of acceptedOffers) {
      const year = new Date(offer.respondedAt || offer.createdAt).getFullYear().toString();
      byYear.set(year, (byYear.get(year) || 0) + 1);
    }
    const hiringTrends = Array.from(byYear.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, placements: count }));

    const [placedByDept, totalByDept, departments] = await Promise.all([
      prisma.studentProfile.groupBy({
        by: ['departmentId'],
        where: { universityId, verificationStatus: 'PLACEMENT_COMPLETED' },
        _count: { _all: true }
      }),
      prisma.studentProfile.groupBy({
        by: ['departmentId'],
        where: { universityId },
        _count: { _all: true }
      }),
      prisma.department.findMany({ where: { universityId } })
    ]);

    const deptNameById = new Map(departments.map((d: { id: string; name: string }) => [d.id, d.name]));
    const totalByDeptId = new Map(totalByDept.map((row: { departmentId: string | null; _count: { _all: number } }) => [row.departmentId, row._count._all]));

    const departmentBreakdown = placedByDept.map((row: { departmentId: string | null; _count: { _all: number } }) => {
      const total = totalByDeptId.get(row.departmentId) || 0;
      return {
        departmentId: row.departmentId,
        departmentName: row.departmentId ? (deptNameById.get(row.departmentId) || 'Unknown') : 'Unassigned',
        placed: row._count._all,
        total,
        placementPercentage: total > 0 ? Math.round((row._count._all / total) * 100) : 0
      };
    });

    // Mock interview readiness -- aggregated from the SAME stored
    // MockInterviewReport rows the students see (never recomputed).
    const interviewReports = await prisma.mockInterviewReport.findMany({
      where: { mockInterview: { studentProfile: { universityId }, status: 'COMPLETED' } },
      select: {
        score: true,
        interviewReadiness: true,
        mockInterview: { select: { studentProfile: { select: { departmentId: true } } } }
      }
    });
    const readinessByDept = new Map<string | null, { scores: number[]; readiness: number[] }>();
    for (const r of interviewReports) {
      const deptId = r.mockInterview.studentProfile.departmentId;
      const bucket = readinessByDept.get(deptId) ?? { scores: [], readiness: [] };
      bucket.scores.push(r.score);
      if (r.interviewReadiness != null) bucket.readiness.push(r.interviewReadiness);
      readinessByDept.set(deptId, bucket);
    }
    const avgOf = (nums: number[]) => (nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : null);
    const interviewReadinessByDepartment = Array.from(readinessByDept.entries()).map(([deptId, bucket]) => ({
      departmentId: deptId,
      departmentName: deptId ? deptNameById.get(deptId) || 'Unknown' : 'Unassigned',
      interviewsCompleted: bucket.scores.length,
      averageScore: avgOf(bucket.scores),
      averageReadiness: avgOf(bucket.readiness)
    }));

    return {
      placementPercentage: totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0,
      totalStudents,
      studentsPlaced: placed,
      averageSalary,
      highestPackage,
      hiringTrends,
      departmentBreakdown,
      interviewReadiness: {
        totalInterviews: interviewReports.length,
        averageScore: avgOf(interviewReports.map(r => r.score)),
        averageReadiness: avgOf(interviewReports.map(r => r.interviewReadiness).filter((n): n is number => n != null)),
        byDepartment: interviewReadinessByDepartment
      }
    };
  }

  /**
   * Real "partner companies" view -- there is no explicit University<->Company
   * partnership model, so this is derived from actual recruitment activity:
   * every company that has received at least one application from a student
   * at this university, with real application/interview/offer counts.
   */
  static async getPartnerCompanies(universityId: string) {
    const applications = await prisma.application.findMany({
      where: { studentProfile: { universityId } },
      select: {
        status: true,
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            company: { select: { id: true, name: true, logoUrl: true, industry: true, website: true } }
          }
        },
        offer: { select: { status: true } }
      }
    });

    const byCompany = new Map<string, {
      id: string; name: string; logoUrl: string | null; industry: string; website: string | null;
      applications: number; hired: number; openJobIds: Set<string>;
    }>();

    for (const app of applications) {
      const company = app.job.company;
      let entry = byCompany.get(company.id);
      if (!entry) {
        entry = { id: company.id, name: company.name, logoUrl: company.logoUrl, industry: company.industry, website: company.website, applications: 0, hired: 0, openJobIds: new Set() };
        byCompany.set(company.id, entry);
      }
      entry.applications += 1;
      if (app.offer?.status === 'ACCEPTED') entry.hired += 1;
      if (app.job.status === 'PUBLISHED') entry.openJobIds.add(app.job.id);
    }

    return Array.from(byCompany.values())
      .map(c => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logoUrl,
        industry: c.industry,
        website: c.website,
        applications: c.applications,
        hired: c.hired,
        openJobs: c.openJobIds.size
      }))
      .sort((a, b) => b.applications - a.applications);
  }

  /**
   * Real internship records for this university's students. Derived from actual
   * Application/Offer/Job data (jobType INTERNSHIP) -- there is no separate
   * internship model, so this reuses the recruitment tables the same way
   * getPartnerCompanies does. No mock or fabricated rows.
   */
  static async getInternships(universityId: string) {
    return prisma.application.findMany({
      where: { studentProfile: { universityId }, job: { jobType: 'INTERNSHIP' } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        studentProfile: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, department: { select: { id: true, name: true } } }
        },
        job: {
          select: { id: true, title: true, location: true, company: { select: { id: true, name: true, logoUrl: true } } }
        },
        offer: { select: { status: true, startDate: true, salary: true, respondedAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getSettings(universityId: string) {
    const university = await prisma.university.findUnique({
      where: { id: universityId },
      include: { placementCells: { orderBy: { createdAt: 'asc' }, take: 1 } }
    });
    return university;
  }

  static async updateSettings(universityId: string, data: {
    name?: string; logoUrl?: string; location?: string;
    directorName?: string; contactEmail?: string; phone?: string;
  }) {
    const { directorName, contactEmail, phone, ...universityFields } = data;

    await prisma.university.update({
      where: { id: universityId },
      data: universityFields
    });

    if (directorName !== undefined || contactEmail !== undefined || phone !== undefined) {
      const existingCell = await prisma.placementCell.findFirst({ where: { universityId } });
      if (existingCell) {
        await prisma.placementCell.update({
          where: { id: existingCell.id },
          data: {
            ...(directorName !== undefined ? { directorName } : {}),
            ...(contactEmail !== undefined ? { contactEmail } : {}),
            ...(phone !== undefined ? { phone } : {})
          }
        });
      } else if (directorName && contactEmail) {
        await prisma.placementCell.create({
          data: { universityId, directorName, contactEmail, phone: phone || null }
        });
      }
    }

    return this.getSettings(universityId);
  }

  /** Broadcast messaging is implemented via the generic Notification model (type MESSAGE) -- real delivery, no separate chat schema needed. */
  static async sendBroadcast(senderId: string, recipientUserIds: string[], title: string, content: string) {
    const sentAt = new Date();
    await prisma.notification.createMany({
      data: recipientUserIds.map(recipientId => ({
        senderId,
        recipientId,
        type: 'MESSAGE' as const,
        title,
        content,
        createdAt: sentAt
      }))
    });
    return { recipientCount: recipientUserIds.length, title, content, sentAt };
  }

  static async getSentBroadcasts(senderId: string) {
    const notifications = await prisma.notification.findMany({
      where: { senderId, type: 'MESSAGE' },
      orderBy: { createdAt: 'desc' }
    });

    const grouped = new Map<string, { title: string; content: string; sentAt: Date; recipientCount: number }>();
    for (const n of notifications) {
      const key = `${n.title}|${n.content}|${n.createdAt.toISOString()}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.recipientCount += 1;
      } else {
        grouped.set(key, { title: n.title, content: n.content, sentAt: n.createdAt, recipientCount: 1 });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  // ------------------------------------------------------------------
  // University AI (Phase 5): placement prediction, department insight,
  // campus drive recommendations, and executive placement reports.
  // ------------------------------------------------------------------

  /**
   * Everything UniversityAgent needs to assess one student's placement
   * outlook: academic data, current skills, latest active resume's AI
   * analysis, and recent mock interview reports. Mirrors
   * EmployerRepository.getCandidateEvaluationContext's shape -- a bespoke
   * `select`/`include` query scoped by `universityId` so a placement cell
   * can never assess another university's student.
   */
  static async getPlacementPredictionContext(universityId: string, studentProfileId: string) {
    return prisma.studentProfile.findFirst({
      where: { id: studentProfileId, universityId },
      select: {
        id: true,
        firstName: true,
        graduationYear: true,
        currentGpa: true,
        department: { select: { name: true } },
        skills: { include: { skill: true } },
        resumes: {
          where: { isActive: true },
          take: 1,
          include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
        },
        mockInterviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } }
        }
      }
    });
  }

  static async createStudentPlacementInsight(
    studentProfileId: string,
    data: {
      placementProbability: number;
      riskLevel: string;
      summary: string;
      riskFactors: string[];
      strengths: string[];
      suggestedActions: string[];
      modelVersion: string;
    }
  ) {
    return prisma.studentPlacementInsight.create({
      data: { studentProfileId, ...data }
    });
  }

  static async getLatestStudentPlacementInsight(universityId: string, studentProfileId: string) {
    return prisma.studentPlacementInsight.findFirst({
      where: { studentProfileId, studentProfile: { universityId } },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Context for campus drive recommendations: the student body's skill
   * distribution (grouped by frequency), current department breakdown /
   * hiring trends (reusing getAnalytics's deterministic numbers), and titles
   * of past drives already run so the AI doesn't repeat them blindly.
   */
  static async getDriveRecommendationContext(universityId: string) {
    const [skillRows, analytics, pastDrives] = await Promise.all([
      prisma.studentSkill.findMany({
        where: { studentProfile: { universityId } },
        select: { skill: { select: { name: true } } }
      }),
      this.getAnalytics(universityId),
      prisma.placementDrive.findMany({
        where: { universityId, isDeleted: false },
        select: { title: true, scheduledAt: true },
        orderBy: { scheduledAt: 'desc' },
        take: 10
      })
    ]);

    const skillCounts = new Map<string, number>();
    for (const row of skillRows) {
      const name = row.skill.name;
      skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
    }
    const topSkills = Array.from(skillCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    return { topSkills, analytics, pastDrives };
  }
}
