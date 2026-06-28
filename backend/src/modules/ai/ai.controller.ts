import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { AIOrchestrator } from './ai-orchestrator';

export class AIController {
  static getHealth = catchAsync(async (req: Request, res: Response) => {
    const isMock = !process.env.GEMINI_API_KEY;
    res.status(200).json({
      success: true,
      data: {
        activeProvider: isMock ? 'Gemini (MockMode)' : 'Gemini (Production)',
        availability: 'AVAILABLE',
        cacheStatus: 'ACTIVE',
        mockMode: isMock,
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
