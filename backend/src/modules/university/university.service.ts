import { UniversityRepository } from './university.repository';
import { CampusDriveService } from './campus-drive.service';
import { UniversityAIEngineClient } from './university-ai-engine.client';
import { AppError } from '../../utils/app-error';
import { prisma } from '../../config/database';
import { eventBus } from '../shared/event-bus';
import { VerificationStatus } from '@prisma/client';

const UNIVERSITY_AI_MODEL_VERSION = 'student-placement-v1';

/** Builds a resume-analysis summary string, or undefined if there's none yet -- same convention as Employer AI. */
function summarizeResume(resumes: { resumeAnalyses?: { score: number; summary: string }[] }[] | undefined): string | undefined {
  const analysis = resumes?.[0]?.resumeAnalyses?.[0];
  if (!analysis) return undefined;
  return `ATS score: ${analysis.score}/100. ${analysis.summary}`;
}

/** Builds a mock-interview-history summary string, or undefined if there's none yet -- same convention as Employer AI. */
function summarizeInterviews(
  mockInterviews:
    | { jobTitle: string; reports?: { score: number; technicalScore?: number | null; hrScore?: number | null; communicationScore?: number | null; aiSummary?: string | null; summary: string }[] }[]
    | undefined
): string | undefined {
  if (!mockInterviews?.length) return undefined;
  return mockInterviews
    .map(mi => {
      const report = mi.reports?.[0];
      return report
        ? `${mi.jobTitle}: overall score ${report.score}/100 (technical ${report.technicalScore ?? 'N/A'}, HR ${report.hrScore ?? 'N/A'}, communication ${report.communicationScore ?? 'N/A'}). ${report.aiSummary ?? report.summary}`
        : `${mi.jobTitle}: interview in progress, no report yet.`;
    })
    .join('\n');
}

export class UniversityService {
  static async getDashboard(universityId: string) {
    return UniversityRepository.getDashboard(universityId);
  }

  static async getStudents(universityId: string) {
    return UniversityRepository.getStudents(universityId);
  }

  static async getInternships(universityId: string) {
    return UniversityRepository.getInternships(universityId);
  }

  static async verifyStudent(userId: string, universityId: string, studentProfileId: string, status: VerificationStatus) {
    const student = await UniversityRepository.findStudentInUniversity(universityId, studentProfileId);
    if (!student) {
      throw new AppError('Student not found in this university.', 404, 'STUDENT_NOT_FOUND');
    }

    const result = await UniversityRepository.updateStudentStatus(studentProfileId, status);

    await prisma.auditLog.create({
      data: { userId, action: 'STUDENT_VERIFICATION_UPDATED', details: JSON.stringify({ studentProfileId, status }) }
    });

    eventBus.emit('StudentVerified', { id: studentProfileId, universityId, status });
    if (status === 'PLACEMENT_ELIGIBLE') {
      eventBus.emit('PlacementEligibilityUpdated', { id: studentProfileId, universityId, eligible: true });
    }
    if (status === 'PLACEMENT_COMPLETED') {
      eventBus.emit('PlacementCompleted', { id: studentProfileId, universityId });
    }

    return result;
  }

  static async getAnalytics(universityId: string) {
    return UniversityRepository.getAnalytics(universityId);
  }

  // ------------------------------------------------------------------
  // University AI (Phase 5): placement prediction, department insight,
  // campus drive recommendations, and executive placement reports.
  //
  // Replaces the previous getAIPlacementInsights placeholder, which called
  // the generic AIOrchestrator with the student-side 'career-insight-v1'
  // prompt version -- the wrong prompt for a university-facing feature.
  // Talks directly to the shared GeminiClient via UniversityAIEngineClient.
  // ------------------------------------------------------------------

  static async assessStudentPlacement(userId: string, universityId: string, studentProfileId: string) {
    const context = await UniversityRepository.getPlacementPredictionContext(universityId, studentProfileId);
    if (!context) {
      throw new AppError('Student not found in this university.', 404, 'STUDENT_NOT_FOUND');
    }

    const currentSkills = (context.skills ?? []).map((s: any) => s.skill.name);
    const resumeSummary = summarizeResume(context.resumes as any);
    const interviewHistorySummary = summarizeInterviews(context.mockInterviews as any);

    const result = await UniversityAIEngineClient.predictStudentPlacement(
      context.firstName,
      context.department?.name,
      context.graduationYear,
      context.currentGpa,
      currentSkills,
      resumeSummary,
      interviewHistorySummary
    );

    const insight = await UniversityRepository.createStudentPlacementInsight(studentProfileId, {
      placementProbability: result.placementProbability,
      riskLevel: result.riskLevel,
      summary: result.summary,
      riskFactors: result.riskFactors,
      strengths: result.strengths,
      suggestedActions: result.suggestedActions,
      modelVersion: result.estimated ? `${UNIVERSITY_AI_MODEL_VERSION}-estimated` : UNIVERSITY_AI_MODEL_VERSION
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'STUDENT_PLACEMENT_INSIGHT_GENERATED',
        details: JSON.stringify({ studentProfileId, placementProbability: result.placementProbability, riskLevel: result.riskLevel })
      }
    });

    return insight;
  }

  static async getLatestStudentInsight(universityId: string, studentProfileId: string) {
    const student = await UniversityRepository.findStudentInUniversity(universityId, studentProfileId);
    if (!student) {
      throw new AppError('Student not found in this university.', 404, 'STUDENT_NOT_FOUND');
    }
    return UniversityRepository.getLatestStudentPlacementInsight(universityId, studentProfileId);
  }

  static async generateDepartmentInsight(userId: string, universityId: string) {
    const analytics = await UniversityRepository.getAnalytics(universityId);

    const analyticsSummary = [
      `University-wide placement rate: ${analytics.placementPercentage}% (${analytics.studentsPlaced}/${analytics.totalStudents} students placed).`,
      analytics.averageSalary != null ? `Average accepted offer salary: ${analytics.averageSalary}.` : 'No accepted offers yet -- no salary data.',
      analytics.highestPackage != null ? `Highest accepted offer: ${analytics.highestPackage}.` : '',
      `Hiring trends by year: ${analytics.hiringTrends.map((t: any) => `${t.year}: ${t.placements}`).join(', ') || 'No historical data yet.'}`,
      'Department breakdown:',
      ...analytics.departmentBreakdown.map(
        (d: any) => `- ${d.departmentName}: ${d.placed}/${d.total} placed (${d.placementPercentage}%)`
      )
    ]
      .filter(Boolean)
      .join('\n');

    const result = await UniversityAIEngineClient.generateDepartmentInsight(analyticsSummary);

    await prisma.auditLog.create({
      data: { userId, action: 'DEPARTMENT_INSIGHT_GENERATED', details: JSON.stringify({ universityId }) }
    });

    return result;
  }

  static async recommendCampusDrives(userId: string, universityId: string) {
    const context = await UniversityRepository.getDriveRecommendationContext(universityId);

    const contextSummary = [
      `Top student skills (by frequency): ${context.topSkills.map((s: any) => `${s.name} (${s.count})`).join(', ') || 'No skills recorded yet.'}`,
      `Hiring trends by year: ${context.analytics.hiringTrends.map((t: any) => `${t.year}: ${t.placements}`).join(', ') || 'No historical data yet.'}`,
      `Department breakdown: ${context.analytics.departmentBreakdown.map((d: any) => `${d.departmentName} (${d.placementPercentage}% placed)`).join(', ') || 'No department data yet.'}`,
      `Past campus drives already run: ${context.pastDrives.map((d: any) => d.title).join(', ') || 'None yet.'}`
    ].join('\n');

    const result = await UniversityAIEngineClient.recommendDrives(contextSummary);

    await prisma.auditLog.create({
      data: { userId, action: 'CAMPUS_DRIVE_RECOMMENDATIONS_GENERATED', details: JSON.stringify({ universityId }) }
    });

    return result;
  }

  static async generatePlacementReport(userId: string, universityId: string) {
    const analytics = await UniversityRepository.getAnalytics(universityId);

    const analyticsSummary = [
      `University-wide placement rate: ${analytics.placementPercentage}% (${analytics.studentsPlaced}/${analytics.totalStudents} students placed).`,
      analytics.averageSalary != null ? `Average accepted offer salary: ${analytics.averageSalary}.` : 'No accepted offers yet -- no salary data.',
      analytics.highestPackage != null ? `Highest accepted offer: ${analytics.highestPackage}.` : '',
      `Hiring trends by year: ${analytics.hiringTrends.map((t: any) => `${t.year}: ${t.placements}`).join(', ') || 'No historical data yet.'}`,
      'Department breakdown:',
      ...analytics.departmentBreakdown.map(
        (d: any) => `- ${d.departmentName}: ${d.placed}/${d.total} placed (${d.placementPercentage}%)`
      )
    ]
      .filter(Boolean)
      .join('\n');

    const result = await UniversityAIEngineClient.generatePlacementReport(analyticsSummary);

    await prisma.auditLog.create({
      data: { userId, action: 'PLACEMENT_REPORT_GENERATED', details: JSON.stringify({ universityId }) }
    });

    return result;
  }

  static async getDrives(universityId: string) {
    return CampusDriveService.getDrives(universityId);
  }

  static async createDrive(userId: string, universityId: string, data: { title: string; description: string; location: string; scheduledAt: string; deadline: string }) {
    const drive = await CampusDriveService.createDrive(universityId, {
      title: data.title,
      description: data.description,
      location: data.location,
      scheduledAt: new Date(data.scheduledAt),
      deadline: new Date(data.deadline)
    });
    await prisma.auditLog.create({
      data: { userId, action: 'PLACEMENT_DRIVE_CREATED', details: JSON.stringify({ driveId: drive.id }) }
    });
    return drive;
  }

  static async updateDrive(userId: string, universityId: string, id: string, data: Partial<{ title: string; description: string; location: string; scheduledAt: string; deadline: string }>) {
    const drive = await CampusDriveService.updateDrive(universityId, id, {
      title: data.title,
      description: data.description,
      location: data.location,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined
    });
    await prisma.auditLog.create({
      data: { userId, action: 'PLACEMENT_DRIVE_UPDATED', details: JSON.stringify({ driveId: id, changes: data }) }
    });
    return drive;
  }

  static async deleteDrive(userId: string, universityId: string, id: string) {
    const result = await CampusDriveService.deleteDrive(universityId, id);
    await prisma.auditLog.create({
      data: { userId, action: 'PLACEMENT_DRIVE_DELETED', details: JSON.stringify({ driveId: id }) }
    });
    return result;
  }

  static async getPartnerCompanies(universityId: string) {
    return UniversityRepository.getPartnerCompanies(universityId);
  }

  static async getSettings(universityId: string) {
    const settings = await UniversityRepository.getSettings(universityId);
    if (!settings) {
      throw new AppError('University profile not found.', 404, 'UNIVERSITY_NOT_FOUND');
    }
    return settings;
  }

  static async updateSettings(userId: string, universityId: string, data: {
    name?: string; logoUrl?: string; location?: string;
    directorName?: string; contactEmail?: string; phone?: string;
  }) {
    const updated = await UniversityRepository.updateSettings(universityId, data);
    await prisma.auditLog.create({
      data: { userId, action: 'UNIVERSITY_SETTINGS_UPDATED', details: JSON.stringify({ changes: data }) }
    });
    return updated;
  }

  static async sendBroadcast(userId: string, universityId: string, recipientUserIds: string[], title: string, content: string) {
    const validRecipients = await prisma.studentProfile.findMany({
      where: { universityId, userId: { in: recipientUserIds } },
      select: { userId: true }
    });
    const validUserIds = validRecipients.map((r: { userId: string }) => r.userId);

    if (validUserIds.length === 0) {
      throw new AppError('None of the selected recipients belong to this university.', 400, 'INVALID_RECIPIENTS');
    }

    const result = await UniversityRepository.sendBroadcast(userId, validUserIds, title, content);

    await prisma.auditLog.create({
      data: { userId, action: 'UNIVERSITY_BROADCAST_SENT', details: JSON.stringify({ title, recipientCount: validUserIds.length }) }
    });

    return { ...result, recipientCount: validUserIds.length, skipped: recipientUserIds.length - validUserIds.length };
  }

  static async getSentBroadcasts(userId: string) {
    return UniversityRepository.getSentBroadcasts(userId);
  }

  static async submitSupportRequest(userId: string, subject: string, message: string) {
    const requester = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });

    await prisma.supportTicket.create({
      data: {
        subject,
        message,
        requesterId: userId,
        requesterEmail: requester?.email ?? 'unknown',
        requesterRole: requester?.role ?? 'UNIVERSITY'
      }
    });

    await prisma.auditLog.create({
      data: { userId, action: 'SUPPORT_REQUEST_SUBMITTED', details: JSON.stringify({ subject, message }) }
    });

    // Every admin should see a new support request, not just whichever one
    // happens to be returned first -- a single-admin notification meant an
    // on-call admin who wasn't "the first admin in the table" would never
    // find out a ticket existed except by manually checking the Tickets screen.
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          senderId: userId,
          recipientId: admin.id,
          type: 'SYSTEM' as const,
          priority: 'HIGH' as const,
          title: `Support request: ${subject}`,
          content: message
        }))
      });
    }

    return { submitted: true };
  }
}
