import { ProfileRepository } from './profile.repository';
import { AppError } from '../../utils/app-error';

export class ProfileService {
  static async getStudentProfile(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) {
      throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    }
    return profile;
  }

  static async updateStudentProfile(userId: string, data: any) {
    await this.getStudentProfile(userId);
    return ProfileRepository.updateStudentProfile(userId, data);
  }

  static async addEducation(userId: string, data: any) {
    const profile = await this.getStudentProfile(userId);
    return ProfileRepository.addEducation(profile.id, data);
  }

  static async addExperience(userId: string, data: any) {
    const profile = await this.getStudentProfile(userId);
    return ProfileRepository.addExperience(profile.id, data);
  }

  static async addProject(userId: string, data: any) {
    const profile = await this.getStudentProfile(userId);
    return ProfileRepository.addProject(profile.id, data);
  }

  static async addSkill(userId: string, data: { name: string; level?: number }) {
    const profile = await this.getStudentProfile(userId);
    return ProfileRepository.addSkill(profile.id, data.name, data.level);
  }

  static async addCertification(userId: string, data: any) {
    const profile = await this.getStudentProfile(userId);
    return ProfileRepository.addCertification(profile.id, data);
  }
}
