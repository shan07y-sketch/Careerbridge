import { prisma } from '../../config/database';
import { ApplicationStatus, JobType, WorkMode } from '@prisma/client';

export class EmployerRepository {
  /**
   * Safe mapping for job lifecycles utilizing existing schema columns
   */
  private static parseJobState(job: any) {
    if (job.isDeleted) return 'Archived';
    if (job.currency?.startsWith('PAUSED:')) return 'Paused';
    if (job.currency?.startsWith('CLOSED:')) return 'Closed';
    if (job.isPublished) return 'Published';
    return 'Draft';
  }

  private static mapStateToPrisma(state: string, currency = 'USD'): { isPublished: boolean; isDeleted: boolean; currency: string } {
    if (state === 'Archived') {
      return { isPublished: false, isDeleted: true, currency };
    }
    if (state === 'Paused') {
      return { isPublished: true, isDeleted: false, currency: `PAUSED:${currency}` };
    }
    if (state === 'Closed') {
      return { isPublished: true, isDeleted: false, currency: `CLOSED:${currency}` };
    }
    if (state === 'Published') {
      return { isPublished: true, isDeleted: false, currency };
    }
    return { isPublished: false, isDeleted: false, currency }; // Draft
  }

  static async getDashboard(companyId: string) {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: { applications: true }
    });

    const recruiterCount = await prisma.recruiter.count({
      where: { companyId }
    });

    const parsedJobs = jobs.map(j => ({ ...j, state: this.parseJobState(j) }));

    const activeJobs = parsedJobs.filter(j => j.state === 'Published');
    const totalApplications = jobs.reduce((sum, j) => sum + j.applications.length, 0);

    return {
      activeJobsCount: activeJobs.length,
      totalApplications,
      recruiterCount,
      jobsList: parsedJobs.slice(0, 5)
    };
  }

  static async getCompanyProfile(companyId: string) {
    return prisma.company.findUnique({
      where: { id: companyId }
    });
  }

  static async updateCompanyProfile(companyId: string, data: any) {
    return prisma.company.update({
      where: { id: companyId },
      data: {
        logoUrl: data.logoUrl,
        website: data.website,
        industry: data.industry,
        description: data.description,
        size: data.size,
        headquarters: data.headquarters
      }
    });
  }

  static async getRecruiters(companyId: string) {
    return prisma.recruiter.findMany({
      where: { companyId },
      include: { user: true }
    });
  }

  static async createJob(companyId: string, recruiterId: string, categoryId: string, data: any) {
    const states = this.mapStateToPrisma(data.state || 'Published', data.currency || 'USD');
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
        isPublished: states.isPublished,
        isDeleted: states.isDeleted,
        currency: states.currency
      }
    });
  }

  static async updateJob(companyId: string, jobId: string, data: any) {
    const states = this.mapStateToPrisma(data.state || 'Published', data.currency || 'USD');
    return prisma.job.update({
      where: { id: jobId, companyId },
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        location: data.location,
        isPublished: states.isPublished,
        isDeleted: states.isDeleted,
        currency: states.currency
      }
    });
  }

  static async getJobs(companyId: string) {
    const list = await prisma.job.findMany({
      where: { companyId }
    });
    return list.map(j => ({ ...j, state: this.parseJobState(j) }));
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

  static async getAnalytics(companyId: string) {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: { applications: true }
    });

    const appCount = jobs.reduce((sum, j) => sum + j.applications.length, 0);

    return {
      activeJobs: jobs.filter(j => !j.isDeleted && j.isPublished).length,
      totalApplications: appCount,
      timeToHireDays: 14,
      offerAcceptanceRate: 85,
      openVsClosed: {
        open: jobs.filter(j => !j.isDeleted).length,
        closed: jobs.filter(j => j.isDeleted).length
      }
    };
  }
}
