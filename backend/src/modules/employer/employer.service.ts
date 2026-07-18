import crypto from 'crypto';
import { EmployerRepository } from './employer.repository';
import { EmployerAIEngineClient } from './employer-ai-engine.client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { eventBus } from '../shared/event-bus';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { assertValidTransition } from './job-status.util';
import { MessagesRepository } from '../messages/messages.repository';
import { ResumeRepository } from '../resume/resume.repository';

const EMPLOYER_AI_MODEL_VERSION = 'candidate-evaluation-v1';

/** Builds a resume-analysis summary string, or undefined if there's none yet -- shared by evaluate/compare. */
function summarizeResume(resumes: { resumeAnalyses?: { score: number; summary: string }[] }[] | undefined): string | undefined {
  const analysis = resumes?.[0]?.resumeAnalyses?.[0];
  if (!analysis) return undefined;
  return `ATS score: ${analysis.score}/100. ${analysis.summary}`;
}

/** Builds a mock-interview-history summary string, or undefined if there's none yet -- shared by evaluate/compare. */
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

  static async getInterviews(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getInterviews(companyId);
  }

  static async getCompanyProfile(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const [company, activity] = await Promise.all([
      EmployerRepository.getCompanyProfile(companyId),
      EmployerRepository.getCompanyActivityThisMonth(companyId)
    ]);
    return { ...company, activity };
  }

  static async updateCompanyProfile(userId: string, data: any) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.updateCompanyProfile(companyId, data);
  }

  // ------------------------------------------------------------------
  // Messaging tab -- reuses MessagesRepository (the same
  // Conversation/Message tables the student networking chat uses) rather
  // than a separate system. Scope is intentionally narrow: a recruiter can
  // only start a conversation with a student who has actually applied to
  // one of their company's jobs, matching CareerBridge's hiring-pipeline
  // messaging use case rather than open messaging to any student.
  // ------------------------------------------------------------------

  static async getConversations(userId: string) {
    const { recruiterId } = await this.getCompanyIdForUser(userId);
    return MessagesRepository.getConversationsForRecruiter(recruiterId);
  }

  static async getConversationMessages(userId: string, conversationId: string) {
    await this.getCompanyIdForUser(userId);
    return MessagesRepository.getMessagesByConversationId(conversationId);
  }

  static async startConversation(userId: string, studentProfileId: string) {
    const { companyId, recruiterId } = await this.getCompanyIdForUser(userId);

    const isCandidate = await ResumeRepository.isResumeOwnerApplicantOfCompany(studentProfileId, companyId);
    if (!isCandidate) {
      throw new AppError('You can only message candidates who have applied to your jobs.', 403, 'NOT_A_CANDIDATE');
    }

    const existing = await MessagesRepository.findConversationBetweenRecruiterAndStudent(recruiterId, studentProfileId);
    if (existing) return existing;
    return MessagesRepository.createConversationRecruiterStudent(recruiterId, studentProfileId);
  }

  static async sendMessage(userId: string, conversationId: string, content: string) {
    const { recruiterId } = await this.getCompanyIdForUser(userId);
    const message = await MessagesRepository.sendMessageAsRecruiter(conversationId, recruiterId, content);
    eventBus.emit('MessageSent', message);
    return message;
  }

  static async getRecruiters(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getRecruiters(companyId);
  }

  static async inviteRecruiter(userId: string, email: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);

    const invitationToken = crypto.randomBytes(32).toString('hex');

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
    if (job.status === 'PUBLISHED') {
      eventBus.emit('JobPublished', job);
    }
    return job;
  }

  private static async requireOwnedJob(companyId: string, jobId: string) {
    const job = await EmployerRepository.findJobInCompany(companyId, jobId);
    if (!job) {
      throw new AppError('Job not found or unauthorized.', 404, 'JOB_NOT_FOUND');
    }
    return job;
  }

  static async updateJob(userId: string, jobId: string, data: any, isAutosave = false) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const existing = await this.requireOwnedJob(companyId, jobId);

    if (data.status) {
      assertValidTransition(existing.status as JobStatus, data.status as JobStatus);
    }

    const job = await EmployerRepository.updateJob(companyId, jobId, data, { isAutosave });

    if (data.status === 'CLOSED') {
      eventBus.emit('JobClosed', job);
    }
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      eventBus.emit('JobPublished', job);
    }
    return job;
  }

  static async autosaveJob(userId: string, jobId: string, data: any) {
    return this.updateJob(userId, jobId, data, true);
  }

  static async duplicateJob(userId: string, jobId: string) {
    const { companyId, recruiterId } = await this.getCompanyIdForUser(userId);
    const source = await this.requireOwnedJob(companyId, jobId);
    const copy = await EmployerRepository.duplicateJob(companyId, recruiterId, source);
    await prisma.auditLog.create({
      data: { userId, action: 'JOB_DUPLICATED', details: JSON.stringify({ sourceJobId: jobId, newJobId: copy.id }) }
    });
    eventBus.emit('JobCreated', copy);
    return copy;
  }

  static async archiveJob(userId: string, jobId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const existing = await this.requireOwnedJob(companyId, jobId);
    assertValidTransition(existing.status as JobStatus, 'ARCHIVED');
    const job = await EmployerRepository.setJobStatus(jobId, 'ARCHIVED');
    await prisma.auditLog.create({ data: { userId, action: 'JOB_ARCHIVED', details: JSON.stringify({ jobId }) } });
    return job;
  }

  static async closeJob(userId: string, jobId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const existing = await this.requireOwnedJob(companyId, jobId);
    assertValidTransition(existing.status as JobStatus, 'CLOSED');
    const job = await EmployerRepository.setJobStatus(jobId, 'CLOSED');
    await prisma.auditLog.create({ data: { userId, action: 'JOB_CLOSED', details: JSON.stringify({ jobId }) } });
    eventBus.emit('JobClosed', job);
    return job;
  }

  static async reopenJob(userId: string, jobId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const existing = await this.requireOwnedJob(companyId, jobId);
    if (existing.status !== 'CLOSED') {
      throw new AppError('Only a closed job can be reopened.', 409, 'INVALID_JOB_STATUS_TRANSITION');
    }
    assertValidTransition(existing.status as JobStatus, 'PUBLISHED');
    const job = await EmployerRepository.setJobStatus(jobId, 'PUBLISHED');
    await prisma.auditLog.create({ data: { userId, action: 'JOB_REOPENED', details: JSON.stringify({ jobId }) } });
    eventBus.emit('JobPublished', job);
    return job;
  }

  static async deleteJob(userId: string, jobId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const existing = await this.requireOwnedJob(companyId, jobId);
    const applicationCount = (existing as any).applications?.length ?? 0;

    if (applicationCount > 0) {
      const job = await EmployerRepository.setJobStatus(jobId, 'ARCHIVED');
      await prisma.auditLog.create({
        data: { userId, action: 'JOB_FORCE_ARCHIVED_ON_DELETE', details: JSON.stringify({ jobId, applicationCount }) }
      });
      return {
        hardDeleted: false,
        job,
        message: `This job has ${applicationCount} application(s) and cannot be permanently deleted -- archived instead.`
      };
    }

    await EmployerRepository.hardDeleteJob(jobId);
    await prisma.auditLog.create({ data: { userId, action: 'JOB_DELETED', details: JSON.stringify({ jobId }) } });
    return { hardDeleted: true, job: null, message: 'Job permanently deleted.' };
  }

  static async bulkArchiveJobs(userId: string, jobIds: string[]) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const owned = await EmployerRepository.filterOwnedJobIds(companyId, jobIds);
    if (owned.length === 0) {
      throw new AppError('None of the supplied jobs belong to your company.', 404, 'JOB_NOT_FOUND');
    }
    await EmployerRepository.bulkSetJobStatus(owned, 'ARCHIVED');
    await prisma.auditLog.create({ data: { userId, action: 'JOBS_BULK_ARCHIVED', details: JSON.stringify({ jobIds: owned }) } });
    return { updated: owned, skipped: jobIds.filter(id => !owned.includes(id)) };
  }

  static async bulkCloseJobs(userId: string, jobIds: string[]) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const owned = await EmployerRepository.filterOwnedJobIds(companyId, jobIds);
    if (owned.length === 0) {
      throw new AppError('None of the supplied jobs belong to your company.', 404, 'JOB_NOT_FOUND');
    }
    await EmployerRepository.bulkSetJobStatus(owned, 'CLOSED');
    await prisma.auditLog.create({ data: { userId, action: 'JOBS_BULK_CLOSED', details: JSON.stringify({ jobIds: owned }) } });
    return { updated: owned, skipped: jobIds.filter(id => !owned.includes(id)) };
  }

  static async getJobs(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getJobs(companyId);
  }

  static async getJobCategories() {
    return EmployerRepository.getJobCategories();
  }

  static async getApplications(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getApplications(companyId);
  }

  static async getApplicationQueue(
    userId: string,
    options: {
      search?: string;
      status?: ApplicationStatus;
      jobId?: string;
      dateFrom?: string;
      dateTo?: string;
      tagIds?: string[];
      sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'candidateName';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getApplicationQueue(companyId, options);
  }

  static async getApplicationDetail(userId: string, applicationId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const detail = await EmployerRepository.getApplicationDetail(companyId, applicationId);
    if (!detail) {
      throw new AppError('Candidate application not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }
    return detail;
  }

  /**
   * Mock interview reports the candidate EXPLICITLY shared with employers.
   * Access requires an application from that student to one of this
   * company's jobs; unshared sessions are never exposed.
   */
  static async getSharedInterviewReports(userId: string, applicationId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const app = await EmployerRepository.findApplicationInCompany(companyId, applicationId);
    if (!app) {
      throw new AppError('Candidate application not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }
    const { InterviewRepository } = await import('../interview/interview.repository');
    const sessions = await InterviewRepository.getSharedSessionsForStudent(app.studentProfileId);
    return sessions.map(s => ({
      mockInterviewId: s.id,
      jobTitle: s.jobTitle,
      companyName: s.companyName,
      interviewType: s.interviewType,
      difficulty: s.difficulty,
      completedAt: s.completedAt,
      totalDurationSec: s.totalDurationSec,
      report: s.reports[0] ?? null
    }));
  }

  /** PDF of one shared report, same access rule as getSharedInterviewReports. */
  static async getSharedInterviewReportPdf(userId: string, applicationId: string, mockInterviewId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const app = await EmployerRepository.findApplicationInCompany(companyId, applicationId);
    if (!app) {
      throw new AppError('Candidate application not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }
    const { InterviewRepository } = await import('../interview/interview.repository');
    const { InterviewPdfService } = await import('../interview/interview-pdf.service');
    const session = await InterviewRepository.getSessionById(mockInterviewId);
    if (
      !session ||
      session.studentProfileId !== app.studentProfileId ||
      !session.sharedWithEmployers ||
      session.status !== 'COMPLETED' ||
      !session.reports[0]
    ) {
      throw new AppError('Shared interview report not found.', 404, 'REPORT_NOT_FOUND');
    }
    const studentName = `${session.studentProfile.firstName} ${session.studentProfile.lastName}`.trim();
    const buffer = await InterviewPdfService.render({ ...session.reports[0], session: { ...session, studentName } } as any);
    return { buffer, fileName: `CareerBridge-Interview-Report-${studentName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf` };
  }

  private static async requireOwnedApplication(companyId: string, applicationId: string) {
    const app = await EmployerRepository.findApplicationInCompany(companyId, applicationId);
    if (!app) {
      throw new AppError('Candidate application details not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }
    return app;
  }

  private static async notifyCandidate(app: any, title: string, content: string, priority: string = 'MEDIUM') {
    const recipientId = app.studentProfile?.user?.id;
    if (!recipientId) return;
    await NotificationsService.createNotification({ recipientId, type: 'APPLICATION', title, content, priority });
    // Real-time application-card refresh: the socket layer listens for
    // ApplicationUpdated and pushes 'application-updated' to the student's room,
    // so status changes (shortlist/reject/interview/offer) reflect live, not
    // only on next load. Previously this listener had no emitter (dead wiring).
    eventBus.emit('ApplicationUpdated', { studentId: recipientId, applicationId: app.id, status: app.status });
  }

  static async updateApplicationStage(userId: string, id: string, stageName: string, status: ApplicationStatus, notes?: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const app = await this.requireOwnedApplication(companyId, id);

    const result = await EmployerRepository.updateApplicationStage(id, stageName, status, notes);

    await prisma.auditLog.create({
      data: { userId, action: 'APPLICATION_STAGE_UPDATED', details: JSON.stringify({ applicationId: id, stageName, status }) }
    });

    await this.notifyCandidate(app, 'Application update', `Your application for "${app.job.title}" moved to ${stageName}.`);

    if (status === 'SCREENING' || status === 'REVIEWING') {
      eventBus.emit('CandidateShortlisted', result);
    }

    return result;
  }

  static async shortlistCandidate(userId: string, id: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const app = await this.requireOwnedApplication(companyId, id);

    const result = await EmployerRepository.updateApplicationStage(id, 'Shortlisted', 'SHORTLISTED' as ApplicationStatus, undefined);

    await prisma.auditLog.create({
      data: { userId, action: 'CANDIDATE_SHORTLISTED', details: JSON.stringify({ applicationId: id }) }
    });
    await this.notifyCandidate(app, 'You have been shortlisted', `Your application for "${app.job.title}" has been shortlisted for further review.`);
    eventBus.emit('CandidateShortlisted', result);

    return result;
  }

  static async rejectCandidate(userId: string, id: string, reason?: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const app = await this.requireOwnedApplication(companyId, id);

    const result = await EmployerRepository.updateApplicationStage(id, 'Rejected', 'REJECTED' as ApplicationStatus, reason);

    await prisma.auditLog.create({
      data: { userId, action: 'CANDIDATE_REJECTED', details: JSON.stringify({ applicationId: id, reason }) }
    });
    await this.notifyCandidate(app, 'Application update', `Your application for "${app.job.title}" was not moved forward.`);
    eventBus.emit('CandidateRejected', result);

    return result;
  }

  static async bulkUpdateApplications(userId: string, applicationIds: string[], action: 'shortlist' | 'reject', reason?: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);

    const owned = await EmployerRepository.filterOwnedApplicationIds(companyId, applicationIds);
    if (owned.length === 0) {
      throw new AppError('None of the supplied applications belong to your company.', 404, 'APPLICATION_NOT_FOUND');
    }

    const ownedIds = owned.map(a => a.id);
    const stageName = action === 'shortlist' ? 'Shortlisted' : 'Rejected';
    const status = (action === 'shortlist' ? 'SHORTLISTED' : 'REJECTED') as ApplicationStatus;

    const results = await EmployerRepository.bulkUpdateApplicationStage(ownedIds, stageName, status);

    await prisma.auditLog.create({
      data: {
        userId,
        action: action === 'shortlist' ? 'CANDIDATES_BULK_SHORTLISTED' : 'CANDIDATES_BULK_REJECTED',
        details: JSON.stringify({ applicationIds: ownedIds, skippedIds: applicationIds.filter(id => !ownedIds.includes(id)), reason })
      }
    });

    const title = action === 'shortlist' ? 'You have been shortlisted' : 'Application update';
    await Promise.all(
      owned.map(app => {
        const recipientId = app.studentProfile?.user?.id;
        if (!recipientId) return Promise.resolve();
        const content =
          action === 'shortlist'
            ? `Your application for "${app.job.title}" has been shortlisted for further review.`
            : `Your application for "${app.job.title}" was not moved forward.`;
        return NotificationsService.createNotification({ recipientId, type: 'APPLICATION', title, content, priority: 'MEDIUM' });
      })
    );

    eventBus.emit(action === 'shortlist' ? 'CandidateShortlisted' : 'CandidateRejected', results);

    return { updated: ownedIds, skipped: applicationIds.filter(id => !ownedIds.includes(id)), applications: results };
  }

  static async addNote(userId: string, applicationId: string, content: string) {
    const { companyId, recruiterId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedApplication(companyId, applicationId);

    if (!content || !content.trim()) {
      throw new AppError('Note content cannot be empty.', 400, 'INVALID_NOTE');
    }

    const note = await EmployerRepository.createNote(applicationId, recruiterId, content.trim());

    await prisma.auditLog.create({
      data: { userId, action: 'APPLICATION_NOTE_ADDED', details: JSON.stringify({ applicationId, noteId: note.id }) }
    });

    return note;
  }

  static async getNotes(userId: string, applicationId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedApplication(companyId, applicationId);
    return EmployerRepository.getNotes(applicationId);
  }

  static async scheduleInterview(
    userId: string,
    applicationId: string,
    data: { title: string; scheduledAt: string; duration: number; locationUrl?: string }
  ) {
    const { companyId, recruiterId } = await this.getCompanyIdForUser(userId);
    const app = await this.requireOwnedApplication(companyId, applicationId);

    const scheduledAt = new Date(data.scheduledAt);
    if (isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
      throw new AppError('Interview must be scheduled for a valid future date/time.', 400, 'INVALID_SCHEDULE');
    }
    if (!data.duration || data.duration < 5) {
      throw new AppError('Interview duration must be at least 5 minutes.', 400, 'INVALID_DURATION');
    }

    const interview = await EmployerRepository.createInterview(applicationId, recruiterId, {
      title: data.title,
      scheduledAt,
      duration: data.duration,
      locationUrl: data.locationUrl
    });

    await EmployerRepository.updateApplicationStage(applicationId, 'Interview Scheduled', 'INTERVIEWING' as ApplicationStatus, data.title);

    await prisma.auditLog.create({
      data: { userId, action: 'INTERVIEW_SCHEDULED', details: JSON.stringify({ applicationId, interviewId: interview.id }) }
    });

    await this.notifyCandidate(
      app,
      'Interview scheduled',
      `An interview ("${data.title}") has been scheduled for your application to "${app.job.title}".`,
      'HIGH'
    );

    eventBus.emit('InterviewScheduled', interview);
    return interview;
  }

  static async updateInterview(
    userId: string,
    interviewId: string,
    data: { scheduledAt?: string; duration?: number; locationUrl?: string; status?: string; feedback?: string }
  ) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const existing = await EmployerRepository.findInterviewInCompany(companyId, interviewId);
    if (!existing) {
      throw new AppError('Interview not found or unauthorized.', 404, 'INTERVIEW_NOT_FOUND');
    }

    const updated = await EmployerRepository.updateInterview(interviewId, {
      ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
      ...(data.duration ? { duration: data.duration } : {}),
      ...(data.locationUrl !== undefined ? { locationUrl: data.locationUrl } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.feedback !== undefined ? { feedback: data.feedback } : {})
    });

    await prisma.auditLog.create({
      data: { userId, action: 'INTERVIEW_UPDATED', details: JSON.stringify({ interviewId, changes: data }) }
    });

    return updated;
  }

  static async createOffer(
    userId: string,
    applicationId: string,
    data: { title: string; salary: number; currency?: string; startDate: string; notes?: string }
  ) {
    const { companyId, recruiterId } = await this.getCompanyIdForUser(userId);
    const app = await this.requireOwnedApplication(companyId, applicationId);

    if ((app as any).offer) {
      throw new AppError('An offer already exists for this application. Withdraw it before creating a new one.', 409, 'OFFER_ALREADY_EXISTS');
    }
    if (!data.salary || data.salary <= 0) {
      throw new AppError('Offer salary must be a positive number.', 400, 'INVALID_SALARY');
    }
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      throw new AppError('Offer start date is invalid.', 400, 'INVALID_START_DATE');
    }

    const offer = await EmployerRepository.createOffer(applicationId, recruiterId, {
      title: data.title,
      salary: data.salary,
      currency: data.currency || 'USD',
      startDate,
      notes: data.notes
    });

    await EmployerRepository.updateApplicationStage(applicationId, 'Offer Extended', 'OFFERED' as ApplicationStatus, data.title);

    await prisma.auditLog.create({
      data: { userId, action: 'OFFER_CREATED', details: JSON.stringify({ applicationId, offerId: offer.id }) }
    });

    await this.notifyCandidate(
      app,
      'You have an offer!',
      `You've received an offer for "${data.title}" (${app.job.title}). Review it in your applications.`,
      'URGENT'
    );

    eventBus.emit('OfferCreated', offer);
    return offer;
  }

  static async withdrawOffer(userId: string, offerId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const offer = await EmployerRepository.findOfferInCompany(companyId, offerId);
    if (!offer) {
      throw new AppError('Offer not found or unauthorized.', 404, 'OFFER_NOT_FOUND');
    }
    if (offer.status !== 'EXTENDED') {
      throw new AppError('Only an outstanding offer can be withdrawn.', 409, 'OFFER_NOT_WITHDRAWABLE');
    }

    const updated = await EmployerRepository.withdrawOffer(offerId);

    await prisma.auditLog.create({
      data: { userId, action: 'OFFER_WITHDRAWN', details: JSON.stringify({ offerId }) }
    });

    const recipientId = (offer as any).application?.studentProfile?.user?.id;
    if (recipientId) {
      await NotificationsService.createNotification({
        recipientId,
        type: 'APPLICATION',
        title: 'Offer withdrawn',
        content: `The offer for "${(offer as any).application?.job?.title}" has been withdrawn by the employer.`,
        priority: 'URGENT'
      });
    }

    eventBus.emit('OfferWithdrawn', updated);
    return updated;
  }

  static async getAnalytics(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getAnalytics(companyId);
  }

  // ------------------------------------------------------------------
  // Tags
  // ------------------------------------------------------------------

  static async getTags(userId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getTags(companyId);
  }

  static async createTag(userId: string, name: string, color?: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError('Tag name cannot be empty.', 400, 'INVALID_TAG_NAME');
    }
    const existing = await EmployerRepository.getTags(companyId);
    if (existing.some((t: { name: string }) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new AppError('A tag with this name already exists for your company.', 409, 'TAG_ALREADY_EXISTS');
    }
    const tag = await EmployerRepository.createTag(companyId, trimmed, color);
    await prisma.auditLog.create({ data: { userId, action: 'TAG_CREATED', details: JSON.stringify({ tagId: tag.id, name: trimmed }) } });
    return tag;
  }

  private static async requireOwnedTag(companyId: string, tagId: string) {
    const tag = await EmployerRepository.findTagInCompany(companyId, tagId);
    if (!tag) {
      throw new AppError('Tag not found or unauthorized.', 404, 'TAG_NOT_FOUND');
    }
    return tag;
  }

  static async deleteTag(userId: string, tagId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedTag(companyId, tagId);
    await EmployerRepository.deleteTag(tagId);
    await prisma.auditLog.create({ data: { userId, action: 'TAG_DELETED', details: JSON.stringify({ tagId }) } });
    return { deleted: true };
  }

  static async attachTag(userId: string, applicationId: string, tagId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedApplication(companyId, applicationId);
    await this.requireOwnedTag(companyId, tagId);
    const result = await EmployerRepository.attachTag(applicationId, tagId);
    await prisma.auditLog.create({
      data: { userId, action: 'APPLICATION_TAG_ATTACHED', details: JSON.stringify({ applicationId, tagId }) }
    });
    return result;
  }

  static async detachTag(userId: string, applicationId: string, tagId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedApplication(companyId, applicationId);
    await this.requireOwnedTag(companyId, tagId);
    await EmployerRepository.detachTag(applicationId, tagId);
    await prisma.auditLog.create({
      data: { userId, action: 'APPLICATION_TAG_DETACHED', details: JSON.stringify({ applicationId, tagId }) }
    });
    return { detached: true };
  }

  static async bulkTagApplications(userId: string, applicationIds: string[], tagId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedTag(companyId, tagId);

    const owned = await EmployerRepository.filterOwnedApplicationIds(companyId, applicationIds);
    if (owned.length === 0) {
      throw new AppError('None of the supplied applications belong to your company.', 404, 'APPLICATION_NOT_FOUND');
    }
    const ownedIds = owned.map(a => a.id);
    await EmployerRepository.bulkAttachTag(ownedIds, tagId);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANDIDATES_BULK_TAGGED',
        details: JSON.stringify({ applicationIds: ownedIds, tagId, skippedIds: applicationIds.filter(id => !ownedIds.includes(id)) })
      }
    });

    return { updated: ownedIds, skipped: applicationIds.filter(id => !ownedIds.includes(id)) };
  }

  // ------------------------------------------------------------------
  // Unified activity timeline
  // ------------------------------------------------------------------

  static async getApplicationTimeline(userId: string, applicationId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const app = await EmployerRepository.getApplicationTimelineSource(companyId, applicationId);
    if (!app) {
      throw new AppError('Candidate application not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }

    type TimelineEntry = { type: string; timestamp: Date; summary: string; actorLabel: string };
    const entries: TimelineEntry[] = [];

    for (const stage of (app as any).stages) {
      entries.push({
        type: 'STAGE_CHANGE',
        timestamp: stage.createdAt,
        summary: `Moved to "${stage.stageName}" (${stage.status})${stage.notes ? ` -- ${stage.notes}` : ''}`,
        actorLabel: 'Recruiting team'
      });
    }

    for (const note of (app as any).notes) {
      const author = note.authorRecruiter?.user?.email || 'A recruiter';
      entries.push({
        type: 'NOTE_ADDED',
        timestamp: note.createdAt,
        summary: note.content,
        actorLabel: author
      });
    }

    for (const interview of (app as any).interviews) {
      const scheduler = interview.scheduledByRecruiter?.user?.email || 'A recruiter';
      entries.push({
        type: 'INTERVIEW_SCHEDULED',
        timestamp: interview.createdAt,
        summary: `Interview "${interview.title}" scheduled for ${new Date(interview.scheduledAt).toLocaleString()} (${interview.status})`,
        actorLabel: scheduler
      });
      if (interview.status === 'COMPLETED' || interview.feedback) {
        entries.push({
          type: 'INTERVIEW_UPDATED',
          timestamp: interview.updatedAt,
          summary: `Interview "${interview.title}" marked ${interview.status}${interview.feedback ? ` -- ${interview.feedback}` : ''}`,
          actorLabel: scheduler
        });
      }
    }

    const offer = (app as any).offer;
    if (offer) {
      const creator = offer.createdByRecruiter?.user?.email || 'A recruiter';
      entries.push({ type: 'OFFER_CREATED', timestamp: offer.createdAt, summary: `Offer "${offer.title}" created (${offer.salary} ${offer.currency})`, actorLabel: creator });
      if (offer.extendedAt) {
        entries.push({ type: 'OFFER_EXTENDED', timestamp: offer.extendedAt, summary: `Offer extended to candidate.`, actorLabel: creator });
      }
      if (offer.respondedAt) {
        entries.push({ type: 'OFFER_RESPONDED', timestamp: offer.respondedAt, summary: `Candidate responded to offer: ${offer.status}.`, actorLabel: 'Candidate' });
      }
      if (offer.withdrawnAt) {
        entries.push({ type: 'OFFER_WITHDRAWN', timestamp: offer.withdrawnAt, summary: `Offer withdrawn by employer.`, actorLabel: creator });
      }
    }

    entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return entries;
  }

  // ------------------------------------------------------------------
  // Saved filters
  // ------------------------------------------------------------------

  static async getSavedFilters(userId: string) {
    const { recruiterId } = await this.getCompanyIdForUser(userId);
    return EmployerRepository.getSavedFilters(recruiterId);
  }

  static async createSavedFilter(userId: string, name: string, filters: any) {
    const { recruiterId } = await this.getCompanyIdForUser(userId);
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new AppError('Saved filter name cannot be empty.', 400, 'INVALID_FILTER_NAME');
    }
    const saved = await EmployerRepository.createSavedFilter(recruiterId, trimmed, filters ?? {});
    await prisma.auditLog.create({
      data: { userId, action: 'SAVED_FILTER_CREATED', details: JSON.stringify({ savedFilterId: saved.id, name: trimmed }) }
    });
    return saved;
  }

  static async deleteSavedFilter(userId: string, id: string) {
    const { recruiterId } = await this.getCompanyIdForUser(userId);
    const existing = await EmployerRepository.findSavedFilter(recruiterId, id);
    if (!existing) {
      throw new AppError('Saved filter not found or unauthorized.', 404, 'SAVED_FILTER_NOT_FOUND');
    }
    await EmployerRepository.deleteSavedFilter(id);
    await prisma.auditLog.create({ data: { userId, action: 'SAVED_FILTER_DELETED', details: JSON.stringify({ savedFilterId: id }) } });
    return { deleted: true };
  }

  // ------------------------------------------------------------------
  // Employer AI (Phase 4): candidate evaluation & comparison
  // ------------------------------------------------------------------

  static async evaluateCandidate(userId: string, applicationId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    const context = await EmployerRepository.getCandidateEvaluationContext(companyId, applicationId);
    if (!context) {
      throw new AppError('Candidate application not found or unauthorized.', 404, 'APPLICATION_NOT_FOUND');
    }

    const candidateSkills = (context.studentProfile?.skills ?? []).map(s => s.skill.name);
    const resumeSummary = summarizeResume(context.studentProfile?.resumes);
    const interviewHistorySummary = summarizeInterviews(context.studentProfile?.mockInterviews);

    const result = await EmployerAIEngineClient.evaluateCandidate(
      context.job.title,
      context.job.description,
      context.job.requirements,
      candidateSkills,
      resumeSummary,
      interviewHistorySummary
    );

    const evaluation = await EmployerRepository.createCandidateEvaluation(applicationId, {
      fitScore: result.fitScore,
      recommendation: result.recommendation,
      summary: result.summary,
      strengths: result.strengths,
      concerns: result.concerns,
      skillsMatch: result.skillsMatch,
      skillsGap: result.skillsGap,
      interviewSignal: result.interviewSignal,
      modelVersion: result.estimated ? `${EMPLOYER_AI_MODEL_VERSION}-estimated` : EMPLOYER_AI_MODEL_VERSION
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANDIDATE_EVALUATION_GENERATED',
        details: JSON.stringify({ applicationId, fitScore: result.fitScore })
      }
    });

    eventBus.emit('CandidateEvaluated', evaluation);
    return evaluation;
  }

  static async getLatestEvaluation(userId: string, applicationId: string) {
    const { companyId } = await this.getCompanyIdForUser(userId);
    await this.requireOwnedApplication(companyId, applicationId);
    return EmployerRepository.getLatestCandidateEvaluation(companyId, applicationId);
  }

  static async compareCandidates(userId: string, jobId: string, applicationIds: string[]) {
    if (!Array.isArray(applicationIds) || applicationIds.length < 2) {
      throw new AppError('Select at least two candidates to compare.', 400, 'VALIDATION_ERROR');
    }
    const { companyId } = await this.getCompanyIdForUser(userId);
    const job = await this.requireOwnedJob(companyId, jobId);

    const contexts = await EmployerRepository.getComparisonContext(companyId, jobId, applicationIds);
    if (contexts.length < 2) {
      throw new AppError('At least two of the supplied candidates must belong to this job.', 400, 'VALIDATION_ERROR');
    }
    const candidates = contexts.map(c => ({
      candidateId: c.id,
      name: `${c.studentProfile?.firstName ?? ''} ${c.studentProfile?.lastName ?? ''}`.trim(),
      skills: (c.studentProfile?.skills ?? []).map((s: any) => s.skill.name),
      resumeSummary: summarizeResume(c.studentProfile?.resumes),
      interviewHistorySummary: summarizeInterviews(c.studentProfile?.mockInterviews)
    }));

    const result = await EmployerAIEngineClient.compareCandidates(job.title, job.description, job.requirements, candidates);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANDIDATES_COMPARED',
        details: JSON.stringify({ jobId, applicationIds: contexts.map(c => c.id) })
      }
    });

    return result;
  }
}
