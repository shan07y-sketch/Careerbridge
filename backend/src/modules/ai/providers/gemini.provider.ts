import { IAIProvider, AIProviderResult } from './ai-provider.interface';
import { logger } from '../../../config/logger';
import { GeminiClient } from '../gemini-client';
import { env } from '../../../config/env';

export class GeminiProvider implements IAIProvider {
  async generate(prompt: string, feature: string, _rawInput?: string): Promise<AIProviderResult> {
    const isMock = !GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini';
    const modelName = env.GEMINI_MODEL;

    logger.info({ feature, isMock }, `[AI PROVIDER] Gemini request initiating`);

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        text: this.getRealisticMockResponse(feature, _rawInput),
        tokensIn: Math.floor(prompt.length / 4),
        tokensOut: 250,
        model: modelName,
        provider: 'Gemini (MockMode)'
      };
    }

    try {
      const result = await GeminiClient.generate(prompt, feature);
      return {
        text: result.text,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        model: result.model,
        provider: 'Gemini (Production)'
      };
    } catch (err) {
      // Never let an upstream Gemini outage crash the feature pipeline:
      // log the complete error server-side and degrade to the deterministic
      // fallback so the user still gets a usable (clearly-labelled) result.
      logger.error({ err, feature }, '[AI PROVIDER] Gemini call failed; serving deterministic fallback');
      return {
        text: this.getRealisticMockResponse(feature, _rawInput),
        tokensIn: Math.floor(prompt.length / 4),
        tokensOut: 250,
        model: modelName,
        provider: 'Gemini (Fallback)'
      };
    }
  }

  private getRealisticMockResponse(feature: string, rawInput?: string): string {
    const input = (rawInput || '').toLowerCase();

    const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker', 'AWS', 'Kubernetes', 'Git'];
    const skillsMatched = skills.filter(s => input.includes(s.toLowerCase()));
    if (skillsMatched.length === 0) {
      skillsMatched.push('React', 'TypeScript', 'JavaScript');
    }

    const improvements: string[] = [];
    if (!input.includes('aws') && !input.includes('gcp') && !input.includes('cloud')) {
      improvements.push('Add cloud service deployments and cloud infrastructure (AWS/GCP/Azure).');
    }
    if (!input.includes('docker') && !input.includes('kubernetes')) {
      improvements.push('Detail containerization techniques (Docker/Kubernetes) used for server deployment.');
    }
    if (!input.includes('jest') && !input.includes('cypress') && !input.includes('test')) {
      improvements.push('Incorporate unit testing frameworks (Jest, Cypress, or Vitest) for pipeline automation.');
    }
    if (improvements.length === 0) {
      improvements.push('Elaborate on production scaling benchmarks and database query optimizations.');
    }

    const score = Math.min(95, Math.max(65, 75 + skillsMatched.length * 2));

    return JSON.stringify({
      score,
      summary: `Deterministic analysis for "${feature}" (AI provider offline or not configured; skill-based scoring applied).`,
      skillsMatched,
      improvements
    });
  }
}
