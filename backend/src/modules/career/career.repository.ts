import { prisma } from '../../config/database';

export class CareerRepository {
  static async getCareerInsights(studentProfileId: string) {
    return prisma.careerInsight.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getMockInterviewReports(studentProfileId: string) {
    return prisma.mockInterviewReport.findMany({
      where: {
        mockInterview: { studentProfileId }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
