import { logger } from '../../config/logger';
import { GeminiClient } from '../ai/gemini-client';
import { env } from '../../config/env';

export interface CareerInsightRoadmapStep {
  title: string;
  description: string;
}

export interface CareerInsightResult {
  readinessPercent: number;
  summary: string;
  whyThisScore: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendedProjects: string[];
  recommendedCourses: string[];
  recommendedInterviewTopics: string[];
  roadmap: CareerInsightRoadmapStep[];
  /** true when produced by the offline deterministic fallback rather than a live Gemini call. */
  estimated: boolean;
}

/**
 * CareerEngineClient: the Career Intelligence AI integration point. Routes
 * through the shared GeminiClient - see CLAUDE.md's AI Adapter Layer. When
 * GEMINI_API_KEY is unset, or a Gemini call fails, it falls back to
 * high-fidelity, dynamic mock-generation based on the student's skills and
 * target role.
 */
export class CareerEngineClient {
  static async generateInsight(
    targetRole: string,
    currentSkills: string[],
    resumeSummary: string | undefined,
    interviewHistorySummary: string | undefined,
    roleReferenceSkills: string[] = []
  ): Promise<CareerInsightResult> {
    const mock = () => this.mockGenerateInsight(targetRole, currentSkills, resumeSummary, interviewHistorySummary, roleReferenceSkills);
    if (!GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini') return mock();

    try {
      const prompt = `You are CareerBridge's AI career coach. Assess this student's readiness for their target role and return ONLY valid JSON: { readinessPercent: number (0-100), summary, whyThisScore, matchedSkills: string[], missingSkills: string[], recommendedProjects: string[], recommendedCourses: string[], recommendedInterviewTopics: string[], roadmap: [{ title, description }] }.

Target Role: ${targetRole}
Current Skills: ${currentSkills.join(', ') || 'None listed'}
Resume Summary: ${resumeSummary ?? 'Not available'}
Interview History Summary: ${interviewHistorySummary ?? 'No prior interviews'}`;

      const json = await GeminiClient.generateJSON<Omit<CareerInsightResult, 'estimated'>>(prompt, 'career-insight-v1');
      return { ...json, estimated: false };
    } catch (err) {
      logger.error({ err }, '[CAREER AI] Gemini career insight generation failed. Serving deterministic fallback.');
      return mock();
    }
  }

  private static mockGenerateInsight(
    targetRole: string,
    currentSkills: string[],
    resumeSummary: string | undefined,
    interviewHistorySummary: string | undefined,
    roleReferenceSkills: string[] = []
  ): CareerInsightResult {
    // Prefer real, data-derived role skills (most-required skills across
    // published jobs matching this role); only fall back to a generic list
    // when the platform has no matching postings to learn from.
    const genericDefault = ['React', 'TypeScript', 'Node.js', 'SQL', 'Git', 'REST APIs', 'Testing', 'Cloud (AWS/GCP/Azure)'];
    const targetSkills = roleReferenceSkills.length >= 3 ? roleReferenceSkills : genericDefault;
    const lowerCurrent = currentSkills.map(s => s.toLowerCase());
    const matchedSkills = targetSkills.filter(s => lowerCurrent.includes(s.toLowerCase()));
    const missingSkills = targetSkills.filter(s => !lowerCurrent.includes(s.toLowerCase()));

    let readinessPercent = 30 + matchedSkills.length * 8;
    if (resumeSummary) readinessPercent += 10;
    if (interviewHistorySummary) readinessPercent += 10;
    readinessPercent = Math.min(95, Math.max(15, readinessPercent));

    return {
      estimated: true,
      readinessPercent,
      summary: `Based on ${currentSkills.length} listed skills, readiness for "${targetRole}" is estimated at ${readinessPercent}%.`,
      whyThisScore: `Score reflects ${matchedSkills.length} of ${targetSkills.length} core skills matched, plus resume and interview history completeness.`,
      matchedSkills,
      missingSkills,
      recommendedProjects: missingSkills.slice(0, 3).map(s => `Build a project demonstrating ${s}.`),
      recommendedCourses: missingSkills.slice(0, 3).map(s => `Complete a course covering ${s}.`),
      recommendedInterviewTopics: targetSkills.slice(0, 5),
      roadmap: [
        { title: 'Strengthen core skills', description: `Focus on: ${missingSkills.slice(0, 3).join(', ') || 'refining existing strengths'}.` },
        { title: 'Build a portfolio project', description: `Create a project targeting the "${targetRole}" role.` },
        { title: 'Practice interviews', description: 'Complete at least one mock interview focused on this role.' }
      ]
    };
  }
}
