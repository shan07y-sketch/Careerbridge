import { CareerRepository } from './career.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';

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
}
