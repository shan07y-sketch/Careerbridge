import { IAIProvider, AIProviderResult } from './ai-provider.interface';
import { logger } from '../../../config/logger';

export class GeminiProvider implements IAIProvider {
  async generate(prompt: string, feature: string): Promise<AIProviderResult> {
    const isMock = !process.env.GEMINI_API_KEY;
    const modelName = 'gemini-1.5-pro';

    logger.info({ feature, isMock }, `[AI PROVIDER] Gemini request initiating`);

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        text: this.getRealisticMockResponse(feature),
        tokensIn: Math.floor(prompt.length / 4),
        tokensOut: 250,
        model: modelName,
        provider: 'Gemini (MockMode)'
      };
    }

    throw new Error('Gemini API key is currently not configured or authenticated.');
  }

  private getRealisticMockResponse(feature: string): string {
    if (feature.startsWith('resume-analysis')) {
      return JSON.stringify({
        score: 85,
        summary: 'Strong engineering fundamentals with excellent typescript experience. Recommendations: Add more cloud systems items.',
        skillsMatched: ['React', 'TypeScript', 'Prisma'],
        improvements: ['Include AWS deployments', 'Mention docker configurations']
      });
    }
    if (feature.startsWith('career-insight')) {
      return JSON.stringify({
        score: 90,
        summary: 'High readiness for frontend engineer roles. Focus on full-stack architecture paradigms.',
        skillsMatchSummary: ['TypeScript', 'SQL', 'Algorithms'],
        preferredSkills: ['Next.js', 'PostgreSQL'],
        technologies: ['React', 'Prisma']
      });
    }
    if (feature.startsWith('job-match')) {
      return JSON.stringify({
        matchRate: 88,
        aiMatchExplanation: 'Your skills align 88% with the job requirements. High match on React & TS.',
        skillsMatchSummary: ['React', 'TypeScript'],
        preferredSkills: ['TailwindCSS']
      });
    }
    if (feature.startsWith('interview-analysis')) {
      return JSON.stringify({
        score: 82,
        summary: 'Excellent communication. Technical answers are correct but could be more concise.',
        status: 'COMPLETED'
      });
    }
    return JSON.stringify({
      score: 75,
      summary: 'Mock response schema format'
    });
  }
}
