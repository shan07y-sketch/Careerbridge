import { logger } from '../../config/logger';
import { GeminiClient } from '../ai/gemini-client';
import { env } from '../../config/env';

/**
 * EmployerAIEngineClient: the Employer AI integration point (candidate
 * evaluation and comparison). Routes through the shared GeminiClient - see
 * CLAUDE.md's AI Adapter Layer. When GEMINI_API_KEY is unset, or a Gemini
 * call fails, it falls back to high-fidelity, dynamic mock-generation based
 * on the job requirements and candidate skills.
 */

export interface CandidateEvaluationResult {
  fitScore: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  skillsMatch: string[];
  skillsGap: string[];
  interviewSignal: string | null;
  estimated: boolean;
}

export interface CandidateForComparison {
  candidateId: string;
  name?: string;
  skills: string[];
  resumeSummary?: string | null;
  interviewHistorySummary?: string | null;
}

export interface CandidateRanking {
  candidateId: string;
  rank: number;
  fitScore: number;
  summary: string;
}

export interface CandidateComparisonResult {
  rankings: CandidateRanking[];
  overallRecommendation: string;
  estimated: boolean;
}

export class EmployerAIEngineClient {
  static async evaluateCandidate(
    jobTitle: string,
    jobDescription: string,
    jobRequirements: string,
    candidateSkills: string[],
    resumeSummary: string | undefined,
    interviewHistorySummary: string | undefined
  ): Promise<CandidateEvaluationResult> {
    const mock = () => this.mockEvaluateCandidate(jobTitle, jobDescription, jobRequirements, candidateSkills, resumeSummary, interviewHistorySummary);
    if (!GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini') return mock();

    try {
      const prompt = `You are CareerBridge's recruiting analyst. Evaluate this candidate's fit for the role below and return ONLY valid JSON: { fitScore: number (0-100), recommendation ("Strong Fit"|"Good Fit"|"Possible Fit"|"Not a Fit"), summary, strengths: string[], concerns: string[], skillsMatch: string[], skillsGap: string[], interviewSignal: string|null }.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Job Requirements: ${jobRequirements}
Candidate Skills: ${candidateSkills.join(', ') || 'None listed'}
Resume Summary: ${resumeSummary ?? 'Not available'}
Interview History Summary: ${interviewHistorySummary ?? 'No prior interviews'}`;

      const json = await GeminiClient.generateJSON<Omit<CandidateEvaluationResult, 'estimated'>>(prompt, 'employer-candidate-evaluation-v1');
      return { ...json, estimated: false };
    } catch (err) {
      logger.error({ err }, '[EMPLOYER AI] Gemini candidate evaluation failed. Serving deterministic fallback.');
      return mock();
    }
  }

  static async compareCandidates(
    jobTitle: string,
    jobDescription: string,
    jobRequirements: string,
    candidates: CandidateForComparison[]
  ): Promise<CandidateComparisonResult> {
    const mock = () => this.mockCompareCandidates(jobTitle, jobDescription, jobRequirements, candidates);
    if (!GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini') return mock();

    try {
      const prompt = `You are CareerBridge's recruiting analyst. Rank the following candidates for this role and return ONLY valid JSON: { rankings: [{ candidateId, rank: number (1 = best), fitScore: number (0-100), summary }], overallRecommendation }.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Job Requirements: ${jobRequirements}
Candidates: ${JSON.stringify(candidates)}`;

      const json = await GeminiClient.generateJSON<Omit<CandidateComparisonResult, 'estimated'>>(prompt, 'employer-candidate-comparison-v1');
      return { ...json, estimated: false };
    } catch (err) {
      logger.error({ err }, '[EMPLOYER AI] Gemini compare candidates failed. Serving deterministic fallback.');
      return mock();
    }
  }

  // --- Deterministic mock fallbacks -------------------------------------

  private static mockEvaluateCandidate(
    jobTitle: string,
    jobDescription: string,
    jobRequirements: string,
    candidateSkills: string[],
    resumeSummary: string | undefined,
    interviewHistorySummary: string | undefined
  ): CandidateEvaluationResult {
    const reqText = `${jobDescription} ${jobRequirements}`.toLowerCase();
    const matched = candidateSkills.filter(s => reqText.includes(s.toLowerCase()));
    const gap = candidateSkills.length > 0 ? [] : ['No skills listed on candidate profile.'];
    const fitScore = Math.min(96, Math.max(35, 40 + matched.length * 10));
    const recommendation = fitScore >= 80 ? 'Strong Fit' : fitScore >= 60 ? 'Good Fit' : fitScore >= 45 ? 'Possible Fit' : 'Not a Fit';

    return {
      estimated: true,
      fitScore,
      recommendation,
      summary: `Candidate matches ${matched.length} of ${candidateSkills.length || 0} listed skills against the "${jobTitle}" requirements.`,
      strengths: matched.length > 0 ? matched.slice(0, 5) : ['Profile is complete and ready for review.'],
      concerns: gap.length > 0 ? gap : matched.length === 0 ? ['No direct skill overlap detected with job requirements.'] : [],
      skillsMatch: matched,
      skillsGap: candidateSkills.filter(s => !matched.includes(s)),
      interviewSignal: interviewHistorySummary ? 'Prior interview history available for additional context.' : null
    };
  }

  private static mockCompareCandidates(
    jobTitle: string,
    jobDescription: string,
    jobRequirements: string,
    candidates: CandidateForComparison[]
  ): CandidateComparisonResult {
    const reqText = `${jobDescription} ${jobRequirements}`.toLowerCase();
    const scored = candidates.map(c => {
      const matched = c.skills.filter(s => reqText.includes(s.toLowerCase()));
      const fitScore = Math.min(96, Math.max(35, 40 + matched.length * 10));
      return { candidate: c, fitScore, matched };
    });
    scored.sort((a, b) => b.fitScore - a.fitScore);

    return {
      estimated: true,
      rankings: scored.map((s, idx) => ({
        candidateId: s.candidate.candidateId,
        rank: idx + 1,
        fitScore: s.fitScore,
        summary: `Matches ${s.matched.length} of ${s.candidate.skills.length} listed skills against "${jobTitle}".`
      })),
      overallRecommendation:
        scored.length > 0
          ? `${scored[0].candidate.name ?? scored[0].candidate.candidateId} shows the strongest overall fit for this role.`
          : 'No candidates available for comparison.'
    };
  }
}
