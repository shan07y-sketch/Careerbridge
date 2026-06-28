import { prisma } from '../../config/database';
import { ResumeStatus } from '@prisma/client';

export class ResumeRepository {
  static async getResumes(studentProfileId: string) {
    return prisma.resume.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getResumeById(id: string) {
    return prisma.resume.findUnique({
      where: { id }
    });
  }

  static async createResume(studentProfileId: string, metadata: { fileName: string; fileUrl: string }) {
    return prisma.resume.create({
      data: {
        studentProfileId,
        fileName: metadata.fileName,
        fileUrl: metadata.fileUrl,
        status: ResumeStatus.PARSED
      }
    });
  }

  static async deleteResume(id: string) {
    return prisma.resume.delete({
      where: { id }
    });
  }
}
