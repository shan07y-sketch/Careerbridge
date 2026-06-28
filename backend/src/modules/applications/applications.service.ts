import { ApplicationsRepository } from './applications.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';
import { eventBus } from '../shared/event-bus';

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
}
