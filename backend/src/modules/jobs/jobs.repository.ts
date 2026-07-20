import { prisma } from '../../config/database';
import { JobStatus } from '@prisma/client';
import { PaginationParams } from '../../utils/pagination';

/**
 * `Job.status` is the source of truth for visibility — the employer portal
 * writes it, and `isPublished` is only a derived legacy flag (see
 * `EmployerRepository.deriveLegacyFlags`). This feed used to filter on the
 * legacy flag, so any job whose two fields disagreed leaked into the student
 * portal while its employer still saw it as an unpublished draft.
 */
const LISTABLE_STATUSES: JobStatus[] = ['PUBLISHED'];

/**
 * Detail view is deliberately wider than the list: a student who already
 * applied must still be able to open a posting that has since been paused or
 * closed. Drafts and archived jobs stay hidden.
 */
const VIEWABLE_STATUSES: JobStatus[] = ['PUBLISHED', 'PAUSED', 'CLOSED'];

export class JobsRepository {
  static async getJobs(params: PaginationParams, filterQuery: any) {
    const whereClause: any = {
      isDeleted: false,
      status: { in: LISTABLE_STATUSES },
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
    return prisma.job.findFirst({
      where: { id, isDeleted: false, status: { in: VIEWABLE_STATUSES } },
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
