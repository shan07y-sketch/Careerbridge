import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for the Hiring Pipeline Workflow: recruiters can only
// ever act on applications belonging to their own company (companyId is
// re-derived from the authenticated user on every call, never trusted from
// the client), every mutating action is audit-logged, and every mutating
// action that affects the candidate notifies them -- this is what makes the
// pipeline usable end-to-end rather than a set of disconnected buttons.

vi.mock('../employer.repository', () => ({
  EmployerRepository: {
    getDashboard: vi.fn(),
    getApplicationQueue: vi.fn(),
    getApplicationDetail: vi.fn(),
    findApplicationInCompany: vi.fn(),
    updateApplicationStage: vi.fn(),
    createNote: vi.fn(),
    getNotes: vi.fn(),
    createInterview: vi.fn(),
    findInterviewInCompany: vi.fn(),
    updateInterview: vi.fn(),
    findOfferInCompany: vi.fn(),
    createOffer: vi.fn(),
    withdrawOffer: vi.fn(),
    getAnalytics: vi.fn(),
    filterOwnedApplicationIds: vi.fn(),
    bulkUpdateApplicationStage: vi.fn()
  }
}));

vi.mock('../../notifications/notifications.service', () => ({
  NotificationsService: {
    createNotification: vi.fn()
  }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    recruiter: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}));

import { EmployerService } from '../employer.service';
import { EmployerRepository } from '../employer.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(EmployerRepository);
const mockedNotifications = vi.mocked(NotificationsService);
const mockedPrisma = vi.mocked(prisma, true);

const RECRUITER = { id: 'recruiter-1', companyId: 'company-1', userId: 'user-recruiter-1' };
const APP = {
  id: 'app-1',
  jobId: 'job-1',
  job: { id: 'job-1', title: 'Frontend Engineer' },
  studentProfile: { id: 'profile-1', user: { id: 'user-student-1' } },
  offer: null
};

describe('EmployerService company scoping', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects any action when the caller has no recruiter profile', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(null);

    await expect(EmployerService.shortlistCandidate('user-x', 'app-1')).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'RECRUITER_NOT_FOUND'
    });
  });

  it('rejects acting on an application that does not belong to the recruiter company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(null);

    await expect(EmployerService.shortlistCandidate('user-recruiter-1', 'app-999')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'APPLICATION_NOT_FOUND'
    });
    expect(mockedRepo.updateApplicationStage).not.toHaveBeenCalled();
  });
});

describe('EmployerService.shortlistCandidate / rejectCandidate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shortlists a candidate, audit-logs it, and notifies them', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.updateApplicationStage.mockResolvedValue({ id: 'app-1', status: 'SHORTLISTED' } as any);

    const result = await EmployerService.shortlistCandidate('user-recruiter-1', 'app-1');

    expect(result.status).toBe('SHORTLISTED');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CANDIDATE_SHORTLISTED' }) })
    );
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-student-1' })
    );
  });

  it('rejects a candidate, audit-logs it with the reason, and notifies them', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.updateApplicationStage.mockResolvedValue({ id: 'app-1', status: 'REJECTED' } as any);

    await EmployerService.rejectCandidate('user-recruiter-1', 'app-1', 'Not enough experience');

    expect(mockedRepo.updateApplicationStage).toHaveBeenCalledWith('app-1', 'Rejected', 'REJECTED', 'Not enough experience');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CANDIDATE_REJECTED' }) })
    );
  });
});

describe('EmployerService.bulkUpdateApplications', () => {
  beforeEach(() => vi.clearAllMocks());

  const OWNED = [
    { id: 'app-1', jobId: 'job-1', job: { title: 'Frontend Engineer' }, studentProfile: { user: { id: 'user-student-1' } } },
    { id: 'app-2', jobId: 'job-1', job: { title: 'Frontend Engineer' }, studentProfile: { user: { id: 'user-student-2' } } }
  ];

  it('rejects the batch when no supplied applicationIds belong to the caller company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.filterOwnedApplicationIds.mockResolvedValue([]);

    await expect(
      EmployerService.bulkUpdateApplications('user-recruiter-1', ['app-999'], 'shortlist')
    ).rejects.toMatchObject({ statusCode: 404, errorCode: 'APPLICATION_NOT_FOUND' });
    expect(mockedRepo.bulkUpdateApplicationStage).not.toHaveBeenCalled();
  });

  it('bulk-shortlists only the owned applications, writes one audit log entry, and notifies each candidate', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.filterOwnedApplicationIds.mockResolvedValue(OWNED as any);
    mockedRepo.bulkUpdateApplicationStage.mockResolvedValue(OWNED as any);

    const result = await EmployerService.bulkUpdateApplications('user-recruiter-1', ['app-1', 'app-2', 'app-999'], 'shortlist');

    expect(mockedRepo.bulkUpdateApplicationStage).toHaveBeenCalledWith(['app-1', 'app-2'], 'Shortlisted', 'SHORTLISTED');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CANDIDATES_BULK_SHORTLISTED' }) })
    );
    expect(mockedNotifications.createNotification).toHaveBeenCalledTimes(2);
    expect(result.updated).toEqual(['app-1', 'app-2']);
    expect(result.skipped).toEqual(['app-999']);
  });

  it('bulk-rejects the owned applications', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.filterOwnedApplicationIds.mockResolvedValue(OWNED as any);
    mockedRepo.bulkUpdateApplicationStage.mockResolvedValue(OWNED as any);

    await EmployerService.bulkUpdateApplications('user-recruiter-1', ['app-1', 'app-2'], 'reject', 'Not enough experience');

    expect(mockedRepo.bulkUpdateApplicationStage).toHaveBeenCalledWith(['app-1', 'app-2'], 'Rejected', 'REJECTED');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CANDIDATES_BULK_REJECTED' }) })
    );
  });
});

describe('EmployerService notes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an empty note', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);

    await expect(EmployerService.addNote('user-recruiter-1', 'app-1', '   ')).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INVALID_NOTE'
    });
    expect(mockedRepo.createNote).not.toHaveBeenCalled();
  });

  it('creates a note attributed to the recruiter and audit-logs it', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.createNote.mockResolvedValue({ id: 'note-1', content: 'Strong candidate' } as any);

    const note = await EmployerService.addNote('user-recruiter-1', 'app-1', 'Strong candidate');

    expect(mockedRepo.createNote).toHaveBeenCalledWith('app-1', 'recruiter-1', 'Strong candidate');
    expect(note.id).toBe('note-1');
  });
});

describe('EmployerService.scheduleInterview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects scheduling an interview in the past', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);

    await expect(
      EmployerService.scheduleInterview('user-recruiter-1', 'app-1', {
        title: 'Onsite',
        scheduledAt: '2020-01-01T10:00:00Z',
        duration: 30
      })
    ).rejects.toMatchObject({ statusCode: 400, errorCode: 'INVALID_SCHEDULE' });
  });

  it('schedules a valid interview, moves the application to INTERVIEWING, and notifies the candidate', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.createInterview.mockResolvedValue({ id: 'interview-1' } as any);
    mockedRepo.updateApplicationStage.mockResolvedValue({ id: 'app-1', status: 'INTERVIEWING' } as any);

    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const interview = await EmployerService.scheduleInterview('user-recruiter-1', 'app-1', {
      title: 'Onsite Round',
      scheduledAt: future,
      duration: 45
    });

    expect(interview.id).toBe('interview-1');
    expect(mockedRepo.updateApplicationStage).toHaveBeenCalledWith('app-1', 'Interview Scheduled', 'INTERVIEWING', 'Onsite Round');
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-student-1', priority: 'HIGH' })
    );
  });
});

describe('EmployerService offers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects creating an offer when one already exists', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue({ ...APP, offer: { id: 'offer-1' } } as any);

    await expect(
      EmployerService.createOffer('user-recruiter-1', 'app-1', { title: 'SWE II', salary: 120000, startDate: '2026-09-01' })
    ).rejects.toMatchObject({ statusCode: 409, errorCode: 'OFFER_ALREADY_EXISTS' });
  });

  it('rejects a non-positive salary', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);

    await expect(
      EmployerService.createOffer('user-recruiter-1', 'app-1', { title: 'SWE II', salary: 0, startDate: '2026-09-01' })
    ).rejects.toMatchObject({ statusCode: 400, errorCode: 'INVALID_SALARY' });
  });

  it('creates an offer, moves the application to OFFERED, and notifies the candidate', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.createOffer.mockResolvedValue({ id: 'offer-1', status: 'EXTENDED' } as any);
    mockedRepo.updateApplicationStage.mockResolvedValue({ id: 'app-1', status: 'OFFERED' } as any);

    const offer = await EmployerService.createOffer('user-recruiter-1', 'app-1', {
      title: 'Software Engineer II',
      salary: 130000,
      startDate: '2026-09-01'
    });

    expect(offer.id).toBe('offer-1');
    expect(mockedRepo.updateApplicationStage).toHaveBeenCalledWith('app-1', 'Offer Extended', 'OFFERED', 'Software Engineer II');
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-student-1', priority: 'URGENT' })
    );
  });

  it('rejects withdrawing an offer that is not outstanding', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findOfferInCompany.mockResolvedValue({ id: 'offer-1', status: 'ACCEPTED', application: APP } as any);

    await expect(EmployerService.withdrawOffer('user-recruiter-1', 'offer-1')).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'OFFER_NOT_WITHDRAWABLE'
    });
  });

  it('withdraws an outstanding offer and notifies the candidate', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findOfferInCompany.mockResolvedValue({ id: 'offer-1', status: 'EXTENDED', application: APP } as any);
    mockedRepo.withdrawOffer.mockResolvedValue({ id: 'offer-1', status: 'WITHDRAWN' } as any);

    const result = await EmployerService.withdrawOffer('user-recruiter-1', 'offer-1');

    expect(result.status).toBe('WITHDRAWN');
    expect(mockedNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-student-1', title: 'Offer withdrawn' })
    );
  });
});
