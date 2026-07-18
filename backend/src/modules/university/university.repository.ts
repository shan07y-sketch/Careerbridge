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

  static async getDashboard(universityId: string) {
    const [totalStudents, placed, pending, upcomingDrives] = await Promise.all([
      prisma.studentProfile.count({ where: { universityId } }),
      prisma.studentProfile.count({ where: { universityId, verificationStatus: 'PLACEMENT_COMPLETED' } }),
      prisma.studentProfile.count({ where: { universityId, verificationStatus: 'PENDING' } }),
      prisma.placementDrive.findMany({
        where: { universityId, isDeleted: false, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: 'asc' },
        take: 5
      })
    ]);

    return {
      placementRate: totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0,
      studentsPlaced: placed,
      pendingVerificationsCount: pending,
      totalStudents,
      upcomingDrives
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
