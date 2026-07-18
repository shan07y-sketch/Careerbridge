import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

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

  /**
   * Everything CareerAgent needs to synthesize a readiness report: current
   * skills, the most recent resume's AI analysis, and the last few mock
   * interview reports. Deliberately a bespoke query (not a reuse of
   * ProfileRepository.getStudentProfile) -- that one is shaped for the
   * profile-editing UI and doesn't include resumes/interviews at all.
   */
  static async getCareerContext(studentProfileId: string) {
    return prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: {
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

  /**
   * Real, data-derived reference skills for a target role: the most-required
   * skills across published jobs whose title matches the role. Grounds the
   * offline career fallback in actual platform demand instead of a hardcoded
   * list. Returns [] when no matching jobs exist (caller then falls back).
   */
  static async getRoleReferenceSkills(targetRole: string, limit = 12): Promise<string[]> {
    const jobs = await prisma.job.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        title: { contains: targetRole, mode: 'insensitive' }
      },
      select: { skillsRequired: { select: { skill: { select: { name: true } } } } },
      take: 200
    });
    const freq = new Map<string, number>();
    for (const j of jobs) {
      for (const s of j.skillsRequired) {
        const name = s.skill?.name;
        if (name) freq.set(name, (freq.get(name) || 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }

  static async createCareerInsight(
    studentProfileId: string,
    data: {
      summary: string;
      score: number;
      status: string;
      modelVersion: string;
      targetRole: string;
      readinessPercent: number;
      whyThisScore: string;
      matchedSkills: string[];
      missingSkills: string[];
      recommendedProjects: string[];
      recommendedCourses: string[];
      recommendedInterviewTopics: string[];
      roadmap: Prisma.InputJsonValue;
    }
  ) {
    return prisma.careerInsight.create({
      data: { studentProfileId, ...data }
    });
  }
}
