import { ApplicationsRepository } from './applications.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';
import { eventBus } from '../shared/event-bus';
import { NotificationsService } from '../notifications/notifications.service';
import { prisma } from '../../config/database';

export class ApplicationsService {
  static async getApplications(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return ApplicationsRepository.getApplications(profile.id);
  }

  static async getApplicationById(userId: string, id: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const app = await ApplicationsRepository.getApplicationById(id);
    if (!app || app.studentProfileId !== profile.id) {
      throw new AppError('Application not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }
    return app;
  }

  static async applyToJob(userId: string, jobId: string, coverLetter?: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const alreadyApplied = await ApplicationsRepository.hasApplied(profile.id, jobId);
    if (alreadyApplied) {
      throw new AppError('You have already applied to this job.', 400, 'DUPLICATE_APPLICATION');
    }

    const app = await ApplicationsRepository.applyToJob(profile.id, jobId, coverLetter);
    eventBus.emit('ApplicationCreated', app);
    return app;
  }

  static async retractApplication(userId: string, id: string) {
    const app = await this.getApplicationById(userId, id);
    await ApplicationsRepository.deleteApplication(app.id);
    eventBus.emit('ApplicationWithdrawn', { id: app.id, studentProfileId: app.studentProfileId });
  }

  /**
   * Offer acceptance/decline is the student half of the Hiring Pipeline
   * workflow (the recruiter half -- create/extend/withdraw -- lives in
   * EmployerService). Only the owning student may respond, and only while
   * the offer is in EXTENDED status -- this is the moment the whole
   * Student -> ... -> Offer -> Acceptance product journey resolves.
   */
  static async respondToOffer(userId: string, applicationId: string, accept: boolean) {
    const app = await this.getApplicationById(userId, applicationId);
    const offer = await ApplicationsRepository.getOfferById((app as any).offer?.id);
    if (!offer || offer.applicationId !== applicationId) {
      throw new AppError('No offer found for this application.', 404, 'OFFER_NOT_FOUND');
    }
    if (offer.status !== 'EXTENDED') {
      throw new AppError('This offer is not currently awaiting a response.', 409, 'OFFER_NOT_RESPONDABLE');
    }

    const updated = await ApplicationsRepository.respondToOffer(offer.id, accept);

    const job = await prisma.job.findUnique({ where: { id: app.jobId }, include: { recruiter: { include: { user: true } } } });
    if (job?.recruiter?.user?.id) {
      await NotificationsService.createNotification({
        recipientId: job.recruiter.user.id,
        type: 'APPLICATION',
        title: accept ? 'Offer accepted' : 'Offer declined',
        content: `A candidate has ${accept ? 'accepted' : 'declined'} the offer for "${job.title}".`,
        priority: 'HIGH'
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: accept ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED',
        details: JSON.stringify({ applicationId, offerId: offer.id })
      }
    });

    eventBus.emit(accept ? 'OfferAccepted' : 'OfferDeclined', updated);
    return updated;
  }
}
