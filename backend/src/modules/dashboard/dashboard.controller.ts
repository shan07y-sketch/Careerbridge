import { Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { ProfileService } from '../profile/profile.service';
import { ApplicationsService } from '../applications/applications.service';
import { JobsService } from '../jobs/jobs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CareerService } from '../career/career.service';
import { InterviewService } from '../interview/interview.service';

export class DashboardController {
  static getDashboard = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Concurrently aggregate query responses from individual modules
    const [profile, applications, savedJobs, notifications, insights, mockInterviews] = await Promise.all([
      ProfileService.getStudentProfile(userId).catch(() => null),
      ApplicationsService.getApplications(userId).catch(() => []),
      JobsService.getSavedJobs(userId).catch(() => []),
      NotificationsService.getNotifications(userId).catch(() => []),
      CareerService.getCareerInsights(userId).catch(() => []),
      InterviewService.getHistory(userId).catch(() => [])
    ]);

    // Mock interview readiness summary, read from the same stored reports
    // the interview pages show (never recomputed).
    const completedInterviews = mockInterviews.filter(m => m.status === 'COMPLETED' && m.reports[0]);
    const latestInterviewReport = completedInterviews[0]?.reports[0] ?? null;
    const mockInterviewSummary = {
      totalCompleted: completedInterviews.length,
      lastScore: latestInterviewReport?.score ?? null,
      lastReadiness: (latestInterviewReport as any)?.interviewReadiness ?? null,
      lastInterviewId: completedInterviews[0]?.id ?? null,
      lastJobTitle: completedInterviews[0]?.jobTitle ?? null,
      lastCompletedAt: completedInterviews[0]?.completedAt ?? null,
      bestScore: completedInterviews.reduce<number | null>(
        (best, m) => (m.reports[0] && (best == null || m.reports[0].score > best) ? m.reports[0].score : best),
        null
      )
    };

    // Track profile completion metrics
    let completionScore = 30; // base score
    if (profile) {
      if (profile.phone) completionScore += 10;
      if (profile.bio) completionScore += 15;
      if (profile.graduationYear) completionScore += 15;
      if (profile.educationHistory?.length) completionScore += 10;
      if (profile.experienceHistory?.length) completionScore += 10;
      if (profile.skills?.length) completionScore += 10;
    }
    completionScore = Math.min(100, completionScore);

    // Real missing-step derivation from the same fields that drive the score,
    // instead of a hardcoded list.
    const missingSteps: string[] = [];
    if (profile) {
      if (!profile.bio) missingSteps.push('Add a short bio');
      if (!profile.phone) missingSteps.push('Add your phone number');
      if (!profile.graduationYear) missingSteps.push('Add your graduation year');
      if (!profile.skills?.length) missingSteps.push('Add your skills');
      if (!profile.experienceHistory?.length) missingSteps.push('Add your work experience');
      if (!profile.educationHistory?.length) missingSteps.push('Add your education history');
    }

    // Extract interviews scheduling across applications
    const interviews = applications
      .flatMap(app => app.interviews || [])
      .filter(int => new Date(int.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    // Real recent activity, merged from the student's actual applications and
    // notifications and sorted by real timestamp. No fabricated entries.
    const recentActivity = [
      ...applications.slice(0, 5).map(app => ({
        id: `app_${app.id}`,
        type: 'APPLICATION',
        text: `You applied to ${app.job.title} at ${app.job.company.name}.`,
        time: app.createdAt
      })),
      ...notifications.slice(0, 5).map(n => ({
        id: `notif_${n.id}`,
        type: n.type || 'SYSTEM',
        text: n.content || n.title || 'Notification update.',
        time: n.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        profileSummary: profile ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          preferredRole: profile.preferredRole
        } : null,
        profileCompletion: {
          score: completionScore,
          missingSteps
        },
        savedJobsCount: savedJobs.length,
        recentApplications: applications.slice(0, 3).map(app => ({
          id: app.id,
          jobTitle: app.job.title,
          companyName: app.job.company.name,
          status: app.status,
          dateApplied: app.createdAt
        })),
        upcomingInterviews: interviews.slice(0, 2),
        notificationSummary: {
          unreadCount: notifications.filter(n => !n.isRead).length,
          recent: notifications.slice(0, 3)
        },
        careerInsightSummary: insights[0] || null,
        mockInterviewSummary,
        recentActivity
      },
      message: 'Dashboard aggregated metrics loaded successfully.'
    });
  });
}
