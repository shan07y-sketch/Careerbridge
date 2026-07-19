import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AIOrchestrator } from './ai-orchestrator';
import { GeminiClient } from './gemini-client';
import { env } from '../../config/env';

export class AIController {
  static getHealth = catchAsync(async (req: Request, res: Response) => {
    const isMock = !env.GEMINI_API_KEY || env.AI_PROVIDER !== 'gemini';
    const activeProvider = isMock ? 'Gemini (MockMode)' : 'Gemini (Production)';

    res.status(200).json({
      success: true,
      data: {
        activeProvider,
        availability: 'AVAILABLE',
        cacheStatus: 'ACTIVE',
        mockMode: isMock,
        model: env.GEMINI_MODEL,
        keyType: !env.GEMINI_API_KEY ? 'none' : env.GEMINI_API_KEY.startsWith('AQ.') ? 'vertex-express' : 'developer',
        version: '1.0.0'
      },
      message: 'AI Platform health diagnostics completed.'
    });
  });

  /**
   * Real-generation health probe. getHealth above reports only whether a key
   * is *present* - it cannot detect an invalid key, a disabled project, a
   * retired model, or an exhausted quota, all of which leave AI features
   * silently serving "Estimated" fallbacks while /health still reads healthy.
   * This endpoint answers "is generation actually live right now".
   *
   * Returns 200 with status:"degraded" (not 5xx) so monitoring can distinguish
   * "the probe ran and AI is down" from "the backend itself is down".
   */
  static getHealthProbe = catchAsync(async (req: Request, res: Response) => {
    const result = await GeminiClient.probe();
    res.status(200).json({
      success: true,
      data: result,
      message:
        result.status === 'live'
          ? `Gemini generation is live (${result.latencyMs}ms).`
          : `Gemini generation is ${result.status}; AI features are serving deterministic fallbacks.`
    });
  });

  static analyzeTest = catchAsync(async (req: Request, res: Response) => {
    const result = await AIOrchestrator.runAnalysis(
      'system_user_id',
      'resume-analysis-v1',
      'resume-analysis-v1',
      req.body.text || 'Sample developer resume text'
    );
    res.status(200).json({
      success: true,
      data: result,
      message: 'AI analysis completed successfully.'
    });
  });
}
