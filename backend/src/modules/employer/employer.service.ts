import crypto from 'crypto';
import { EmployerRepository } from './employer.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { eventBus } from '../shared/event-bus';
import { ApplicationStatus } from '@prisma/client';

export class EmployerService {
  private static async getCompanyIdForUser(userId: string) {
    const recruiter = await prisma.recruiter.findUnique({
      where: { userId }
    });
    if (!recruiter) {
      throw new AppError('Associated recruiter profile not found.', 403, 'RECRUITER_NOT_FOUND');
    }
    return { companyId: recruiter.companyId, recruiterId: recruiter.id };
  }

  static async getDashboard(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getDashboard(companyId);
  }

  static async getCompanyProfile(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getCompanyProfile(companyId);
  }

  static async updateCompanyProfile(userId: string, data: any) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.updateCompanyProfile(companyId, data);
  }

  static async getRecruiters(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getRecruiters(companyId);
  }

  static async inviteRecruiter(userId: string, email: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    
    // Check if invite exists
    const invitationToken = crypto.randomBytes(32).toString('hex');
    
    // Persist invitation details inside AuditLog as mock token index
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RECRUITER_INVITE',
        details: JSON.stringify({ email, companyId, token: invitationToken })
      }
    });

    eventBus.emit('RecruiterInvited', { email, companyId, token: invitationToken });
    return { success: true, token: invitationToken };
  }

  static async createJob(userId: string, categoryId: string, data: any) {
    const { companyId, recruiterId } = await this.getCompanyIdForUser(userId);
    const job = await EmployerRepository.createJob(companyId, recruiterId, categoryId, data);
    
    eventBus.emit('JobCreated', job);
    if (job.isPublished) {
      eventBus.emit('JobPublished', job);
    }
    return job;
  }

  static async updateJob(userId: string, jobId: string, data: any) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const job = await EmployerRepository.updateJob(companyId, jobId, data);

    if (data.state === 'Closed') {
      eventBus.emit('JobClosed', job);
    }
    return job;
  }

  static async getJobs(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getJobs(companyId);
  }

  static async getApplications(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getApplications(companyId);
  }

  static async updateApplicationStage(userId: string, id: string, stageName: string, status: ApplicationStatus, notes?: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    
    // Ownership check
    const list = await EmployerRepository.getApplications(companyId);
    const app = list.find(a => a.id === id);
    if (!app) {
      throw new AppError('Candidate application details not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }

    const result = await EmployerRepository.updateApplicationStage(id, stageName, status, notes);

    if (status === 'SCREENING' || status === 'REVIEWING') {
      eventBus.emit('CandidateShortlisted', result);
    }

    return result;
  }

  static async getAnalytics(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getAnalytics(companyId);
  }
}
