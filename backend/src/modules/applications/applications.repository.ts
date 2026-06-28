import { prisma } from '../../config/database';
import { ApplicationStatus } from '@prisma/client';

export class ApplicationsRepository {
  static async getApplications(studentProfileId: string) {
    return prisma.application.findMany({
      where: { studentProfileId },
      include: {
        job: {
          include: {
            company: true
          }
        },
        stages: true,
        interviews: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getApplicationById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
            recruiter: { include: { user: true } }
          }
        },
        stages: true,
        interviews: true
      }
    });
  }

  static async hasApplied(studentProfileId: string, jobId: string) {
    const app = await prisma.application.findUnique({
      where: {
        studentProfileId_jobId: { studentProfileId, jobId }
      }
    });
    return !!app;
  }

  static async applyToJob(studentProfileId: string, jobId: string, coverLetter?: string) {
    return prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          studentProfileId,
          jobId,
          status: ApplicationStatus.APPLIED,
          coverLetter
        }
      });

      await tx.applicationStage.create({
        data: {
          applicationId: app.id,
          stageName: 'Resume Submitted',
          status: ApplicationStatus.APPLIED,
          notes: 'Application created and profile details logged.'
        }
      });

      return app;
    });
  }

  static async deleteApplication(id: string) {
    return prisma.application.delete({
      where: { id }
    });
  }
}
