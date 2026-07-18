import { Response } from 'express';
import { prisma } from '../../config/database';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class ScheduledInterviewController {
  static getScheduledInterviews = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id }
    });
    if (!profile) {
      return res.status(200).json({ success: true, data: [] });
    }

    const interviews = await prisma.interview.findMany({
      where: {
        application: {
          studentProfileId: profile.id
        }
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    const formatted = interviews.map(i => {
      const job = i.application.job;
      const company = job.company;
      return {
        id: i.id,
        jobId: job.id,
        jobTitle: job.title,
        companyName: company.name,
        companyLogo: company.logoUrl ?? `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
        type: i.title,
        dateTime: i.scheduledAt.toISOString(),
        status: i.status.toLowerCase(),
        roomLink: i.locationUrl || `https://meet.careerbridge.ai/${i.id}`,
        duration: i.duration,
        feedback: i.feedback
      };
    });

    res.status(200).json({ success: true, data: formatted });
  });

  static getScheduledInterviewById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id }
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.id,
        application: {
          studentProfileId: profile.id
        }
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Scheduled interview not found.' });
    }

    const job = interview.application.job;
    const company = job.company;

    const formatted = {
      id: interview.id,
      jobId: job.id,
      jobTitle: job.title,
      companyName: company.name,
      companyLogo: company.logoUrl ?? `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
      type: interview.title,
      dateTime: interview.scheduledAt.toISOString(),
      status: interview.status.toLowerCase(),
      roomLink: interview.locationUrl || `https://meet.careerbridge.ai/${interview.id}`,
      duration: interview.duration,
      feedback: interview.feedback
    };

    res.status(200).json({ success: true, data: formatted });
  });
}
