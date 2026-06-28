import { ResumeRepository } from './resume.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { StorageService } from '../shared/storage.service';
import { AppError } from '../../utils/app-error';

import { AIOrchestrator } from '../ai/ai-orchestrator';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class ResumeService {
  static async getResumes(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return ResumeRepository.getResumes(profile.id);
  }

  static async uploadResume(userId: string, file: Express.Multer.File) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const result = await StorageService.saveFile(file);
    const mockUrl = `http://localhost:5000/uploads/${result.storagePath}`;

    const resume = await ResumeRepository.createResume(profile.id, {
      fileName: result.fileName,
      fileUrl: mockUrl
    });

    try {
      const aiResult = await AIOrchestrator.runAnalysis(
        userId,
        'resume-analysis-v1',
        'resume-analysis-v1',
        `Parsed text contents of uploaded file ${result.fileName}`
      );

      await prisma.resumeAnalysis.create({
        data: {
          studentProfileId: profile.id,
          resumeId: resume.id,
          summary: aiResult.summary,
          score: aiResult.score,
          status: 'PARSED',
          modelVersion: 'resume-analysis-v1'
        }
      });
    } catch (aiErr) {
      logger.error({ aiErr }, 'AI Resume analysis pipeline encountered a failure');
    }

    return resume;
  }

  static async deleteResume(userId: string, id: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const resume = await ResumeRepository.getResumeById(id);
    if (!resume || resume.studentProfileId !== profile.id) {
      throw new AppError('Resume metadata not found or unauthorized.', 404, 'RESUME_NOT_FOUND');
    }

    const storagePath = resume.fileUrl.split('/uploads/')[1];
    if (storagePath) {
      await StorageService.deleteFile(storagePath);
    }

    await ResumeRepository.deleteResume(id);
  }
}
