import { JobsRepository } from './jobs.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';
import { PaginationParams } from '../../utils/pagination';

export class JobsService {
  static async getJobs(params: PaginationParams, filters: any) {
    const filterQuery: any = {};
    if (filters.workMode) filterQuery.workMode = filters.workMode;
    if (filters.jobType) filterQuery.jobType = filters.jobType;
    if (filters.location) filterQuery.location = { contains: filters.location, mode: 'insensitive' };

    return JobsRepository.getJobs(params, filterQuery);
  }

  static async getJobById(id: string) {
    const job = await JobsRepository.getJobById(id);
    if (!job || job.isDeleted) {
      throw new AppError('Job posting not found.', 404, 'JOB_NOT_FOUND');
    }
    return job;
  }

  static async getSavedJobs(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const list = await JobsRepository.getSavedJobs(profile.id);
    return list.map(item => item.job);
  }

  static async toggleSaveJob(userId: string, jobId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const alreadySaved = await JobsRepository.isJobSaved(profile.id, jobId);
    if (alreadySaved) {
      await JobsRepository.unsaveJob(profile.id, jobId);
      return { saved: false };
    } else {
      await JobsRepository.saveJob(profile.id, jobId);
      return { saved: true };
    }
  }

  static async isJobSaved(userId: string, jobId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) return false;
    return JobsRepository.isJobSaved(profile.id, jobId);
  }
}
