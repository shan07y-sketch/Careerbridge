import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AIOrchestrator } from './ai-orchestrator';
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
