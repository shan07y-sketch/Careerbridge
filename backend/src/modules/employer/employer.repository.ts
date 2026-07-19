import { prisma } from '../../config/database';
import { ApplicationStatus, JobType, WorkMode, JobStatus } from '@prisma/client';

export class EmployerRepository {
  static deriveLegacyFlags(status: JobStatus): { isPublished: boolean; isDeleted: boolean } {
    return {
      isPublished: status === 'PUBLISHED',
      isDeleted: status === 'ARCHIVED'
    };
  }

  static async getDashboard(companyId: string) {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: { applications: true }
    });

    const recruiterCount = await prisma.recruiter.count({
      where: { companyId }
    });

    const jobIds = jobs.map(j => j.id);

    const [upcomingInterviewCount, activeOfferCount] = await Promise.all([
      jobIds.length === 0
        ? Promise.resolve(0)
        : prisma.interview.count({
            where: {
              status: 'SCHEDULED',
              application: { jobId: { in: jobIds } }
            }
          }),
      jobIds.length === 0
        ? Promise.resolve(0)
        : prisma.offer.count({
            where: {
              status: 'EXTENDED',
              application: { jobId: { in: jobIds } }
            }
          })
    ]);

    const activeJobs = jobs.filter(j => j.status === 'PUBLISHED');
    const totalApplications = jobs.reduce((sum, j) => sum + j.applications.length, 0);

    return {
      activeJobsCount: activeJobs.length,
      totalApplications,
      recruiterCount,
      upcomingInterviewCount,
      activeOfferCount,
      jobsList: jobs.slice(0, 5)
    };
  }

  /**
   * All interviews across every job this company owns, most recent first --
   * backs the Interviews tab's list/calendar view. Includes enough candidate
   * and job context for the UI to render without a second round-trip.
   */
  static async getInterviews(companyId: string) {
    return prisma.interview.findMany({
      where: {
        application: { job: { companyId } }
      },
      include: {
        application: {
          include: {
            job: { select: { id: true, title: true } },
            studentProfile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                user: { select: { email: true } }
              }
            }
          }
        },
        scheduledByRecruiter: {
          select: {
            id: true,
            title: true,
            user: { select: { email: true } }
          }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });
  }

  static async getCompanyProfile(companyId: string) {
    return prisma.company.findUnique({
      where: { id: companyId }
    });
  }

  // NOTE: coverImageUrl/missionValues/techStack/galleryImages/
  // officeLocations/screenedTarget/outreachTarget are real columns added on
  // Company (see migration 20260717120000_employer_company_profile_fields).
  // They are referenced here via an `as any` cast on the `data` payload
  // because this sandbox has no network route to regenerate the Prisma
  // Client against the new schema -- run `npx prisma generate` locally
  // after applying the migration and this cast can be removed.
  static async updateCompanyProfile(companyId: string, data: any) {
    return prisma.company.update({
      where: { id: companyId },
      data: {
        logoUrl: data.logoUrl,
        website: data.website,
        industry: data.industry,
        description: data.description,
        size: data.size,
        headquarters: data.headquarters,
        coverImageUrl: data.coverImageUrl,
        missionValues: data.missionValues,
        techStack: data.techStack,
        galleryImages: data.galleryImages,
        officeLocations: data.officeLocations,
        screenedTarget: data.screenedTarget,
        outreachTarget: data.outreachTarget
      } as any
    });
  }

  /**
   * Real, live-computed activity for the Company tab's monthly goals widget
   * -- "screened" counts applications this company's recruiters have moved
   * past APPLIED this calendar month; "outreach" counts interviews their
   * recruiters have scheduled this calendar month. Both are derived from
   * existing Application/Interview rows, not stored counters.
   */
  static async getCompanyActivityThisMonth(companyId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [screened, outreach] = await Promise.all([
      prisma.application.count({
        where: {
          job: { companyId },
          status: { not: 'APPLIED' },
          updatedAt: { gte: startOfMonth }
        }
      }),
      prisma.interview.count({
        where: {
          application: { job: { companyId } },
          scheduledAt: { gte: startOfMonth }
        }
      })
    ]);

    return { screened, outreach };
  }

  /**
   * Real recruiter directory for the Team/Recruiters tab. Every count here
   * (jobs owned, interviews they've scheduled, offers they've extended) is
   * a live aggregate over that recruiter's own relations -- there is no
   * "department"/"office"/"workload %" data anywhere in the schema, so
   * those fabricated fields from the old mockup are simply not included
   * rather than being backfilled with more invented numbers.
   */
  static async getRecruiters(companyId: string) {
    return prisma.recruiter.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, email: true, lastLoginAt: true, createdAt: true } },
        _count: { select: { jobs: true, scheduledInterviews: true, offers: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async createJob(companyId: string, recruiterId: string, categoryId: string, data: any) {
    const status: JobStatus = data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const legacy = this.deriveLegacyFlags(status);
    const skillIds: string[] = Array.isArray(data.skillIds) ? data.skillIds : [];

    return prisma.job.create({
      data: {
        companyId,
        recruiterId,
        categoryId,
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        location: data.location,
        jobType: data.jobType as JobType,
        workMode: data.workMode as WorkMode,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency || 'USD',
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status,
        isPublished: legacy.isPublished,
        isDeleted: legacy.isDeleted,
        ...(skillIds.length > 0
          ? { skillsRequired: { create: skillIds.map(skillId => ({ skillId })) } }
          : {})
      },
      include: { skillsRequired: { include: { skill: true } }, category: true }
    });
  }

  static async updateJob(companyId: string, jobId: string, data: any, opts: { isAutosave?: boolean } = {}) {
    const skillIds: string[] | undefined = Array.isArray(data.skillIds) ? data.skillIds : undefined;
    const statusUpdate = data.status
      ? { status: data.status as JobStatus, ...this.deriveLegacyFlags(data.status as JobStatus) }
      : {};

    return prisma.$transaction(async (tx) => {
      const job = await tx.job.update({
        where: { id: jobId, companyId },
        data: {
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          benefits: data.benefits,
          location: data.location,
          jobType: data.jobType as JobType | undefined,
          workMode: data.workMode as WorkMode | undefined,
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          currency: data.currency,
          deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
          categoryId: data.categoryId,
          ...statusUpdate
        }
      });

      if (skillIds) {
        const existing = await tx.jobSkill.findMany({ where: { jobId } });
        const existingIds = new Set(existing.map(s => s.skillId));
        const desiredIds = new Set(skillIds);

        const toRemove = [...existingIds].filter(id => !desiredIds.has(id));
        const toAdd = [...desiredIds].filter(id => !existingIds.has(id));

        if (toRemove.length > 0) {
          await tx.jobSkill.deleteMany({ where: { jobId, skillId: { in: toRemove } } });
        }
        if (toAdd.length > 0) {
          await tx.jobSkill.createMany({
            data: toAdd.map(skillId => ({ jobId, skillId })),
            skipDuplicates: true
          });
        }
      }

      return tx.job.findUnique({
        where: { id: jobId },
        include: { skillsRequired: { include: { skill: true } }, category: true }
      });
    });
  }

  static async getJobCategories() {
    return prisma.jobCategory.findMany({ orderBy: { name: 'asc' } });
  }

  static async getJobs(companyId: string) {
    return prisma.job.findMany({
      where: { companyId },
      include: { applications: { select: { id: true } }, category: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findJobInCompany(companyId: string, jobId: string) {
    return prisma.job.findFirst({
      where: { id: jobId, companyId },
      include: { skillsRequired: true, applications: { select: { id: true } } }
    });
  }

  static async duplicateJob(companyId: string, recruiterId: string, source: any) {
    return prisma.job.create({
      data: {
        companyId,
        recruiterId,
        categoryId: source.categoryId,
        title: `${source.title} (Copy)`,
        description: source.description,
        requirements: source.requirements,
        benefits: source.benefits,
        location: source.location,
        jobType: source.jobType,
        workMode: source.workMode,
        salaryMin: source.salaryMin,
        salaryMax: source.salaryMax,
        currency: source.currency,
        deadline: source.deadline,
        status: 'DRAFT',
        isPublished: false,
        isDeleted: false,
        ...(source.skillsRequired?.length > 0
          ? { skillsRequired: { create: source.skillsRequired.map((s: any) => ({ skillId: s.skillId })) } }
          : {})
      },
      include: { skillsRequired: { include: { skill: true } }, category: true }
    });
  }

  static async setJobStatus(jobId: string, status: JobStatus) {
    const legacy = this.deriveLegacyFlags(status);
    return prisma.job.update({
      where: { id: jobId },
      data: { status, ...legacy, ...(status === 'ARCHIVED' ? { deletedAt: new Date() } : {}) },
      include: { skillsRequired: { include: { skill: true } }, category: true }
    });
  }

  static async hardDeleteJob(jobId: string) {
    return prisma.$transaction(async tx => {
      await tx.jobSkill.deleteMany({ where: { jobId } });
      await tx.savedJob.deleteMany({ where: { jobId } });
      return tx.job.delete({ where: { id: jobId } });
    });
  }

  static async bulkSetJobStatus(jobIds: string[], status: JobStatus) {
    const legacy = this.deriveLegacyFlags(status);
    return prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: { status, ...legacy, ...(status === 'ARCHIVED' ? { deletedAt: new Date() } : {}) }
    });
  }

  static async filterOwnedJobIds(companyId: string, jobIds: string[]) {
    const owned = await prisma.job.findMany({ where: { id: { in: jobIds }, companyId }, select: { id: true } });
    return owned.map(j => j.id);
  }

  static async getApplications(companyId: string) {
    return prisma.application.findMany({
      where: {
        job: { companyId }
      },
      include: {
        studentProfile: {
          include: {
            user: true,
            resumes: true,
            resumeAnalyses: true
          }
        },
        job: true,
        stages: true
      }
    });
  }

  static async getApplicationQueue(
    companyId: string,
    options: {
      search?: string;
      status?: ApplicationStatus;
      jobId?: string;
      dateFrom?: string;
      dateTo?: string;
      tagIds?: string[];
      sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'candidateName';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ) {
    const { search, status, jobId, dateFrom, dateTo, tagIds, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = options;

    const where: any = {
      job: { companyId },
      ...(status ? { status } : {}),
      ...(jobId ? { jobId } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {})
            }
          }
        : {}),
      ...(tagIds && tagIds.length > 0 ? { tags: { some: { tagId: { in: tagIds } } } } : {}),
      ...(search
        ? {
            OR: [
              { studentProfile: { firstName: { contains: search, mode: 'insensitive' } } },
              { studentProfile: { lastName: { contains: search, mode: 'insensitive' } } },
              { studentProfile: { user: { email: { contains: search, mode: 'insensitive' } } } },
              { job: { title: { contains: search, mode: 'insensitive' } } }
            ]
          }
        : {})
    };

    const orderBy =
      sortBy === 'candidateName'
        ? { studentProfile: { firstName: sortOrder } }
        : sortBy === 'status'
        ? { status: sortOrder }
        : { [sortBy]: sortOrder };

    const [total, applications] = await prisma.$transaction([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          studentProfile: {
            include: {
              user: true,
              resumes: { where: { isActive: true }, take: 1 }
            }
          },
          job: true,
          offer: true,
          interviews: { orderBy: { scheduledAt: 'desc' }, take: 1 },
          tags: { include: { tag: true } }
        },
        orderBy: orderBy as any,
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return { total, page, limit, applications };
  }

  static async getApplicationDetail(companyId: string, applicationId: string) {
    return prisma.application.findFirst({
      where: { id: applicationId, job: { companyId } },
      include: {
        studentProfile: {
          include: {
            user: true,
            resumes: { where: { isActive: true }, take: 1 },
            skills: { include: { skill: true } }
          }
        },
        job: true,
        stages: { orderBy: { createdAt: 'asc' } },
        interviews: { orderBy: { scheduledAt: 'asc' }, include: { scheduledByRecruiter: { include: { user: true } } } },
        notes: { orderBy: { createdAt: 'desc' }, include: { authorRecruiter: { include: { user: true } } } },
        offer: { include: { createdByRecruiter: { include: { user: true } } } },
        tags: { include: { tag: true } }
      }
    });
  }

  static async findApplicationInCompany(companyId: string, applicationId: string) {
    return prisma.application.findFirst({
      where: { id: applicationId, job: { companyId } },
      include: { studentProfile: { include: { user: true } }, job: true, offer: true }
    });
  }

  static async updateApplicationStage(id: string, stageName: string, status: ApplicationStatus, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status }
      });

      await tx.applicationStage.create({
        data: {
          applicationId: id,
          stageName,
          status,
          notes
        }
      });

      return app;
    });
  }

  static async createNote(applicationId: string, authorRecruiterId: string, content: string) {
    return prisma.applicationNote.create({
      data: { applicationId, authorRecruiterId, content },
      include: { authorRecruiter: { include: { user: true } } }
    });
  }

  static async getNotes(applicationId: string) {
    return prisma.applicationNote.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      include: { authorRecruiter: { include: { user: true } } }
    });
  }

  static async createInterview(
    applicationId: string,
    scheduledByRecruiterId: string,
    data: { title: string; scheduledAt: Date; duration: number; locationUrl?: string }
  ) {
    return prisma.interview.create({
      data: {
        applicationId,
        scheduledByRecruiterId,
        title: data.title,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        locationUrl: data.locationUrl
      }
    });
  }

  static async findInterviewInCompany(companyId: string, interviewId: string) {
    return prisma.interview.findFirst({
      where: { id: interviewId, application: { job: { companyId } } },
      include: { application: true }
    });
  }

  static async updateInterview(
    interviewId: string,
    data: { scheduledAt?: Date; duration?: number; locationUrl?: string; status?: string; feedback?: string }
  ) {
    return prisma.interview.update({
      where: { id: interviewId },
      data: data as any
    });
  }

  static async findOfferInCompany(companyId: string, offerId: string) {
    return prisma.offer.findFirst({
      where: { id: offerId, application: { job: { companyId } } },
      include: { application: { include: { studentProfile: { include: { user: true } }, job: true } } }
    });
  }

  static async createOffer(
    applicationId: string,
    createdByRecruiterId: string,
    data: { title: string; salary: number; currency: string; startDate: Date; notes?: string }
  ) {
    return prisma.offer.create({
      data: {
        applicationId,
        createdByRecruiterId,
        title: data.title,
        salary: data.salary,
        currency: data.currency,
        startDate: data.startDate,
        notes: data.notes,
        status: 'EXTENDED',
        extendedAt: new Date()
      }
    });
  }

  static async withdrawOffer(offerId: string) {
    return prisma.offer.update({
      where: { id: offerId },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date() }
    });
  }

  static async filterOwnedApplicationIds(companyId: string, applicationIds: string[]) {
    const owned = await prisma.application.findMany({
      where: { id: { in: applicationIds }, job: { companyId } },
      select: {
        id: true,
        jobId: true,
        job: { select: { title: true } },
        studentProfile: { select: { user: { select: { id: true } } } }
      }
    });
    return owned;
  }

  static async bulkUpdateApplicationStage(applicationIds: string[], stageName: string, status: ApplicationStatus) {
    return prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: { status }
      });
      await tx.applicationStage.createMany({
        data: applicationIds.map(applicationId => ({ applicationId, stageName, status }))
      });
      return tx.application.findMany({ where: { id: { in: applicationIds } } });
    });
  }

  // ------------------------------------------------------------------
  // Tags
  // ------------------------------------------------------------------

  static async getTags(companyId: string) {
    return prisma.tag.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  static async findTagInCompany(companyId: string, tagId: string) {
    return prisma.tag.findFirst({ where: { id: tagId, companyId } });
  }

  static async createTag(companyId: string, name: string, color?: string) {
    return prisma.tag.create({ data: { companyId, name, color } });
  }

  static async deleteTag(tagId: string) {
    return prisma.$transaction(async tx => {
      await tx.applicationTag.deleteMany({ where: { tagId } });
      return tx.tag.delete({ where: { id: tagId } });
    });
  }

  static async attachTag(applicationId: string, tagId: string) {
    return prisma.applicationTag.upsert({
      where: { applicationId_tagId: { applicationId, tagId } },
      update: {},
      create: { applicationId, tagId },
      include: { tag: true }
    });
  }

  static async detachTag(applicationId: string, tagId: string) {
    return prisma.applicationTag.deleteMany({ where: { applicationId, tagId } });
  }

  static async bulkAttachTag(applicationIds: string[], tagId: string) {
    return prisma.applicationTag.createMany({
      data: applicationIds.map(applicationId => ({ applicationId, tagId })),
      skipDuplicates: true
    });
  }

  static async getApplicationTags(applicationId: string) {
    return prisma.applicationTag.findMany({ where: { applicationId }, include: { tag: true } });
  }

  // ------------------------------------------------------------------
  // Unified activity timeline
  // ------------------------------------------------------------------

  static async getApplicationTimelineSource(companyId: string, applicationId: string) {
    return prisma.application.findFirst({
      where: { id: applicationId, job: { companyId } },
      include: {
        stages: { orderBy: { createdAt: 'asc' } },
        notes: { orderBy: { createdAt: 'asc' }, include: { authorRecruiter: { include: { user: true } } } },
        interviews: { orderBy: { scheduledAt: 'asc' }, include: { scheduledByRecruiter: { include: { user: true } } } },
        offer: { include: { createdByRecruiter: { include: { user: true } } } }
      }
    });
  }

  // ------------------------------------------------------------------
  // Saved filters
  // ------------------------------------------------------------------

  static async getSavedFilters(recruiterId: string) {
    return prisma.savedFilter.findMany({ where: { recruiterId }, orderBy: { createdAt: 'desc' } });
  }

  static async createSavedFilter(recruiterId: string, name: string, filters: any) {
    return prisma.savedFilter.create({ data: { recruiterId, name, filters } });
  }

  static async findSavedFilter(recruiterId: string, id: string) {
    return prisma.savedFilter.findFirst({ where: { id, recruiterId } });
  }

  static async deleteSavedFilter(id: string) {
    return prisma.savedFilter.delete({ where: { id } });
  }

  /**
   * Company recruitment analytics. Every value is a real aggregate over the
   * company's own jobs/applications/interviews/offers -- no estimates, no
   * fabricated series.
   *
   * `opts.days` scopes the *application cohort* (applications received within
   * the window, by createdAt) and everything derived from it: totals, funnel,
   * conversion rates, per-job counts and recruiter activity. Job *state* facts
   * (status counts, "closing soon", days-open) are point-in-time and are not
   * windowed. When `days` is omitted the window is all-time (used by the
   * dashboard overview, which shares this endpoint).
   *
   * Honesty notes:
   *  - The pipeline "funnel" reports the *current* status distribution (the app
   *    stores an application's current status, not a full stage history), so it
   *    is a snapshot, not a cumulative reached-this-stage funnel.
   *  - Conversion RATES instead use persistent Interview/Offer *records* (which
   *    survive status changes), so "reached interview / offer" is cumulative and
   *    correct regardless of the application's current status.
   *  - A "hire" == an ACCEPTED offer (there is no HIRED application status).
   */
  static async getAnalytics(companyId: string, opts?: { days?: number }) {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: { applications: { include: { offer: true, interviews: true } } }
    });
    const recruiters = await prisma.recruiter.findMany({
      where: { companyId },
      select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } }
    });

    const DAY = 1000 * 60 * 60 * 24;
    const now = Date.now();
    const cutoff = opts?.days ? now - opts.days * DAY : null;
    const inWindow = (d: Date | string): boolean => cutoff === null || new Date(d).getTime() >= cutoff;

    // ── Job state (point-in-time, not windowed) ──────────────────────
    const byStatus = (s: string) => jobs.filter(j => j.status === s).length;
    const jobStatusCounts = {
      total: jobs.length,
      draft: byStatus('DRAFT'),
      published: byStatus('PUBLISHED'),
      paused: byStatus('PAUSED'),
      closed: byStatus('CLOSED'),
      archived: byStatus('ARCHIVED')
    };
    const jobsClosingSoon = jobs.filter(j =>
      j.status === 'PUBLISHED' && j.deadline &&
      new Date(j.deadline).getTime() >= now &&
      new Date(j.deadline).getTime() <= now + 7 * DAY
    ).length;

    // ── Windowed application cohort ──────────────────────────────────
    const allApps = jobs.flatMap(j => j.applications.map(a => ({ ...a, _job: j })));
    const apps = allApps.filter(a => inWindow(a.createdAt));
    const appCount = apps.length;
    const countStatus = (...statuses: string[]) => apps.filter(a => statuses.includes(a.status)).length;

    const statusBreakdown = apps.reduce((acc: Record<string, number>, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    // Offers / hires (cohort). "Sent" == extended to the candidate (not DRAFT).
    const offers = apps.map(a => a.offer).filter(Boolean) as any[];
    const sentOffers = offers.filter(o => o.status !== 'DRAFT');
    const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
    const respondedOffers = offers.filter(o => o.status === 'ACCEPTED' || o.status === 'DECLINED');
    const offerAcceptanceRate = respondedOffers.length > 0
      ? Math.round((acceptedOffers.length / respondedOffers.length) * 100) : null;
    const hires = acceptedOffers.length;

    // Interviews (cohort) -- a real record exists; exclude cancelled from counts.
    const liveInterview = (i: any) => i.status !== 'CANCELLED';
    const interviewsScheduled = apps.reduce((s, a) => s + a.interviews.filter(liveInterview).length, 0);
    const appsReachedInterview = apps.filter(a => a.interviews.some(liveInterview)).length;
    const appsReachedOffer = apps.filter(a => a.offer && a.offer.status !== 'DRAFT').length;

    // Time-to-hire: days from application received -> offer accepted. FIX for
    // the historical negative bug -- discard any nonsensical entry where the
    // seeded respondedAt predates createdAt (n < 0) so it can never corrupt the
    // average or surface a negative value.
    const hireTimes = acceptedOffers
      .map(o => {
        const app = apps.find(a => a.offer?.id === o.id);
        if (!app || !o.respondedAt) return null;
        return (new Date(o.respondedAt).getTime() - new Date(app.createdAt).getTime()) / DAY;
      })
      .filter((n): n is number => n !== null && n >= 0);
    const timeToHireDays = hireTimes.length > 0
      ? Math.round(hireTimes.reduce((s, n) => s + n, 0) / hireTimes.length) : null;
    const fastestHireDays = hireTimes.length > 0 ? Math.round(Math.min(...hireTimes)) : null;

    const rate = (num: number, den: number): number | null => (den > 0 ? Math.round((num / den) * 100) : null);
    const rejectedCount = countStatus('REJECTED');
    const withdrawnCount = countStatus('WITHDRAWN');

    // ── Per-job performance (windowed cohort) ────────────────────────
    const perJob = jobs.map(j => {
      const japps = j.applications.filter(a => inWindow(a.createdAt));
      const jOffers = japps.map(a => a.offer).filter(Boolean) as any[];
      const terminal = j.status === 'CLOSED' || j.status === 'ARCHIVED';
      const daysOpen = Math.max(0, Math.round(
        ((terminal ? new Date(j.updatedAt).getTime() : now) - new Date(j.createdAt).getTime()) / DAY
      ));
      return {
        jobId: j.id,
        jobTitle: j.title,
        status: j.status,
        totalApplications: japps.length,
        interviewCount: japps.reduce((s, a) => s + a.interviews.filter(liveInterview).length, 0),
        offerCount: jOffers.filter(o => o.status !== 'DRAFT').length,
        hireCount: jOffers.filter(o => o.status === 'ACCEPTED').length,
        daysOpen,
        statusBreakdown: japps.reduce((acc: Record<string, number>, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {})
      };
    });
    const jobsWithoutApplicants = jobs.filter(j =>
      j.status === 'PUBLISHED' && j.applications.filter(a => inWindow(a.createdAt)).length === 0
    ).length;
    const jobsWithApplicants = perJob.filter(j => j.totalApplications > 0).length;
    const jobsFilled = perJob.filter(j => j.hireCount > 0).length;

    // ── Recruiter performance (cohort activity, real attributions) ───
    const recruiterPerformance = recruiters.map(r => {
      const rJobs = jobs.filter(j => j.recruiterId === r.id).length;
      const rInterviews = apps.reduce(
        (s, a) => s + a.interviews.filter(i => liveInterview(i) && i.scheduledByRecruiterId === r.id).length, 0
      );
      const rOffers = offers.filter(o => o.createdByRecruiterId === r.id && o.status !== 'DRAFT');
      const rAccepted = rOffers.filter(o => o.status === 'ACCEPTED');
      const rHireTimes = rAccepted
        .map(o => {
          const app = apps.find(a => a.offer?.id === o.id);
          if (!app || !o.respondedAt) return null;
          return (new Date(o.respondedAt).getTime() - new Date(app.createdAt).getTime()) / DAY;
        })
        .filter((n): n is number => n !== null && n >= 0);
      return {
        recruiterId: r.id,
        name: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.user.email,
        jobsManaged: rJobs,
        interviewsConducted: rInterviews,
        offersMade: rOffers.length,
        hires: rAccepted.length,
        avgTimeToHireDays: rHireTimes.length > 0
          ? Math.round(rHireTimes.reduce((s, n) => s + n, 0) / rHireTimes.length) : null
      };
    }).filter(r => r.jobsManaged > 0 || r.interviewsConducted > 0 || r.offersMade > 0);

    return {
      // ── existing fields (backward-compatible with the dashboard overview) ──
      activeJobs: jobStatusCounts.published,
      totalApplications: appCount,
      timeToHireDays,
      offerAcceptanceRate,
      statusBreakdown,
      openVsClosed: {
        open: jobs.filter(j => j.status !== 'ARCHIVED').length,
        closed: jobs.filter(j => j.status === 'ARCHIVED').length
      },
      perJob,
      // ── Module 5 additions ──
      windowDays: opts?.days ?? null,
      jobStatusCounts,
      totals: {
        totalApplicants: appCount,
        newApplicants: countStatus('APPLIED'),
        interviewsScheduled,
        offersSent: sentOffers.length,
        offersAccepted: hires,
        rejected: rejectedCount,
        hires
      },
      funnel: {
        applied: countStatus('APPLIED'),
        reviewing: countStatus('REVIEWING', 'SCREENING'),
        shortlisted: countStatus('SHORTLISTED'),
        interview: countStatus('INTERVIEWING'),
        offer: countStatus('OFFERED'),
        hired: hires,
        rejected: rejectedCount,
        withdrawn: withdrawnCount
      },
      metrics: {
        timeToHireDays,
        fastestHireDays,
        hireSampleSize: hireTimes.length,
        applicationConversionRate: rate(appsReachedInterview, appCount),
        interviewConversionRate: rate(appsReachedOffer, appsReachedInterview),
        offerAcceptanceRate,
        hireRate: rate(hires, appCount),
        dropOffRate: rate(rejectedCount + withdrawnCount, appCount),
        // Textbook definition: total applicants over every job. Not scoped to
        // "live" jobs -- seeded/closed jobs still hold real historical applicants.
        avgApplicantsPerJob: jobs.length > 0 ? Math.round((appCount / jobs.length) * 10) / 10 : null,
        // Of the jobs that actually attracted candidates, how many resulted in a
        // hire. Avoids dividing by jobs that were never really openings.
        fillRate: jobsWithApplicants > 0 ? Math.round((jobsFilled / jobsWithApplicants) * 100) : null,
        jobsWithoutApplicants,
        jobsClosingSoon
      },
      recruiterPerformance
    };
  }

  // ------------------------------------------------------------------
  // Employer AI (Phase 4): candidate evaluation & comparison
  // ------------------------------------------------------------------

  /**
   * Everything EmployerAgent needs to evaluate one candidate against one
   * job: the job's own text fields, the candidate's skills, latest active
   * resume's AI analysis, and recent mock interview reports. Mirrors
   * CareerRepository.getCareerContext's shape -- a bespoke `select`/`include`
   * query, not a reuse of getApplicationDetail (which is shaped for the
   * candidate-detail UI and doesn't pull resumeAnalyses or mockInterviews).
   * Scoped by `job: { companyId }` like every other employer query so a
   * recruiter can never evaluate another company's candidate.
   */
  static async getCandidateEvaluationContext(companyId: string, applicationId: string) {
    return prisma.application.findFirst({
      where: { id: applicationId, job: { companyId } },
      select: {
        id: true,
        job: {
          select: { id: true, title: true, description: true, requirements: true }
        },
        studentProfile: {
          select: {
            skills: { include: { skill: true } },
            resumes: {
              where: { isActive: true },
              take: 1,
              include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
            },
            mockInterviews: {
              // Only sessions the candidate explicitly shared with employers
              // may inform employer-facing evaluations.
              where: { sharedWithEmployers: true, status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } }
            }
          }
        }
      }
    });
  }

  /**
   * Same context as above, but for every application on one job at once --
   * used by candidate comparison. Scoped the same way; only applications
   * that actually belong to the given job/company are returned.
   */
  static async getComparisonContext(companyId: string, jobId: string, applicationIds: string[]) {
    return prisma.application.findMany({
      where: { id: { in: applicationIds }, jobId, job: { companyId } },
      select: {
        id: true,
        job: {
          select: { id: true, title: true, description: true, requirements: true }
        },
        studentProfile: {
          select: {
            firstName: true,
            lastName: true,
            skills: { include: { skill: true } },
            resumes: {
              where: { isActive: true },
              take: 1,
              include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
            },
            mockInterviews: {
              // Only sessions the candidate explicitly shared with employers
              // may inform employer-facing evaluations.
              where: { sharedWithEmployers: true, status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } }
            }
          }
        }
      }
    });
  }

  static async createCandidateEvaluation(
    applicationId: string,
    data: {
      fitScore: number;
      recommendation: string;
      summary: string;
      strengths: string[];
      concerns: string[];
      skillsMatch: string[];
      skillsGap: string[];
      interviewSignal: string | null;
      modelVersion: string;
    }
  ) {
    return prisma.candidateEvaluation.create({
      data: { applicationId, ...data }
    });
  }

  static async getLatestCandidateEvaluation(companyId: string, applicationId: string) {
    return prisma.candidateEvaluation.findFirst({
      where: { applicationId, application: { job: { companyId } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
