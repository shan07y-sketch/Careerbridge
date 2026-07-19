import crypto from 'crypto';
import { ResumeRepository } from './resume.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { StorageService } from '../shared/storage.service';
import { SkillExtractionService } from './skill-extraction.service';
import { ResumeTextExtractionService } from './resume-text-extraction.service';
import { AppError } from '../../utils/app-error';

import { AIOrchestrator } from '../ai/ai-orchestrator';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const SHARE_LINK_LIFETIME_DAYS = 7;

export class ResumeService {
  /** Full version history (current + prior versions) for the "My Resumes" view. */
  static async getResumeHistory(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return ResumeRepository.getResumeHistory(profile.id);
  }

  static async getResumeDetail(userId: string, resumeId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const resume = await ResumeRepository.getResumeById(resumeId);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND');
    }
    return resume;
  }

  /**
   * Upload = new version. This is the core of the version-history
   * requirement: nothing is overwritten. The previous active resume is kept
   * (queryable, still downloadable) and simply marked inactive.
   */
  static async uploadResume(userId: string, file: Express.Multer.File) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const result = await StorageService.saveFile(file);
    const fileUrl = `${env.APP_BASE_URL}/uploads/${result.storagePath}`;
    const nextVersion = (await ResumeRepository.getHighestVersion(profile.id)) + 1;

    // Real text extraction from the uploaded PDF/DOCX. Falls back to
    // filename-only signal (status FAILED) for legacy .doc files or any
    // document that fails to parse -- see ResumeTextExtractionService for
    // the exact fallback conditions (scanned/image-only PDFs, corrupt
    // uploads, unsupported .doc binary format).
    const extraction = await ResumeTextExtractionService.extractText(file.buffer, file.mimetype);
    const skillSourceText = extraction.status === 'PARSED' ? extraction.text : file.originalname;

    // Skill-extraction interface: deterministic today (see
    // SkillExtractionService's own doc comment for the AI upgrade path).
    const { skills } = SkillExtractionService.extractSkills(skillSourceText);

    const resume = await ResumeRepository.createResumeVersion(profile.id, {
      fileName: result.fileName,
      fileUrl,
      version: nextVersion,
      fileSizeBytes: result.size,
      mimeType: result.mimeType,
      extractedSkills: skills,
      parsedText: extraction.status === 'PARSED' ? extraction.text : undefined,
      status: extraction.status
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RESUME_UPLOADED',
        details: JSON.stringify({ resumeId: resume.id, fileName: resume.fileName, version: resume.version })
      }
    });

    // AI analysis is best-effort: a provider outage must not fail the
    // upload itself (the file is already safely stored and versioned).
    // Only run it when real text was actually extracted -- analyzing a
    // filename-only fallback would produce a meaningless score, and that's
    // worse than no ResumeAnalysis row at all (the UI can distinguish
    // "no analysis yet" from "bad analysis").
    if (extraction.status === 'PARSED') {
      try {
        const aiResult = await AIOrchestrator.runAnalysis(
          userId,
          'resume-analysis-v1',
          'resume-analysis-v1',
          extraction.text
        );

        await prisma.resumeAnalysis.create({
          data: {
            studentProfileId: profile.id,
            resumeId: resume.id,
            summary: aiResult.summary,
            score: aiResult.score,
            status: 'PARSED',
            // Label offline/fallback analyses so nothing heuristic is shown as a live Gemini result.
            modelVersion: aiResult.__estimated ? 'resume-analysis-v1-estimated' : 'resume-analysis-v1'
          }
        });
      } catch (aiErr) {
        logger.error({ aiErr }, 'AI Resume analysis pipeline encountered a failure');
      }
    } else {
      logger.warn(
        { resumeId: resume.id },
        'Skipping AI resume analysis: no usable text was extracted from the uploaded file.'
      );
    }

    const saved = await ResumeRepository.getResumeById(resume.id);
    // Attach (not persist) why extraction failed, so the student sees an
    // actionable reason instead of a bare FAILED, and so the failure is
    // diagnosable in a deployed environment without log access.
    return extraction.error ? { ...saved, extractionError: extraction.error } : saved;
  }

  static async deleteResume(userId: string, id: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const resume = await ResumeRepository.getResumeById(id);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new AppError('Resume metadata not found or unauthorized.', 404, 'RESUME_NOT_FOUND');
    }

    const storagePath = StorageService.extractStoragePath(resume.fileUrl);
    if (storagePath) {
      await StorageService.deleteFile(storagePath);
    }

    const wasActive = resume.isActive;
    await ResumeRepository.deleteResume(id);

    // Deleting the current resume must not leave the student with zero
    // "active" resume if older versions still exist -- the most recent
    // remaining version becomes current automatically.
    if (wasActive) {
      await ResumeRepository.promoteMostRecentToActive(profile.id);
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RESUME_DELETED',
        details: JSON.stringify({ resumeId: id, fileName: resume.fileName, version: resume.version })
      }
    });
  }

  /** Streams the owner's own resume file back (used by the download button). */
  static async getDownloadTarget(userId: string, id: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const resume = await ResumeRepository.getResumeById(id);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND');
    }

    const absolutePath = ResumeService.resolveExistingFilePath(resume.fileUrl);

    await prisma.auditLog.create({
      data: { userId, action: 'RESUME_DOWNLOADED', details: JSON.stringify({ resumeId: id }) }
    });

    return { absolutePath, fileName: resume.fileName, mimeType: resume.mimeType || 'application/octet-stream' };
  }

  /** Generates (or rotates) a secure, time-limited public share link for the current resume. */
  static async createShareLink(userId: string, id: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const resume = await ResumeRepository.getResumeById(id);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND');
    }

    const shareToken = crypto.randomBytes(24).toString('hex');
    const shareExpiresAt = new Date();
    shareExpiresAt.setDate(shareExpiresAt.getDate() + SHARE_LINK_LIFETIME_DAYS);

    await ResumeRepository.setShareSettings(id, { shareToken, shareEnabled: true, shareExpiresAt });

    await prisma.auditLog.create({
      data: { userId, action: 'RESUME_SHARE_LINK_CREATED', details: JSON.stringify({ resumeId: id, expiresAt: shareExpiresAt }) }
    });

    return { shareUrl: `${env.APP_BASE_URL}/resume-share/${shareToken}`, shareExpiresAt };
  }

  static async revokeShareLink(userId: string, id: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const resume = await ResumeRepository.getResumeById(id);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND');
    }

    await ResumeRepository.setShareSettings(id, { shareToken: null, shareEnabled: false, shareExpiresAt: null });

    await prisma.auditLog.create({
      data: { userId, action: 'RESUME_SHARE_LINK_REVOKED', details: JSON.stringify({ resumeId: id }) }
    });
  }

  /** Public, unauthenticated resolution of a share token -- used by the /resume-share/:token route. */
  static async resolveSharedResume(token: string) {
    const resume = await ResumeRepository.getResumeByShareToken(token);
    if (!resume || !resume.shareEnabled) {
      throw new AppError('This share link is invalid or has been revoked.', 404, 'SHARE_LINK_INVALID');
    }
    if (resume.shareExpiresAt && resume.shareExpiresAt < new Date()) {
      throw new AppError('This share link has expired.', 410, 'SHARE_LINK_EXPIRED');
    }

    const absolutePath = ResumeService.resolveExistingFilePath(resume.fileUrl);

    await prisma.auditLog.create({
      data: { action: 'RESUME_SHARE_LINK_VIEWED', details: JSON.stringify({ resumeId: resume.id }) }
    });

    return { absolutePath, fileName: resume.fileName, mimeType: resume.mimeType || 'application/octet-stream' };
  }

  /**
   * Recruiter-facing access. Only authorized if the resume's owner has
   * actually applied to a job at the requesting recruiter's company --
   * without this check, any employer could view/download any candidate's
   * resume by id, which was the exact gap the Phase 0 audit flagged.
   */
  static async getRecruiterAccessTarget(recruiterUserId: string, companyId: string, resumeId: string) {
    const resume = await ResumeRepository.getResumeById(resumeId);
    if (!resume) {
      throw new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND');
    }

    const authorized = await ResumeRepository.isResumeOwnerApplicantOfCompany(resume.studentProfileId, companyId);
    if (!authorized) {
      throw new AppError('This candidate has not applied to a role at your company.', 403, 'FORBIDDEN');
    }

    const absolutePath = ResumeService.resolveExistingFilePath(resume.fileUrl);

    await prisma.auditLog.create({
      data: {
        userId: recruiterUserId,
        action: 'RESUME_VIEWED_BY_RECRUITER',
        details: JSON.stringify({ resumeId, companyId })
      }
    });

    return { absolutePath, fileName: resume.fileName, mimeType: resume.mimeType || 'application/octet-stream', resume };
  }

  private static resolveExistingFilePath(fileUrl: string): string {
    const storagePath = StorageService.extractStoragePath(fileUrl);
    if (!storagePath || !StorageService.fileExists(storagePath)) {
      throw new AppError('The resume file could not be located in storage.', 404, 'FILE_NOT_FOUND');
    }
    return StorageService.getAbsolutePath(storagePath);
  }
}
