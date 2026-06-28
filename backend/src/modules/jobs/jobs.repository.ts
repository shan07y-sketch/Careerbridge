import { prisma } from '../../config/database';
import { PaginationParams } from '../../utils/pagination';

export class JobsRepository {
  static async getJobs(params: PaginationParams, filterQuery: any) {
    const whereClause: any = {
      isDeleted: false,
      isPublished: true,
      ...filterQuery
    };

    if (params.search) {
      whereClause.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { company: { name: { contains: params.search, mode: 'insensitive' } } }
      ];
    }

    const totalRecords = await prisma.job.count({ where: whereClause });
    const records = await prisma.job.findMany({
      where: whereClause,
      include: {
        company: true,
        skillsRequired: { include: { skill: true } }
      },
      orderBy: { [params.sortBy]: params.order },
      skip: params.skip,
      take: params.limit
    });

    return { records, totalRecords };
  }

  static async getJobById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        skillsRequired: { include: { skill: true } }
      }
    });
  }

  static async isJobSaved(studentProfileId: string, jobId: string) {
    const saved = await prisma.savedJob.findUnique({
      where: {
        studentProfileId_jobId: { studentProfileId, jobId }
      }
    });
    return !!saved;
  }

  static async getSavedJobs(studentProfileId: string) {
    return prisma.savedJob.findMany({
      where: { studentProfileId },
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    });
  }

  static async saveJob(studentProfileId: string, jobId: string) {
    return prisma.savedJob.create({
      data: { studentProfileId, jobId }
    });
  }

  static async unsaveJob(studentProfileId: string, jobId: string) {
    return prisma.savedJob.delete({
      where: {
        studentProfileId_jobId: { studentProfileId, jobId }
      }
    });
  }
}
