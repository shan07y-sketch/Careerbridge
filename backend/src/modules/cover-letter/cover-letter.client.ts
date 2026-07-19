import { logger } from '../../config/logger';
import { GeminiClient } from '../ai/gemini-client';
import { env } from '../../config/env';

/** Voice presets a student can pick before generating. */
export const COVER_LETTER_TONES = ['PROFESSIONAL', 'ENTHUSIASTIC', 'CONCISE', 'ACADEMIC'] as const;
export type CoverLetterTone = (typeof COVER_LETTER_TONES)[number];

export interface CoverLetterContext {
  studentName: string;
  targetRole: string;
  companyName: string;
  tone: CoverLetterTone;
  currentSkills: string[];
  /** Requirements/description of the specific posting, when generated from a job. */
  jobDescription?: string;
  jobRequirements?: string;
  resumeSummary?: string;
  /** Most relevant prior experience, pre-summarised by the service. */
  experienceSummary?: string;
}

export interface CoverLetterResult {
  content: string;
  /** Points the letter leans on, surfaced in the UI so the student can sanity-check. */
  highlights: string[];
  /** true when produced by the offline deterministic fallback rather than a live Gemini call. */
  estimated: boolean;
}

const TONE_GUIDANCE: Record<CoverLetterTone, string> = {
  PROFESSIONAL: 'Measured and businesslike. Confident without being boastful.',
  ENTHUSIASTIC: 'Warm and energetic, showing genuine excitement, while staying credible.',
  CONCISE: 'Tight and direct. Three short paragraphs at most, no filler.',
  ACADEMIC: 'Formal and precise, suited to research or academic-adjacent roles.'
};

/**
 * CoverLetterEngineClient: the Cover Letter AI integration point. Routes
 * through the shared GeminiClient - see CLAUDE.md's AI Adapter Layer -
 * following the same live/fallback contract as CareerEngineClient, so the
 * caller never has to care which produced the result beyond `estimated`.
 */
export class CoverLetterEngineClient {
  static async generate(ctx: CoverLetterContext): Promise<CoverLetterResult> {
    const mock = () => this.mockGenerate(ctx);
    if (!GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini') return mock();

    try {
      const prompt = `You are CareerBridge's AI writing assistant. Write a cover letter for this student and return ONLY valid JSON: { "content": string, "highlights": string[] }.

Rules:
- "content" is the letter body only. Do NOT include a date, postal addresses, or a "Dear Hiring Manager" style salutation placeholder with brackets - address it to the hiring team at the company.
- Ground every claim in the student's actual skills and experience below. Never invent employers, degrees, dates, or metrics.
- Reference the specific role and company by name.
- 250-400 words unless the tone calls for shorter.
- "highlights" is 3-5 short strings naming the concrete points the letter leans on.

Tone: ${ctx.tone} - ${TONE_GUIDANCE[ctx.tone]}

Student Name: ${ctx.studentName}
Target Role: ${ctx.targetRole}
Company: ${ctx.companyName}
Student Skills: ${ctx.currentSkills.join(', ') || 'None listed'}
Resume Summary: ${ctx.resumeSummary ?? 'Not available'}
Relevant Experience: ${ctx.experienceSummary ?? 'No prior experience recorded'}
Job Description: ${ctx.jobDescription ?? 'Not provided'}
Job Requirements: ${ctx.jobRequirements ?? 'Not provided'}`;

      const json = await GeminiClient.generateJSON<{ content: string; highlights?: string[] }>(prompt, 'cover-letter-v1');
      if (!json.content || !json.content.trim()) {
        throw new Error('Gemini returned an empty cover letter body.');
      }
      return { content: json.content.trim(), highlights: json.highlights ?? [], estimated: false };
    } catch (err) {
      logger.error({ err }, '[COVER LETTER AI] Gemini generation failed. Serving deterministic fallback.');
      return mock();
    }
  }

  /**
   * Offline fallback. Deliberately conservative: it assembles a correct,
   * sendable letter from real profile data rather than inventing narrative,
   * because a plausible-but-fabricated letter is worse than a plain one.
   */
  private static mockGenerate(ctx: CoverLetterContext): CoverLetterResult {
    const topSkills = ctx.currentSkills.slice(0, 6);
    const skillSentence = topSkills.length
      ? `My strongest areas are ${topSkills.slice(0, -1).join(', ')}${topSkills.length > 1 ? ` and ${topSkills[topSkills.length - 1]}` : topSkills[0]}.`
      : 'I am building my technical foundation across the areas this role calls for.';

    const experienceSentence = ctx.experienceSummary
      ? `Most recently, ${ctx.experienceSummary}`
      : 'I have focused on coursework and self-directed projects to build practical experience.';

    const content = [
      `Dear Hiring Team at ${ctx.companyName},`,
      '',
      `I am writing to apply for the ${ctx.targetRole} position at ${ctx.companyName}. The role aligns closely with the direction I am building my career in, and I would welcome the chance to contribute.`,
      '',
      `${skillSentence} ${experienceSentence}`,
      '',
      ctx.resumeSummary
        ? `My background is summarised as follows: ${ctx.resumeSummary}`
        : 'My attached resume gives a fuller picture of my background.',
      '',
      `Thank you for considering my application. I would be glad to discuss how I could support the team at ${ctx.companyName}.`,
      '',
      'Sincerely,',
      ctx.studentName
    ].join('\n');

    return {
      content,
      highlights: topSkills.length ? topSkills.slice(0, 4).map(s => `Demonstrated skill: ${s}`) : ['Profile-based draft'],
      estimated: true
    };
  }
}
