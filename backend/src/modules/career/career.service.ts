import { CareerRepository } from './career.repository';
import { CareerEngineClient } from './career-engine.client';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';
import { prisma } from '../../config/database';
import type { Prisma } from '@prisma/client';

export class CareerService {
  static async getCareerInsights(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return CareerRepository.getCareerInsights(profile.id);
  }

  static async getMockInterviewReports(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return CareerRepository.getMockInterviewReports(profile.id);
  }

  /**
   * Career Intelligence (Phase 3): synthesizes a fresh readiness report for
   * `targetRole` from the student's current skills plus whatever Resume
   * Intelligence and Mock Interview AI have already produced for them. This
   * is the seam that turns those two standalone features into one
   * continuous "AI companion" signal, per the brief.
   */
  static async generateCareerInsight(userId: string, targetRole: string) {
    if (!targetRole || !targetRole.trim()) {
      throw new AppError('A target role is required to generate career insights.', 400, 'VALIDATION_ERROR');
    }

    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const context = await CareerRepository.getCareerContext(profile.id);

    const currentSkills = (context?.skills ?? []).map(s => s.skill.name);

    const activeResume = context?.resumes?.[0];
    const latestAnalysis = activeResume?.resumeAnalyses?.[0];
    const resumeSummary = latestAnalysis
      ? `ATS score: ${latestAnalysis.score}/100. ${latestAnalysis.summary}`
      : activeResume
        ? 'A resume is on file but has not yet been AI-analyzed.'
        : undefined;

    const interviewHistorySummary = context?.mockInterviews?.length
      ? context.mockInterviews
          .map(mi => {
            const report = mi.reports?.[0] as
              | (typeof mi.reports[number] & {
                  technicalScore?: number | null;
                  hrScore?: number | null;
                  communicationScore?: number | null;
                  aiSummary?: string | null;
                })
              | undefined;
            return report
              ? `${mi.jobTitle}: overall score ${report.score}/100 (technical ${report.technicalScore ?? 'N/A'}, HR ${report.hrScore ?? 'N/A'}, communication ${report.communicationScore ?? 'N/A'}). ${report.aiSummary ?? report.summary}`
              : `${mi.jobTitle}: interview in progress, no report yet.`;
          })
          .join('\n')
      : undefined;

    // Ground the (offline) fallback in real platform demand for this role.
    const roleReferenceSkills = await CareerRepository.getRoleReferenceSkills(targetRole);

    const result = await CareerEngineClient.generateInsight(targetRole, currentSkills, resumeSummary, interviewHistorySummary, roleReferenceSkills);

    const insight = await CareerRepository.createCareerInsight(profile.id, {
      summary: result.summary,
      score: result.readinessPercent,
      status: 'PARSED',
      // Label estimated (offline-fallback) results so the UI never presents a
      // heuristic as a live Gemini result.
      modelVersion: result.estimated ? 'career-insight-v1-estimated' : 'career-insight-v1',
      targetRole,
      readinessPercent: result.readinessPercent,
      whyThisScore: result.whyThisScore,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      recommendedProjects: result.recommendedProjects,
      recommendedCourses: result.recommendedCourses,
      recommendedInterviewTopics: result.recommendedInterviewTopics,
      roadmap: result.roadmap as unknown as Prisma.InputJsonValue
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CAREER_INSIGHT_GENERATED',
        details: JSON.stringify({ careerInsightId: insight.id, targetRole, readinessPercent: result.readinessPercent })
      }
    });

    return insight;
  }
}
