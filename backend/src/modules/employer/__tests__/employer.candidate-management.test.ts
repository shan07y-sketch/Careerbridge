import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for the Candidate Management ATS extensions: tags,
// bulk-tag, the unified activity timeline, and recruiter-scoped saved
// filters. Every mutating action must stay company/recruiter-scoped and
// audit-logged, matching the pattern established by the rest of the Hiring
// Pipeline Workflow (see employer.service.test.ts).

vi.mock('../employer.repository', () => ({
  EmployerRepository: {
    getTags: vi.fn(),
    findTagInCompany: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    attachTag: vi.fn(),
    detachTag: vi.fn(),
    bulkAttachTag: vi.fn(),
    getApplicationTags: vi.fn(),
    getApplicationTimelineSource: vi.fn(),
    getSavedFilters: vi.fn(),
    createSavedFilter: vi.fn(),
    findSavedFilter: vi.fn(),
    deleteSavedFilter: vi.fn(),
    findApplicationInCompany: vi.fn(),
    filterOwnedApplicationIds: vi.fn()
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
const APP = {
  id: 'app-1',
  jobId: 'job-1',
  job: { id: 'job-1', title: 'Frontend Engineer' },
  studentProfile: { id: 'profile-1', user: { id: 'user-student-1' } },
  offer: null
};
const TAG = { id: 'tag-1', companyId: 'company-1', name: 'Top Talent', color: '#3B82F6' };

describe('EmployerService tags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists company-scoped tags', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.getTags.mockResolvedValue([TAG] as any);

    const result = await EmployerService.getTags('user-recruiter-1');

    expect(mockedRepo.getTags).toHaveBeenCalledWith('company-1');
    expect(result).toEqual([TAG]);
  });

  it('creates a tag, audit-logs it, and rejects duplicate names within the company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.getTags.mockResolvedValue([TAG] as any);

    await expect(EmployerService.createTag('user-recruiter-1', 'Top Talent')).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'TAG_ALREADY_EXISTS'
    });
    expect(mockedRepo.createTag).not.toHaveBeenCalled();

    mockedRepo.getTags.mockResolvedValue([]);
    mockedRepo.createTag.mockResolvedValue(TAG as any);

    const created = await EmployerService.createTag('user-recruiter-1', 'Needs Follow-up', '#EF4444');
    expect(created).toEqual(TAG);
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'TAG_CREATED' }) })
    );
  });

  it('rejects creating an empty-named tag', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    await expect(EmployerService.createTag('user-recruiter-1', '   ')).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INVALID_TAG_NAME'
    });
  });

  it('rejects deleting a tag that does not belong to the caller company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findTagInCompany.mockResolvedValue(null);

    await expect(EmployerService.deleteTag('user-recruiter-1', 'tag-999')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'TAG_NOT_FOUND'
    });
    expect(mockedRepo.deleteTag).not.toHaveBeenCalled();
  });

  it('attaches a tag to an owned application and audit-logs it', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.findTagInCompany.mockResolvedValue(TAG as any);
    mockedRepo.attachTag.mockResolvedValue({ applicationId: 'app-1', tagId: 'tag-1', tag: TAG } as any);

    const result = await EmployerService.attachTag('user-recruiter-1', 'app-1', 'tag-1');

    expect(mockedRepo.attachTag).toHaveBeenCalledWith('app-1', 'tag-1');
    expect(result.tag).toEqual(TAG);
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'APPLICATION_TAG_ATTACHED' }) })
    );
  });

  it('rejects attaching a tag to an application from another company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(null);

    await expect(EmployerService.attachTag('user-recruiter-1', 'app-999', 'tag-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'APPLICATION_NOT_FOUND'
    });
    expect(mockedRepo.attachTag).not.toHaveBeenCalled();
  });

  it('detaches a tag from an application', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findApplicationInCompany.mockResolvedValue(APP as any);
    mockedRepo.findTagInCompany.mockResolvedValue(TAG as any);

    await EmployerService.detachTag('user-recruiter-1', 'app-1', 'tag-1');

    expect(mockedRepo.detachTag).toHaveBeenCalledWith('app-1', 'tag-1');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'APPLICATION_TAG_DETACHED' }) })
    );
  });

  it('bulk-tags only owned applications and skips the rest', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findTagInCompany.mockResolvedValue(TAG as any);
    mockedRepo.filterOwnedApplicationIds.mockResolvedValue([
      { id: 'app-1', jobId: 'job-1', job: { title: 'Frontend Engineer' }, studentProfile: { user: { id: 'user-student-1' } } }
    ] as any);

    const result = await EmployerService.bulkTagApplications('user-recruiter-1', ['app-1', 'app-999'], 'tag-1');

    expect(mockedRepo.bulkAttachTag).toHaveBeenCalledWith(['app-1'], 'tag-1');
    expect(result.updated).toEqual(['app-1']);
    expect(result.skipped).toEqual(['app-999']);
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CANDIDATES_BULK_TAGGED' }) })
    );
  });

  it('rejects a bulk-tag request when none of the applications belong to the caller company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findTagInCompany.mockResolvedValue(TAG as any);
    mockedRepo.filterOwnedApplicationIds.mockResolvedValue([]);

    await expect(EmployerService.bulkTagApplications('user-recruiter-1', ['app-999'], 'tag-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'APPLICATION_NOT_FOUND'
    });
    expect(mockedRepo.bulkAttachTag).not.toHaveBeenCalled();
  });
});

describe('EmployerService.getApplicationTimeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns an empty-state array when there is no activity yet', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.getApplicationTimelineSource.mockResolvedValue({
      stages: [],
      notes: [],
      interviews: [],
      offer: null
    } as any);

    const timeline = await EmployerService.getApplicationTimeline('user-recruiter-1', 'app-1');
    expect(timeline).toEqual([]);
  });

  it('merges stages, notes, interviews and offer events into one chronologically-sorted feed', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.getApplicationTimelineSource.mockResolvedValue({
      stages: [
        { stageName: 'Shortlisted', status: 'SHORTLISTED', notes: null, createdAt: new Date('2026-01-03T00:00:00Z') }
      ],
      notes: [
        {
          content: 'Strong portfolio',
          createdAt: new Date('2026-01-02T00:00:00Z'),
          authorRecruiter: { user: { email: 'recruiter@acme.com' } }
        }
      ],
      interviews: [
        {
          title: 'Technical screen',
          scheduledAt: new Date('2026-01-10T00:00:00Z'),
          status: 'SCHEDULED',
          feedback: null,
          createdAt: new Date('2026-01-04T00:00:00Z'),
          updatedAt: new Date('2026-01-04T00:00:00Z'),
          scheduledByRecruiter: { user: { email: 'recruiter@acme.com' } }
        }
      ],
      offer: {
        title: 'Software Engineer',
        salary: 120000,
        currency: 'USD',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        extendedAt: new Date('2026-01-05T00:00:00Z'),
        respondedAt: null,
        withdrawnAt: null,
        status: 'EXTENDED',
        createdByRecruiter: { user: { email: 'recruiter@acme.com' } }
      }
    } as any);

    const timeline = await EmployerService.getApplicationTimeline('user-recruiter-1', 'app-1');

    expect(timeline.map(e => e.type)).toEqual([
      'OFFER_CREATED',
      'NOTE_ADDED',
      'STAGE_CHANGE',
      'INTERVIEW_SCHEDULED',
      'OFFER_EXTENDED'
    ]);
    for (let i = 1; i < timeline.length; i++) {
      expect(new Date(timeline[i].timestamp).getTime()).toBeGreaterThanOrEqual(new Date(timeline[i - 1].timestamp).getTime());
    }
  });

  it('rejects fetching the timeline for an application outside the caller company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.getApplicationTimelineSource.mockResolvedValue(null);

    await expect(EmployerService.getApplicationTimeline('user-recruiter-1', 'app-999')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'APPLICATION_NOT_FOUND'
    });
  });
});

describe('EmployerService saved filters', () => {
  beforeEach(() => vi.clearAllMocks());

  const SAVED = { id: 'filter-1', recruiterId: 'recruiter-1', name: 'Senior candidates', filters: { status: 'SHORTLISTED' } };

  it('scopes saved filters to the calling recruiter, not the company', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.getSavedFilters.mockResolvedValue([SAVED] as any);

    await EmployerService.getSavedFilters('user-recruiter-1');

    expect(mockedRepo.getSavedFilters).toHaveBeenCalledWith('recruiter-1');
  });

  it('creates a saved filter and audit-logs it', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.createSavedFilter.mockResolvedValue(SAVED as any);

    const result = await EmployerService.createSavedFilter('user-recruiter-1', 'Senior candidates', { status: 'SHORTLISTED' });

    expect(result).toEqual(SAVED);
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'SAVED_FILTER_CREATED' }) })
    );
  });

  it('rejects creating a saved filter with an empty name', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    await expect(EmployerService.createSavedFilter('user-recruiter-1', '  ', {})).rejects.toMatchObject({
      statusCode: 400,
      errorCode: 'INVALID_FILTER_NAME'
    });
  });

  it('rejects deleting a saved filter belonging to a different recruiter', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findSavedFilter.mockResolvedValue(null);

    await expect(EmployerService.deleteSavedFilter('user-recruiter-1', 'filter-999')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'SAVED_FILTER_NOT_FOUND'
    });
    expect(mockedRepo.deleteSavedFilter).not.toHaveBeenCalled();
  });

  it('deletes an owned saved filter and audit-logs it', async () => {
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
    mockedRepo.findSavedFilter.mockResolvedValue(SAVED as any);

    await EmployerService.deleteSavedFilter('user-recruiter-1', 'filter-1');

    expect(mockedRepo.deleteSavedFilter).toHaveBeenCalledWith('filter-1');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'SAVED_FILTER_DELETED' }) })
    );
  });
});
