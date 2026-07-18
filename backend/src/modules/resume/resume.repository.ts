import { prisma } from '../../config/database';
import { ResumeStatus } from '@prisma/client';

export class ResumeRepository {
  /** Full version history for a student, newest first. */
  static async getResumeHistory(studentProfileId: string) {
    return prisma.resume.findMany({
      where: { studentProfileId },
      orderBy: { version: 'desc' },
      include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  }

  static async getActiveResume(studentProfileId: string) {
    return prisma.resume.findFirst({
      where: { studentProfileId, isActive: true },
      include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  }

  static async getResumeById(id: string) {
    return prisma.resume.findUnique({
      where: { id },
      include: { resumeAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  }

  static async getResumeByShareToken(token: string) {
    return prisma.resume.findUnique({ where: { shareToken: token } });
  }

  static async getHighestVersion(studentProfileId: string): Promise<number> {
    const latest = await prisma.resume.findFirst({
      where: { studentProfileId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });
    return latest?.version ?? 0;
  }

  /**
   * Every upload is a new version, not an overwrite. The previous active
   * version is deactivated (kept, not deleted) in the same transaction that
   * creates the new one, so there is never a moment with zero or two active
   * resumes for a student.
   */
  static async createResumeVersion(
    studentProfileId: string,
    metadata: {
      fileName: string;
      fileUrl: string;
      version: number;
      fileSizeBytes?: number;
      mimeType?: string;
      extractedSkills?: string[];
      parsedText?: string;
      status?: ResumeStatus;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { studentProfileId, isActive: true },
        data: { isActive: false }
      });

      return tx.resume.create({
        data: {
          studentProfileId,
          fileName: metadata.fileName,
          fileUrl: metadata.fileUrl,
          // Defaults to PARSED to preserve prior behavior for callers that
          // don't pass a real extraction status; the upload flow now always
          // passes the actual outcome (PARSED or FAILED) from
          // ResumeTextExtractionService.
          status: metadata.status ?? ResumeStatus.PARSED,
          version: metadata.version,
          isActive: true,
          fileSizeBytes: metadata.fileSizeBytes,
          mimeType: metadata.mimeType,
          extractedSkills: metadata.extractedSkills ?? [],
          parsedText: metadata.parsedText
        }
      });
    });
  }

  static async deleteResume(id: string) {
    return prisma.resume.delete({ where: { id } });
  }

  /** Promote the newest remaining version to active after a delete. */
  static async promoteMostRecentToActive(studentProfileId: string) {
    const candidate = await prisma.resume.findFirst({
      where: { studentProfileId },
      orderBy: { version: 'desc' }
    });
    if (candidate) {
      await prisma.resume.update({ where: { id: candidate.id }, data: { isActive: true } });
    }
    return candidate;
  }

  static async setShareSettings(id: string, data: { shareToken: string | null; shareEnabled: boolean; shareExpiresAt: Date | null }) {
    return prisma.resume.update({ where: { id }, data });
  }

  /**
   * Is this resume's owner someone who has applied to a job at `companyId`?
   * This is the authorization check recruiter-facing resume access depends
   * on -- without it, any employer could view/download any candidate's
   * resume by guessing an id.
   */
  static async isResumeOwnerApplicantOfCompany(studentProfileId: string, companyId: string): Promise<boolean> {
    const application = await prisma.application.findFirst({
      where: {
        studentProfileId,
        job: { companyId }
      },
      select: { id: true }
    });
    return !!application;
  }
}
