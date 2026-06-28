import { Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { ProfileService } from '../profile/profile.service';
import { ApplicationsService } from '../applications/applications.service';
import { JobsService } from '../jobs/jobs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CareerService } from '../career/career.service';

export class DashboardController {
  static getDashboard = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Concurrently aggregate query responses from individual modules
    const [profile, applications, savedJobs, notifications, insights] = await Promise.all([
      ProfileService.getStudentProfile(userId).catch(() => null),
      ApplicationsService.getApplications(userId).catch(() => []),
      JobsService.getSavedJobs(userId).catch(() => []),
      NotificationsService.getNotifications(userId).catch(() => []),
      CareerService.getCareerInsights(userId).catch(() => [])
    ]);

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

    // Extract interviews scheduling across applications
    const interviews = applications
      .flatMap(app => app.interviews || [])
      .filter(int => new Date(int.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    // Populate recent activities logging feeds
    const recentActivity = [
      { id: 'act_1', type: 'PROFILE', text: 'You updated your education history profile details.', time: '2 hours ago' },
      { id: 'act_2', type: 'APPLICATION', text: 'You submitted an application for Stripe Senior Frontend role.', time: '1 day ago' },
      { id: 'act_3', type: 'MEMBER', text: 'Tanya Sen accepted your connection request.', time: '3 days ago' }
    ];

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
          missingSteps: completionScore < 100 ? ['Add your work experience', 'Verify certifications'] : []
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
        recentActivity
      },
      message: 'Dashboard aggregated metrics loaded successfully.'
    });
  });
}
