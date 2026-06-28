import { GeminiProvider } from './providers/gemini.provider';
import { PromptBuilder } from './prompt-builder/prompt-builder';
import { AICacheService } from './cache/ai-cache.service';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class AIOrchestrator {
  private static provider = new GeminiProvider();

  static async runAnalysis(userId: string, feature: string, promptVersion: string, input: string) {
    const inputHash = AICacheService.generateHash(`${feature}_${input}`);
    const cached = AICacheService.get(inputHash);

    if (cached) {
      logger.info({ feature, cacheHit: true }, 'AI Cache Hit');
      
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'AI_USAGE',
            details: JSON.stringify({
              feature,
              promptVersion,
              provider: 'Cache',
              model: 'N/A',
              tokensIn: 0,
              tokensOut: 0,
              processingTimeMs: 0,
              cacheHit: true,
              estimatedCost: 0
            })
          }
        });
      } catch (auditErr) {
        logger.warn({ auditErr }, 'Failed to persist AI cache hit audit log. Continuing pipeline.');
      }
      return JSON.parse(cached);
    }

    const prompt = PromptBuilder.buildPrompt(promptVersion, input);
    const start = Date.now();

    let attempts = 0;
    const maxRetries = 3;
    let result: any = null;
    let lastError: any = null;

    while (attempts < maxRetries) {
      try {
        attempts++;
        result = await this.provider.generate(prompt, feature);
        break;
      } catch (err) {
        lastError = err;
        logger.warn({ attempt: attempts, err }, 'AI request failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500 * attempts));
      }
    }

    if (!result) {
      logger.error({ lastError }, 'AI provider request failed completely after retries');
      throw lastError || new Error('AI Provider service is currently unavailable.');
    }

    const duration = Date.now() - start;

    AICacheService.set(inputHash, result.text);

    const tokensIn = result.tokensIn;
    const tokensOut = result.tokensOut;
    const cost = ((tokensIn * 0.00015) + (tokensOut * 0.0006)) / 1000;

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'AI_USAGE',
          details: JSON.stringify({
            feature,
            promptVersion,
            provider: result.provider,
            model: result.model,
            tokensIn,
            tokensOut,
            processingTimeMs: duration,
            cacheHit: false,
            estimatedCost: cost
          })
        }
      });
    } catch (auditErr) {
      logger.warn({ auditErr }, 'Failed to persist AI usage audit log. Continuing pipeline.');
    }

    return JSON.parse(result.text);
  }
}
