import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for the Resume Workflow rewrite: version history is
// additive (nothing overwritten), delete promotes the next-most-recent
// version to active, owner-only download/share operations are enforced,
// share links respect enabled/expiry, and -- the authorization bug the
// Phase 0 audit flagged -- recruiter access requires the candidate to have
// actually applied to that recruiter's company.

vi.mock('../resume.repository', () => ({
  ResumeRepository: {
    getResumeHistory: vi.fn(),
    getActiveResume: vi.fn(),
    getResumeById: vi.fn(),
    getResumeByShareToken: vi.fn(),
    getHighestVersion: vi.fn(),
    createResumeVersion: vi.fn(),
    deleteResume: vi.fn(),
    promoteMostRecentToActive: vi.fn(),
    setShareSettings: vi.fn(),
    isResumeOwnerApplicantOfCompany: vi.fn()
  }
}));

vi.mock('../../profile/profile.repository', () => ({
  ProfileRepository: {
    getStudentProfile: vi.fn()
  }
}));

vi.mock('../../shared/storage.service', () => ({
  StorageService: {
    saveFile: vi.fn(),
    deleteFile: vi.fn(),
    getAbsolutePath: vi.fn(),
    fileExists: vi.fn(),
    extractStoragePath: vi.fn()
  }
}));

vi.mock('../skill-extraction.service', () => ({
  SkillExtractionService: {
    extractSkills: vi.fn(() => ({ skills: ['React', 'TypeScript'], method: 'keyword-match-v1' }))
  }
}));

vi.mock('../resume-text-extraction.service', () => ({
  ResumeTextExtractionService: {
    extractText: vi.fn(() => Promise.resolve({ text: 'Experienced React and TypeScript engineer...', status: 'PARSED' }))
  }
}));

vi.mock('../../ai/ai-orchestrator', () => ({
  AIOrchestrator: {
    runAnalysis: vi.fn()
  }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    auditLog: { create: vi.fn() },
    resumeAnalysis: { create: vi.fn() }
  }
}));

vi.mock('../../../config/env', () => ({
  env: { APP_BASE_URL: 'http://localhost:5000' }
}));

import { ResumeService } from '../resume.service';
import { ResumeRepository } from '../resume.repository';
import { ProfileRepository } from '../../profile/profile.repository';
import { StorageService } from '../../shared/storage.service';
import { AIOrchestrator } from '../../ai/ai-orchestrator';
import { ResumeTextExtractionService } from '../resume-text-extraction.service';
import { prisma } from '../../../config/database';

const mockedResumeRepo = vi.mocked(ResumeRepository);
const mockedProfileRepo = vi.mocked(ProfileRepository);
const mockedStorage = vi.mocked(StorageService);
const mockedAI = vi.mocked(AIOrchestrator);
const mockedExtraction = vi.mocked(ResumeTextExtractionService);
const mockedPrisma = vi.mocked(prisma, true);

const PROFILE = { id: 'profile-1', userId: 'user-1' };

describe('ResumeService.uploadResume', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new version rather than overwriting, and audit-logs the upload', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedStorage.saveFile.mockResolvedValue({
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      storagePath: '123_resume.pdf'
    } as any);
    mockedResumeRepo.getHighestVersion.mockResolvedValue(2);
    mockedResumeRepo.createResumeVersion.mockResolvedValue({ id: 'resume-3', version: 3, fileName: 'resume.pdf' } as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-3', version: 3 } as any);
    mockedAI.runAnalysis.mockResolvedValue({ summary: 'Looks solid', score: 80 } as any);

    const file = { originalname: 'resume.pdf', buffer: Buffer.from('%PDF'), mimetype: 'application/pdf', size: 1024 } as any;
    const result = await ResumeService.uploadResume('user-1', file);

    expect(mockedResumeRepo.createResumeVersion).toHaveBeenCalledWith(
      PROFILE.id,
      expect.objectContaining({ version: 3, extractedSkills: ['React', 'TypeScript'] })
    );
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'RESUME_UPLOADED' }) })
    );
    expect(result).toEqual({ id: 'resume-3', version: 3 });
  });

  it('does not fail the upload if the AI analysis pipeline throws', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedStorage.saveFile.mockResolvedValue({
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      storagePath: '123_resume.pdf'
    } as any);
    mockedResumeRepo.getHighestVersion.mockResolvedValue(0);
    mockedResumeRepo.createResumeVersion.mockResolvedValue({ id: 'resume-1', version: 1, fileName: 'resume.pdf' } as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-1', version: 1 } as any);
    mockedAI.runAnalysis.mockRejectedValue(new Error('provider outage'));

    const file = { originalname: 'resume.pdf', buffer: Buffer.from('%PDF'), mimetype: 'application/pdf', size: 1024 } as any;
    await expect(ResumeService.uploadResume('user-1', file)).resolves.toEqual({ id: 'resume-1', version: 1 });
  });

  it('rejects when the student profile does not exist', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(null);
    const file = { originalname: 'resume.pdf' } as any;

    await expect(ResumeService.uploadResume('user-x', file)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'PROFILE_NOT_FOUND'
    });
  });

  it('skips AI analysis entirely when text extraction fails (e.g. scanned/image-only PDF)', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedStorage.saveFile.mockResolvedValue({
      fileName: 'scanned.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      storagePath: '123_scanned.pdf'
    } as any);
    mockedResumeRepo.getHighestVersion.mockResolvedValue(0);
    mockedResumeRepo.createResumeVersion.mockResolvedValue({ id: 'resume-1', version: 1, fileName: 'scanned.pdf' } as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-1', version: 1 } as any);
    mockedExtraction.extractText.mockResolvedValueOnce({ text: '', status: 'FAILED' });

    const file = { originalname: 'scanned.pdf', buffer: Buffer.from('%PDF'), mimetype: 'application/pdf', size: 1024 } as any;
    await ResumeService.uploadResume('user-1', file);

    expect(mockedResumeRepo.createResumeVersion).toHaveBeenCalledWith(
      PROFILE.id,
      expect.objectContaining({ status: 'FAILED', parsedText: undefined })
    );
    expect(mockedAI.runAnalysis).not.toHaveBeenCalled();
    expect(mockedPrisma.resumeAnalysis.create).not.toHaveBeenCalled();
  });
});

describe('ResumeService.deleteResume', () => {
  beforeEach(() => vi.clearAllMocks());

  it('promotes the next-most-recent version to active when deleting the active resume', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({
      id: 'resume-3',
      studentProfileId: PROFILE.id,
      isActive: true,
      fileUrl: 'http://localhost:5000/uploads/123_resume.pdf',
      fileName: 'resume.pdf',
      version: 3
    } as any);
    mockedStorage.extractStoragePath.mockReturnValue('123_resume.pdf');

    await ResumeService.deleteResume('user-1', 'resume-3');

    expect(mockedStorage.deleteFile).toHaveBeenCalledWith('123_resume.pdf');
    expect(mockedResumeRepo.deleteResume).toHaveBeenCalledWith('resume-3');
    expect(mockedResumeRepo.promoteMostRecentToActive).toHaveBeenCalledWith(PROFILE.id);
  });

  it('does not promote anything when deleting a non-active older version', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({
      id: 'resume-1',
      studentProfileId: PROFILE.id,
      isActive: false,
      fileUrl: 'http://localhost:5000/uploads/old_resume.pdf',
      fileName: 'resume.pdf',
      version: 1
    } as any);
    mockedStorage.extractStoragePath.mockReturnValue('old_resume.pdf');

    await ResumeService.deleteResume('user-1', 'resume-1');

    expect(mockedResumeRepo.promoteMostRecentToActive).not.toHaveBeenCalled();
  });

  it('rejects deleting a resume that belongs to someone else', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-9', studentProfileId: 'someone-else' } as any);

    await expect(ResumeService.deleteResume('user-1', 'resume-9')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'RESUME_NOT_FOUND'
    });
    expect(mockedResumeRepo.deleteResume).not.toHaveBeenCalled();
  });
});

describe('ResumeService.getDownloadTarget', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects downloading a resume owned by another student', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-9', studentProfileId: 'someone-else' } as any);

    await expect(ResumeService.getDownloadTarget('user-1', 'resume-9')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'RESUME_NOT_FOUND'
    });
  });

  it('returns the resolved file path and audit-logs the download for the owner', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({
      id: 'resume-1',
      studentProfileId: PROFILE.id,
      fileUrl: 'http://localhost:5000/uploads/resume.pdf',
      fileName: 'resume.pdf',
      mimeType: 'application/pdf'
    } as any);
    mockedStorage.extractStoragePath.mockReturnValue('resume.pdf');
    mockedStorage.fileExists.mockReturnValue(true);
    mockedStorage.getAbsolutePath.mockReturnValue('/data/uploads/resume.pdf');

    const target = await ResumeService.getDownloadTarget('user-1', 'resume-1');

    expect(target).toEqual({ absolutePath: '/data/uploads/resume.pdf', fileName: 'resume.pdf', mimeType: 'application/pdf' });
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'RESUME_DOWNLOADED' }) })
    );
  });

  it('throws if the file is missing from storage', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({
      id: 'resume-1',
      studentProfileId: PROFILE.id,
      fileUrl: 'http://localhost:5000/uploads/resume.pdf',
      fileName: 'resume.pdf'
    } as any);
    mockedStorage.extractStoragePath.mockReturnValue('resume.pdf');
    mockedStorage.fileExists.mockReturnValue(false);

    await expect(ResumeService.getDownloadTarget('user-1', 'resume-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'FILE_NOT_FOUND'
    });
  });
});

describe('ResumeService share links', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a share link with a future expiry and audit-logs it', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-1', studentProfileId: PROFILE.id } as any);

    const result = await ResumeService.createShareLink('user-1', 'resume-1');

    expect(result.shareUrl).toMatch(/^http:\/\/localhost:5000\/resume-share\/[a-f0-9]{48}$/);
    expect(result.shareExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(mockedResumeRepo.setShareSettings).toHaveBeenCalledWith(
      'resume-1',
      expect.objectContaining({ shareEnabled: true })
    );
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'RESUME_SHARE_LINK_CREATED' }) })
    );
  });

  it('revokes a share link by clearing the token and disabling it', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-1', studentProfileId: PROFILE.id } as any);

    await ResumeService.revokeShareLink('user-1', 'resume-1');

    expect(mockedResumeRepo.setShareSettings).toHaveBeenCalledWith('resume-1', {
      shareToken: null,
      shareEnabled: false,
      shareExpiresAt: null
    });
  });

  it('rejects resolving a share token that is disabled', async () => {
    mockedResumeRepo.getResumeByShareToken.mockResolvedValue({ id: 'resume-1', shareEnabled: false } as any);

    await expect(ResumeService.resolveSharedResume('sometoken')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'SHARE_LINK_INVALID'
    });
  });

  it('rejects resolving an expired share token', async () => {
    mockedResumeRepo.getResumeByShareToken.mockResolvedValue({
      id: 'resume-1',
      shareEnabled: true,
      shareExpiresAt: new Date(Date.now() - 1000)
    } as any);

    await expect(ResumeService.resolveSharedResume('sometoken')).rejects.toMatchObject({
      statusCode: 410,
      errorCode: 'SHARE_LINK_EXPIRED'
    });
  });

  it('resolves a valid, unexpired share token and audit-logs the view', async () => {
    mockedResumeRepo.getResumeByShareToken.mockResolvedValue({
      id: 'resume-1',
      shareEnabled: true,
      shareExpiresAt: new Date(Date.now() + 100000),
      fileUrl: 'http://localhost:5000/uploads/resume.pdf',
      fileName: 'resume.pdf',
      mimeType: 'application/pdf'
    } as any);
    mockedStorage.extractStoragePath.mockReturnValue('resume.pdf');
    mockedStorage.fileExists.mockReturnValue(true);
    mockedStorage.getAbsolutePath.mockReturnValue('/data/uploads/resume.pdf');

    const target = await ResumeService.resolveSharedResume('sometoken');

    expect(target.fileName).toBe('resume.pdf');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'RESUME_SHARE_LINK_VIEWED' }) })
    );
  });
});

describe('ResumeService.getRecruiterAccessTarget', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks a recruiter viewing a candidate who never applied to their company', async () => {
    mockedResumeRepo.getResumeById.mockResolvedValue({ id: 'resume-1', studentProfileId: PROFILE.id } as any);
    mockedResumeRepo.isResumeOwnerApplicantOfCompany.mockResolvedValue(false);

    await expect(ResumeService.getRecruiterAccessTarget('recruiter-user-1', 'company-1', 'resume-1')).rejects.toMatchObject({
      statusCode: 403,
      errorCode: 'FORBIDDEN'
    });
  });

  it('allows a recruiter to view a resume from a candidate who applied to their company, and audit-logs it', async () => {
    mockedResumeRepo.getResumeById.mockResolvedValue({
      id: 'resume-1',
      studentProfileId: PROFILE.id,
      fileUrl: 'http://localhost:5000/uploads/resume.pdf',
      fileName: 'resume.pdf',
      mimeType: 'application/pdf'
    } as any);
    mockedResumeRepo.isResumeOwnerApplicantOfCompany.mockResolvedValue(true);
    mockedStorage.extractStoragePath.mockReturnValue('resume.pdf');
    mockedStorage.fileExists.mockReturnValue(true);
    mockedStorage.getAbsolutePath.mockReturnValue('/data/uploads/resume.pdf');

    const target = await ResumeService.getRecruiterAccessTarget('recruiter-user-1', 'company-1', 'resume-1');

    expect(target.fileName).toBe('resume.pdf');
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'RESUME_VIEWED_BY_RECRUITER' }) })
    );
  });

  it('rejects when the resume does not exist at all', async () => {
    mockedResumeRepo.getResumeById.mockResolvedValue(null);

    await expect(ResumeService.getRecruiterAccessTarget('recruiter-user-1', 'company-1', 'nope')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'RESUME_NOT_FOUND'
    });
  });
});
