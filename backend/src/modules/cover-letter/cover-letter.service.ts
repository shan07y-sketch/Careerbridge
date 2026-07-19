import { CoverLetterRepository } from './cover-letter.repository';
import { CoverLetterEngineClient, COVER_LETTER_TONES, CoverLetterTone } from './cover-letter.client';
import { ProfileRepository } from '../profile/profile.repository';
import { AppError } from '../../utils/app-error';
import { prisma } from '../../config/database';

const MODEL_VERSION = 'cover-letter-v1';

export class CoverLetterService {
  private static async requireProfile(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return profile;
  }

  static async list(userId: string) {
    const profile = await this.requireProfile(userId);
    return CoverLetterRepository.list(profile.id);
  }

  static async getById(userId: string, id: string) {
    const profile = await this.requireProfile(userId);
    const letter = await CoverLetterRepository.findById(id, profile.id);
    if (!letter) throw new AppError('Cover letter not found.', 404, 'NOT_FOUND');
    return letter;
  }

  static async delete(userId: string, id: string) {
    const profile = await this.requireProfile(userId);
    const deleted = await CoverLetterRepository.delete(id, profile.id);
    if (!deleted) throw new AppError('Cover letter not found.', 404, 'NOT_FOUND');
    return { id };
  }

  /**
   * Generates a letter either for a real posting (jobId) or a free-form
   * role/company pair. Job-derived role and company always win over
   * client-supplied values, so a student cannot address a letter to one
   * company while it claims to target another posting.
   */
  static async generate(
    userId: string,
    input: { jobId?: string; targetRole?: string; companyName?: string; tone?: string }
  ) {
    const profile = await this.requireProfile(userId);

    const tone = (input.tone ?? 'PROFESSIONAL').toUpperCase() as CoverLetterTone;
    if (!COVER_LETTER_TONES.includes(tone)) {
      throw new AppError(`Tone must be one of: ${COVER_LETTER_TONES.join(', ')}.`, 400, 'VALIDATION_ERROR');
    }

    let targetRole = input.targetRole?.trim();
    let companyName = input.companyName?.trim();
    let jobDescription: string | undefined;
    let jobRequirements: string | undefined;
    let jobId: string | null = null;

    if (input.jobId) {
      const job = await CoverLetterRepository.getJobContext(input.jobId);
      if (!job) throw new AppError('Job not found.', 404, 'JOB_NOT_FOUND');
      jobId = job.id;
      targetRole = job.title;
      companyName = job.company?.name ?? companyName ?? 'the company';
      jobDescription = job.description;
      jobRequirements = job.requirements;
    }

    if (!targetRole) {
      throw new AppError('A target role (or a jobId) is required to generate a cover letter.', 400, 'VALIDATION_ERROR');
    }
    if (!companyName) {
      throw new AppError('A company name (or a jobId) is required to generate a cover letter.', 400, 'VALIDATION_ERROR');
    }

    const ctx = await CoverLetterRepository.getGenerationContext(profile.id);

    const currentSkills = (ctx?.skills ?? []).map(s => s.skill.name);

    const latestAnalysis = ctx?.resumes?.[0]?.resumeAnalyses?.[0];
    const resumeSummary = latestAnalysis
      ? `ATS score: ${latestAnalysis.score}/100. ${latestAnalysis.summary}`
      : ctx?.resumes?.length
        ? 'A resume is on file but has not yet been AI-analyzed.'
        : undefined;

    const experienceSummary = ctx?.experienceHistory?.length
      ? ctx.experienceHistory
          .map(e => `${e.roleTitle} at ${e.companyName}${e.isCurrent ? ' (current)' : ''}${e.description ? ` - ${e.description}` : ''}`)
          .join('; ')
      : undefined;

    const studentName = [ctx?.firstName, ctx?.lastName].filter(Boolean).join(' ') || 'the applicant';

    const result = await CoverLetterEngineClient.generate({
      studentName,
      targetRole,
      companyName,
      tone,
      currentSkills,
      jobDescription,
      jobRequirements,
      resumeSummary,
      experienceSummary
    });

    const letter = await CoverLetterRepository.create(profile.id, {
      jobId,
      targetRole,
      companyName,
      tone,
      content: result.content,
      // Label fallback output so the UI never presents a heuristic as live AI.
      modelVersion: result.estimated ? `${MODEL_VERSION}-estimated` : MODEL_VERSION
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'COVER_LETTER_GENERATED',
        details: JSON.stringify({ coverLetterId: letter.id, targetRole, companyName, tone, estimated: result.estimated })
      }
    });

    return { ...letter, highlights: result.highlights, estimated: result.estimated };
  }
}
