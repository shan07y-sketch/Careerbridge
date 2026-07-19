import { prisma } from '../../config/database';

export class CoverLetterRepository {
  static async list(studentProfileId: string) {
    return prisma.coverLetter.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' },
      include: { job: { select: { id: true, title: true, company: { select: { name: true } } } } }
    });
  }

  static async findById(id: string, studentProfileId: string) {
    // studentProfileId is part of the WHERE (not checked after fetch) so a
    // student can never read another student's draft by guessing an id.
    return prisma.coverLetter.findFirst({
      where: { id, studentProfileId },
      include: { job: { select: { id: true, title: true, company: { select: { name: true } } } } }
    });
  }

  static async create(
    studentProfileId: string,
    data: {
      jobId?: string | null;
      targetRole: string;
      companyName: string;
      tone: string;
      content: string;
      modelVersion: string;
    }
  ) {
    return prisma.coverLetter.create({ data: { studentProfileId, ...data } });
  }

  static async delete(id: string, studentProfileId: string) {
    const result = await prisma.coverLetter.deleteMany({ where: { id, studentProfileId } });
    return result.count > 0;
  }

  /**
   * Profile context for letter generation: current skills, the active
   * resume's latest AI analysis, and recent experience. Shaped for this
   * feature specifically - CareerRepository.getCareerContext pulls mock
   * interviews we don't need and omits experience/name, which we do.
   */
  static async getGenerationContext(studentProfileId: string) {
    return prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: {
        firstName: true,
        lastName: true,
        preferredRole: true,
        skills: { include: { skill: true } },
        resumes: {
          where: { isActive: true },
          take: 1,
          include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
        },
        experienceHistory: {
          orderBy: { startDate: 'desc' },
          take: 3,
          select: { companyName: true, roleTitle: true, description: true, isCurrent: true }
        }
      }
    });
  }

  /** Published job + company, used when a letter targets a real posting. */
  static async getJobContext(jobId: string) {
    return prisma.job.findFirst({
      where: { id: jobId, isDeleted: false },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        company: { select: { name: true } }
      }
    });
  }
}
