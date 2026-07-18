import { describe, it, expect, vi, beforeEach } from 'vitest';

// Coverage for the University service: verification uses the real
// VerificationStatus enum column (no more string-smuggling into
// preferredRole), ownership is re-verified before any mutation, and every
// mutating action writes an audit log entry.

vi.mock('../university.repository', () => ({
  UniversityRepository: {
    getDashboard: vi.fn(),
    getStudents: vi.fn(),
    findStudentInUniversity: vi.fn(),
    updateStudentStatus: vi.fn(),
    getAnalytics: vi.fn(),
    getPartnerCompanies: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    sendBroadcast: vi.fn(),
    getSentBroadcasts: vi.fn()
  }
}));

vi.mock('../campus-drive.service', () => ({
  CampusDriveService: {
    createDrive: vi.fn(),
    getDrives: vi.fn(),
    updateDrive: vi.fn(),
    deleteDrive: vi.fn()
  }
}));

vi.mock('../../ai/ai-orchestrator', () => ({
  AIOrchestrator: { runAnalysis: vi.fn() }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    auditLog: { create: vi.fn() },
    studentProfile: { findMany: vi.fn() },
    user: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    notification: { create: vi.fn(), createMany: vi.fn() },
    supportTicket: { create: vi.fn() }
  }
}));

import { UniversityService } from '../university.service';
import { UniversityRepository } from '../university.repository';
import { CampusDriveService } from '../campus-drive.service';
import { prisma } from '../../../config/database';
import { AppError } from '../../../utils/app-error';

const mockedRepo = vi.mocked(UniversityRepository);
const mockedDrive = vi.mocked(CampusDriveService);
const mockedPrisma = vi.mocked(prisma, true);

describe('UniversityService.verifyStudent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when the student does not belong to this university', async () => {
    mockedRepo.findStudentInUniversity.mockResolvedValue(null);

    await expect(
      UniversityService.verifyStudent('user-1', 'univ-1', 'student-1', 'VERIFIED' as any)
    ).rejects.toThrow(AppError);
    expect(mockedRepo.updateStudentStatus).not.toHaveBeenCalled();
  });

  it('updates status and writes an audit log entry when the student belongs to this university', async () => {
    mockedRepo.findStudentInUniversity.mockResolvedValue({ id: 'student-1', universityId: 'univ-1' } as any);
    mockedRepo.updateStudentStatus.mockResolvedValue({ id: 'student-1', verificationStatus: 'PLACEMENT_COMPLETED' } as any);

    const result = await UniversityService.verifyStudent('user-1', 'univ-1', 'student-1', 'PLACEMENT_COMPLETED' as any);

    expect(mockedRepo.updateStudentStatus).toHaveBeenCalledWith('student-1', 'PLACEMENT_COMPLETED');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'STUDENT_VERIFICATION_UPDATED' }) })
    );
    expect(result.verificationStatus).toBe('PLACEMENT_COMPLETED');
  });
});

describe('UniversityService placement drives', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a drive via CampusDriveService and audit-logs it', async () => {
    mockedDrive.createDrive.mockResolvedValue({ id: 'drive-1', universityId: 'univ-1' } as any);

    const result = await UniversityService.createDrive('user-1', 'univ-1', {
      title: 'Fall Recruiting Drive',
      description: 'Campus-wide recruiting event for graduating seniors.',
      location: 'Main Auditorium',
      scheduledAt: '2026-09-01T10:00:00.000Z',
      deadline: '2026-08-25T23:59:59.000Z'
    });

    expect(mockedDrive.createDrive).toHaveBeenCalledWith('univ-1', expect.objectContaining({ title: 'Fall Recruiting Drive' }));
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'PLACEMENT_DRIVE_CREATED' }) })
    );
    expect(result.id).toBe('drive-1');
  });

  it('propagates not-found errors from CampusDriveService.updateDrive', async () => {
    mockedDrive.updateDrive.mockRejectedValue(new AppError('Campus drive not found or unauthorized.', 404, 'DRIVE_NOT_FOUND'));

    await expect(
      UniversityService.updateDrive('user-1', 'univ-1', 'drive-x', { title: 'New Title' })
    ).rejects.toThrow(AppError);
  });

  it('deletes a drive and audit-logs it', async () => {
    mockedDrive.deleteDrive.mockResolvedValue({ deleted: true } as any);

    const result = await UniversityService.deleteDrive('user-1', 'univ-1', 'drive-1');

    expect(result).toEqual({ deleted: true });
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'PLACEMENT_DRIVE_DELETED' }) })
    );
  });
});

describe('UniversityService.getAnalytics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates to the repository for real computed analytics', async () => {
    mockedRepo.getAnalytics.mockResolvedValue({
      placementPercentage: 50,
      totalStudents: 10,
      studentsPlaced: 5,
      averageSalary: 95000,
      highestPackage: 140000,
      hiringTrends: [{ year: '2026', placements: 5 }],
      departmentBreakdown: []
    } as any);

    const result = await UniversityService.getAnalytics('univ-1');

    expect(mockedRepo.getAnalytics).toHaveBeenCalledWith('univ-1');
    expect(result.averageSalary).toBe(95000);
  });
});

describe('UniversityService.getPartnerCompanies', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates to the repository for real recruitment-derived company data', async () => {
    mockedRepo.getPartnerCompanies.mockResolvedValue([
      { id: 'company-1', name: 'Google', logoUrl: null, industry: 'Tech', website: null, applications: 12, hired: 2, openJobs: 1 }
    ] as any);

    const result = await UniversityService.getPartnerCompanies('univ-1');

    expect(mockedRepo.getPartnerCompanies).toHaveBeenCalledWith('univ-1');
    expect(result[0].name).toBe('Google');
  });
});

describe('UniversityService settings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when university profile does not exist', async () => {
    mockedRepo.getSettings.mockResolvedValue(null as any);
    await expect(UniversityService.getSettings('univ-x')).rejects.toThrow(AppError);
  });

  it('updates settings and writes an audit log entry', async () => {
    mockedRepo.updateSettings.mockResolvedValue({ id: 'univ-1', name: 'New Name' } as any);

    const result = await UniversityService.updateSettings('user-1', 'univ-1', { name: 'New Name' });

    expect(mockedRepo.updateSettings).toHaveBeenCalledWith('univ-1', { name: 'New Name' });
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'UNIVERSITY_SETTINGS_UPDATED' }) })
    );
    expect(result!.name).toBe('New Name');
  });
});

describe('UniversityService.sendBroadcast', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects when none of the recipients belong to this university', async () => {
    (mockedPrisma.studentProfile.findMany as any).mockResolvedValue([]);

    await expect(
      UniversityService.sendBroadcast('user-1', 'univ-1', ['user-outside'], 'Subject', 'Body')
    ).rejects.toThrow(AppError);
    expect(mockedRepo.sendBroadcast).not.toHaveBeenCalled();
  });

  it('filters out invalid recipients, sends to valid ones, and audit-logs the send', async () => {
    (mockedPrisma.studentProfile.findMany as any).mockResolvedValue([{ userId: 'user-2' }]);
    mockedRepo.sendBroadcast.mockResolvedValue({ recipientCount: 1, title: 'Subject', content: 'Body', sentAt: new Date() } as any);

    const result = await UniversityService.sendBroadcast('user-1', 'univ-1', ['user-2', 'user-outside'], 'Subject', 'Body');

    expect(mockedRepo.sendBroadcast).toHaveBeenCalledWith('user-1', ['user-2'], 'Subject', 'Body');
    expect(result.skipped).toBe(1);
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'UNIVERSITY_BROADCAST_SENT' }) })
    );
  });
});

describe('UniversityService.submitSupportRequest', () => {
  beforeEach(() => vi.clearAllMocks());

  it('audit-logs the request and notifies every admin when any exist', async () => {
    (mockedPrisma.user.findUnique as any).mockResolvedValue({ email: 'officer@university.edu', role: 'UNIVERSITY' });
    (mockedPrisma.user.findMany as any).mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);

    const result = await UniversityService.submitSupportRequest('user-1', 'Login issue', 'Cannot verify students.');

    expect(mockedPrisma.supportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subject: 'Login issue', requesterId: 'user-1' }) })
    );
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'SUPPORT_REQUEST_SUBMITTED' }) })
    );
    // Every admin gets notified, not just the first one found -- an on-call
    // admin who isn't first in the table should still see the ticket.
    expect(mockedPrisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ recipientId: 'admin-1' }),
          expect.objectContaining({ recipientId: 'admin-2' }),
        ])
      })
    );
    expect(result.submitted).toBe(true);
  });

  it('still succeeds when no admin user exists', async () => {
    (mockedPrisma.user.findUnique as any).mockResolvedValue({ email: 'officer@university.edu', role: 'UNIVERSITY' });
    (mockedPrisma.user.findMany as any).mockResolvedValue([]);

    const result = await UniversityService.submitSupportRequest('user-1', 'Subject', 'Message body here.');

    expect(mockedPrisma.notification.createMany).not.toHaveBeenCalled();
    expect(result.submitted).toBe(true);
  });
});
