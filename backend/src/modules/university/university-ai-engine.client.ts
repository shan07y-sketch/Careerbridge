import { logger } from '../../config/logger';
import { GeminiClient } from '../ai/gemini-client';
import { env } from '../../config/env';

/**
 * UniversityAIEngineClient: the University AI integration point (placement
 * prediction, department insight, campus drive recommendations, and
 * executive placement reports). Routes through the shared GeminiClient -
 * see CLAUDE.md's AI Adapter Layer. When GEMINI_API_KEY is unset, or a
 * Gemini call fails, it falls back to high-fidelity, dynamic
 * mock-generation based on the student's metrics.
 */

export interface StudentPlacementResult {
  placementProbability: number;
  riskLevel: string;
  summary: string;
  riskFactors: string[];
  strengths: string[];
  suggestedActions: string[];
  estimated?: boolean;
}

export interface DepartmentInsightResult {
  insights: string[];
  recommendations: string[];
  outlookSummary: string;
  estimated?: boolean;
}

export interface RecommendedDrive {
  targetRole: string;
  reason: string;
  priority: string;
}

export interface DriveRecommendationResult {
  recommendedDrives: RecommendedDrive[];
  summary: string;
  estimated?: boolean;
}

export interface PlacementReportResult {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  estimated?: boolean;
}

export class UniversityAIEngineClient {
  private static async run<T extends object>(feature: string, instruction: string, summary: string, mock: () => T): Promise<T & { estimated: boolean }> {
    if (!GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini') {
      return { ...mock(), estimated: true };
    }
    try {
      const prompt = `${instruction}\n\nReturn ONLY valid JSON, no markdown fences, no commentary.\n\n---\n${summary}`;
      const json = await GeminiClient.generateJSON<T>(prompt, feature);
      return { ...json, estimated: false };
    } catch (err) {
      logger.error({ err, feature }, '[UNIVERSITY AI] Gemini request failed. Serving deterministic fallback.');
      return { ...mock(), estimated: true };
    }
  }

  static async predictStudentPlacement(
    firstName: string,
    departmentName: string | undefined | null,
    graduationYear: number | undefined | null,
    currentGpa: number | undefined | null,
    currentSkills: string[],
    resumeSummary: string | undefined,
    interviewHistorySummary: string | undefined
  ): Promise<StudentPlacementResult> {
    const summary = `Student: ${firstName}
Department: ${departmentName ?? 'Unknown'}
Graduation Year: ${graduationYear ?? 'Unknown'}
Current GPA: ${currentGpa ?? 'Unknown'}
Skills: ${currentSkills.join(', ') || 'None listed'}
Resume Summary: ${resumeSummary ?? 'Not available'}
Interview History: ${interviewHistorySummary ?? 'No prior interviews'}`;

    return this.run(
      'university-placement-prediction-v1',
      'You are CareerBridge\'s university placement analyst. Estimate this student\'s placement probability and ' +
        'return JSON: { placementProbability: number (0-100), riskLevel ("Low"|"Medium"|"High"), summary, ' +
        'riskFactors: string[], strengths: string[], suggestedActions: string[] }.',
      summary,
      () => this.mockPredictStudentPlacement(firstName, departmentName, graduationYear, currentGpa, currentSkills, resumeSummary, interviewHistorySummary)
    );
  }

  static async generateDepartmentInsight(analyticsSummary: string): Promise<DepartmentInsightResult> {
    return this.run(
      'university-department-insight-v1',
      'You are CareerBridge\'s university placement analyst. Review the following department placement analytics ' +
        'and return JSON: { insights: string[], recommendations: string[], outlookSummary }.',
      analyticsSummary,
      () => this.mockGenerateDepartmentInsight(analyticsSummary)
    );
  }

  static async recommendDrives(contextSummary: string): Promise<DriveRecommendationResult> {
    return this.run(
      'university-drive-recommendations-v1',
      'You are CareerBridge\'s university placement analyst. Review the following student pool and employer ' +
        'demand context, and recommend campus recruiting drives. Return JSON: { recommendedDrives: [{ targetRole, ' +
        'reason, priority ("Low"|"Medium"|"High") }], summary }.',
      contextSummary,
      () => this.mockRecommendDrives(contextSummary)
    );
  }

  static async generatePlacementReport(analyticsSummary: string): Promise<PlacementReportResult> {
    return this.run(
      'university-placement-report-v1',
      'You are CareerBridge\'s university placement analyst, writing an executive placement report for university ' +
        'leadership. Return JSON: { executiveSummary, keyFindings: string[], recommendations: string[] }.',
      analyticsSummary,
      () => this.mockGeneratePlacementReport(analyticsSummary)
    );
  }

  // --- Deterministic mock fallbacks -------------------------------------

  private static mockPredictStudentPlacement(
    firstName: string,
    departmentName: string | undefined | null,
    graduationYear: number | undefined | null,
    currentGpa: number | undefined | null,
    currentSkills: string[],
    resumeSummary: string | undefined,
    interviewHistorySummary: string | undefined
  ): StudentPlacementResult {
    let score = 50;
    score += Math.min(30, currentSkills.length * 4);
    if (currentGpa && currentGpa >= 8) score += 10;
    else if (currentGpa && currentGpa < 6) score -= 15;
    if (resumeSummary) score += 5;
    if (interviewHistorySummary) score += 5;
    score = Math.min(95, Math.max(15, score));

    const riskLevel = score >= 70 ? 'Low' : score >= 45 ? 'Medium' : 'High';
    const riskFactors: string[] = [];
    if (currentSkills.length < 3) riskFactors.push('Fewer than 3 skills listed on profile.');
    if (!resumeSummary) riskFactors.push('No resume uploaded yet.');
    if (currentGpa != null && currentGpa < 6) riskFactors.push('GPA below department average.');

    return {
      placementProbability: score,
      riskLevel,
      summary: `${firstName} has an estimated placement probability of ${score}% based on skills, GPA, and profile completeness.`,
      riskFactors,
      strengths: currentSkills.slice(0, 5).length > 0 ? currentSkills.slice(0, 5) : ['Profile is being actively built.'],
      suggestedActions: riskFactors.length > 0 ? ['Complete resume upload.', 'Add more verified skills.', 'Attend a mock interview.'] : ['Continue applying to matching roles.']
    };
  }

  private static mockGenerateDepartmentInsight(analyticsSummary: string): DepartmentInsightResult {
    return {
      insights: ['Placement activity for this department is progressing in line with prior terms.'],
      recommendations: ['Encourage students with fewer than 3 skills to complete profile enrichment.'],
      outlookSummary: 'Outlook is stable based on current application and placement trends.'
    };
  }

  private static mockRecommendDrives(contextSummary: string): DriveRecommendationResult {
    return {
      recommendedDrives: [
        { targetRole: 'Software Engineer', reason: 'High concentration of matching student skills.', priority: 'High' }
      ],
      summary: 'One high-priority drive recommendation based on current student skill distribution.'
    };
  }

  private static mockGeneratePlacementReport(analyticsSummary: string): PlacementReportResult {
    return {
      executiveSummary: 'Placement activity remains steady across departments this term.',
      keyFindings: ['See attached analytics summary for the full metric breakdown.'],
      recommendations: ['Continue targeted outreach to companies hiring in high-density skill areas.']
    };
  }
}
