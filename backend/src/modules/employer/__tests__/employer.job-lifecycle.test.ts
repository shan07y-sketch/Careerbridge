import { describe, it, expect, vi, beforeEach } from 'vitest';

// Coverage for the Job Management lifecycle: create defaults to DRAFT,
// every transition is validated against the JobStatus state machine, company
// ownership is re-verified on every call (404 not 403 to avoid leaking
// existence), and delete either hard-deletes or force-archives depending on
// whether the job has applications.

vi.mock('../employer.repository', () => ({
  EmployerRepository: {
    findJobInCompany: vi.fn(),
    updateJob: vi.fn(),
    duplicateJob: vi.fn(),
    setJobStatus: vi.fn(),
    hardDeleteJob: vi.fn(),
    bulkSetJobStatus: vi.fn(),
    filterOwnedJobIds: vi.fn(),
    getJobs: vi.fn()
  }
}));

vi.mock('../../notifications/notifications.service', () => ({
  NotificationsService: { createNotification: vi.fn() }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    recruiter: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}));

import { EmployerService } from '../employer.service';
import { EmployerRepository } from '../employer.repository';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(EmployerRepository);
const mockedPrisma = vi.mocked(prisma, true);

const RECRUITER = { id: 'recruiter-1', companyId: 'company-1', userId: 'user-recruiter-1' };

function job(overrides: any = {}) {
  return { id: 'job-1', companyId: 'company-1', status: 'DRAFT', applications: [], skillsRequired: [], ...overrides };
}

describe('EmployerService job ownership', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s (not 403) when the job does not belong to the caller company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(null);

    await expect(EmployerService.archiveJob('user-recruiter-1', 'job-999')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'JOB_NOT_FOUND'
    });
  });
});

describe('EmployerService.duplicateJob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clones an owned job as a DRAFT and audit-logs it', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ title: 'Backend Engineer' }) as any);
    mockedRepo.duplicateJob.mockResolvedValue(job({ id: 'job-2', title: 'Backend Engineer (Copy)' }) as any);

    const copy = await EmployerService.duplicateJob('user-recruiter-1', 'job-1');

    expect(copy.title).toBe('Backend Engineer (Copy)');
    expect(mockedRepo.duplicateJob).toHaveBeenCalledWith('company-1', 'recruiter-1', expect.objectContaining({ id: 'job-1' }));
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'JOB_DUPLICATED' }) })
    );
  });
});

describe('EmployerService status transitions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects reopening a job that is not CLOSED', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'DRAFT' }) as any);

    await expect(EmployerService.reopenJob('user-recruiter-1', 'job-1')).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'INVALID_JOB_STATUS_TRANSITION'
    });
    expect(mockedRepo.setJobStatus).not.toHaveBeenCalled();
  });

  it('reopens a CLOSED job back to PUBLISHED', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'CLOSED' }) as any);
    mockedRepo.setJobStatus.mockResolvedValue(job({ status: 'PUBLISHED' }) as any);

    const result = await EmployerService.reopenJob('user-recruiter-1', 'job-1');

    expect(mockedRepo.setJobStatus).toHaveBeenCalledWith('job-1', 'PUBLISHED');
    expect(result.status).toBe('PUBLISHED');
  });

  it('rejects publishing an ARCHIVED job via updateJob (no valid transition path)', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'ARCHIVED' }) as any);

    await expect(
      EmployerService.updateJob('user-recruiter-1', 'job-1', { status: 'PUBLISHED' })
    ).rejects.toMatchObject({ statusCode: 409, errorCode: 'INVALID_JOB_STATUS_TRANSITION' });
    expect(mockedRepo.updateJob).not.toHaveBeenCalled();
  });

  it('allows DRAFT -> PUBLISHED via updateJob and emits JobPublished', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'DRAFT' }) as any);
    mockedRepo.updateJob.mockResolvedValue(job({ status: 'PUBLISHED' }) as any);

    const result = await EmployerService.updateJob('user-recruiter-1', 'job-1', { status: 'PUBLISHED' });
    expect(result!.status).toBe('PUBLISHED');
  });

  it('closeJob moves PUBLISHED -> CLOSED and audit-logs it', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'PUBLISHED' }) as any);
    mockedRepo.setJobStatus.mockResolvedValue(job({ status: 'CLOSED' }) as any);

    await EmployerService.closeJob('user-recruiter-1', 'job-1');

    expect(mockedRepo.setJobStatus).toHaveBeenCalledWith('job-1', 'CLOSED');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'JOB_CLOSED' }) })
    );
  });

  it('archiveJob is a terminal transition reachable from any non-archived status', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'PAUSED' }) as any);
    mockedRepo.setJobStatus.mockResolvedValue(job({ status: 'ARCHIVED' }) as any);

    const result = await EmployerService.archiveJob('user-recruiter-1', 'job-1');
    expect(result.status).toBe('ARCHIVED');
  });
});

describe('EmployerService.autosaveJob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists a partial draft without requiring status change', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ status: 'DRAFT' }) as any);
    mockedRepo.updateJob.mockResolvedValue(job({ title: 'Updated title mid-draft' }) as any);

    const result = await EmployerService.autosaveJob('user-recruiter-1', 'job-1', { title: 'Updated title mid-draft' });

    expect(mockedRepo.updateJob).toHaveBeenCalledWith('company-1', 'job-1', { title: 'Updated title mid-draft' }, { isAutosave: true });
    expect(result!.title).toBe('Updated title mid-draft');
  });
});

describe('EmployerService.deleteJob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hard-deletes a job with zero applications', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ applications: [] }) as any);
    mockedRepo.hardDeleteJob.mockResolvedValue(job() as any);

    const result = await EmployerService.deleteJob('user-recruiter-1', 'job-1');

    expect(result.hardDeleted).toBe(true);
    expect(mockedRepo.hardDeleteJob).toHaveBeenCalledWith('job-1');
    expect(mockedRepo.setJobStatus).not.toHaveBeenCalled();
  });

  it('force-archives instead of deleting when the job has applications', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findJobInCompany.mockResolvedValue(job({ applications: [{ id: 'app-1' }, { id: 'app-2' }] }) as any);
    mockedRepo.setJobStatus.mockResolvedValue(job({ status: 'ARCHIVED' }) as any);

    const result = await EmployerService.deleteJob('user-recruiter-1', 'job-1');

    expect(result.hardDeleted).toBe(false);
    expect(result.message).toContain('2 application(s)');
    expect(mockedRepo.setJobStatus).toHaveBeenCalledWith('job-1', 'ARCHIVED');
    expect(mockedRepo.hardDeleteJob).not.toHaveBeenCalled();
  });
});

describe('EmployerService bulk job actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects the batch when no supplied jobIds belong to the caller company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.filterOwnedJobIds.mockResolvedValue([]);

    await expect(EmployerService.bulkArchiveJobs('user-recruiter-1', ['job-999'])).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'JOB_NOT_FOUND'
    });
    expect(mockedRepo.bulkSetJobStatus).not.toHaveBeenCalled();
  });

  it('bulk-archives only owned jobs and reports skipped ones', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.filterOwnedJobIds.mockResolvedValue(['job-1', 'job-2']);
    mockedRepo.bulkSetJobStatus.mockResolvedValue({ count: 2 } as any);

    const result = await EmployerService.bulkArchiveJobs('user-recruiter-1', ['job-1', 'job-2', 'job-999']);

    expect(mockedRepo.bulkSetJobStatus).toHaveBeenCalledWith(['job-1', 'job-2'], 'ARCHIVED');
    expect(result.updated).toEqual(['job-1', 'job-2']);
    expect(result.skipped).toEqual(['job-999']);
  });

  it('bulk-closes only owned jobs', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.filterOwnedJobIds.mockResolvedValue(['job-1']);
    mockedRepo.bulkSetJobStatus.mockResolvedValue({ count: 1 } as any);

    const result = await EmployerService.bulkCloseJobs('user-recruiter-1', ['job-1']);

    expect(mockedRepo.bulkSetJobStatus).toHaveBeenCalledWith(['job-1'], 'CLOSED');
    expect(result.updated).toEqual(['job-1']);
  });
});
