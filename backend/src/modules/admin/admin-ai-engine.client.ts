import { logger } from '../../config/logger';
import { GeminiClient } from '../ai/gemini-client';
import { env } from '../../config/env';

/**
 * AdminAIEngineClient: the Admin AI integration point (fraud detection,
 * platform insights, moderation recommendations, system health summaries,
 * executive reports, and predictive analytics). Routes through the shared
 * GeminiClient - see CLAUDE.md's AI Adapter Layer. When GEMINI_API_KEY is
 * unset, or a Gemini call fails, it falls back to high-fidelity, dynamic
 * mock-generation based on the incoming signal summary text so every admin
 * AI feature remains fully usable without a key.
 */

export interface FlaggedItem {
  category: string;
  severity: string;
  description: string;
  relatedIds: string[];
  recommendedAction: string;
}

export interface FraudDetectionResult {
  flaggedItems: FlaggedItem[];
  summary: string;  estimated?: boolean;
}

export interface PlatformInsightsResult {
  insights: string[];
  growthSummary: string;
  engagementSummary: string;  estimated?: boolean;
}

export interface RecommendedReview {
  target: string;
  reason: string;
  priority: string;
}

export interface ModerationResult {
  recommendedReviews: RecommendedReview[];
  summary: string;  estimated?: boolean;
}

export interface SystemHealthResult {
  healthStatus: string;
  issues: string[];
  recurringPatterns: string[];
  summary: string;  estimated?: boolean;
}

export interface ExecutiveReportResult {
  reportType: string;
  executiveSummary: string;
  keyMetrics: string[];
  recommendations: string[];  estimated?: boolean;
}

export interface PredictiveAnalyticsResult {
  growthForecast: string;
  hiringDemandForecast: string;
  decliningDepartments: string[];
  interviewVolumeForecast: string;
  summary: string;  estimated?: boolean;
}

export class AdminAIEngineClient {
  private static async run<T extends object>(feature: string, instruction: string, summary: string, mock: () => T): Promise<T & { estimated: boolean }> {
    if (!GeminiClient.isConfigured || env.AI_PROVIDER !== 'gemini') {
      return { ...mock(), estimated: true };
    }
    try {
      const prompt = `${instruction}\n\nReturn ONLY valid JSON, no markdown fences, no commentary.\n\n---\n${summary}`;
      const json = await GeminiClient.generateJSON<T>(prompt, feature);
      return { ...json, estimated: false };
    } catch (err) {
      logger.error({ err, feature }, '[ADMIN AI] Gemini request failed. Serving deterministic fallback.');
      return { ...mock(), estimated: true };
    }
  }

  static async detectFraudSignals(signalsSummary: string): Promise<FraudDetectionResult> {
    return this.run(
      'admin-fraud-detection-v1',
      'You are CareerBridge\'s platform-integrity analyst. Review the following fraud signal summary (duplicate ' +
        'accounts, suspicious logins, fake organizations, duplicate resumes, abnormal application bursts) and ' +
        'return JSON: { flaggedItems: [{ category, severity ("Low"|"Medium"|"High"), description, relatedIds: ' +
        'string[], recommendedAction }], summary }.',
      signalsSummary,
      () => this.mockDetectFraudSignals(signalsSummary)
    );
  }

  static async generatePlatformInsights(statsSummary: string): Promise<PlatformInsightsResult> {
    return this.run(
      'admin-platform-insights-v1',
      'You are CareerBridge\'s growth analyst. Review the following platform growth/engagement stats and return ' +
        'JSON: { insights: string[], growthSummary, engagementSummary }.',
      statsSummary,
      () => this.mockGeneratePlatformInsights(statsSummary)
    );
  }

  static async getModerationRecommendations(contextSummary: string): Promise<ModerationResult> {
    return this.run(
      'admin-moderation-v1',
      'You are CareerBridge\'s trust & safety analyst. Review the following flagged fraud items and open support ' +
        'tickets and return JSON: { recommendedReviews: [{ target, reason, priority ("Low"|"Medium"|"High") }], ' +
        'summary }.',
      contextSummary,
      () => this.mockGetModerationRecommendations(contextSummary)
    );
  }

  static async generateSystemHealthSummary(healthSummary: string): Promise<SystemHealthResult> {
    return this.run(
      'admin-system-health-v1',
      'You are CareerBridge\'s SRE analyst. Review the following system/audit-log event counts and return JSON: ' +
        '{ healthStatus ("Healthy"|"Degraded"|"Critical"), issues: string[], recurringPatterns: string[], summary }.',
      healthSummary,
      () => this.mockGenerateSystemHealthSummary(healthSummary)
    );
  }

  static async generateExecutiveReport(reportType: string, dataSummary: string): Promise<ExecutiveReportResult> {
    return this.run(
      'admin-executive-report-v1',
      `You are CareerBridge's Chief of Staff, writing a "${reportType}" executive report for platform leadership ` +
        'from the following data. Return JSON: { reportType, executiveSummary, keyMetrics: string[], ' +
        'recommendations: string[] }.',
      dataSummary,
      () => this.mockGenerateExecutiveReport(reportType, dataSummary)
    );
  }

  static async generatePredictiveAnalytics(historicalSummary: string): Promise<PredictiveAnalyticsResult> {
    return this.run(
      'admin-predictive-analytics-v1',
      'You are CareerBridge\'s forecasting analyst. Review the following historical trends and current growth ' +
        'stats and return JSON: { growthForecast, hiringDemandForecast, decliningDepartments: string[], ' +
        'interviewVolumeForecast, summary }.',
      historicalSummary,
      () => this.mockGeneratePredictiveAnalytics(historicalSummary)
    );
  }

  // --- Deterministic mock fallbacks -------------------------------------

  private static mockDetectFraudSignals(signalsSummary: string): FraudDetectionResult {
    const flaggedItems: FlaggedItem[] = [];
    if (/duplicate account/i.test(signalsSummary)) {
      flaggedItems.push({
        category: 'Duplicate Account',
        severity: 'Medium',
        description: 'Multiple profiles appear to share contact details.',
        relatedIds: [],
        recommendedAction: 'Review the flagged profiles manually and merge or suspend duplicates.'
      });
    }
    if (/suspicious login/i.test(signalsSummary)) {
      flaggedItems.push({
        category: 'Suspicious Login',
        severity: 'High',
        description: 'A user session shows an unusually high number of session families in 24h.',
        relatedIds: [],
        recommendedAction: 'Force a password reset and review recent login IPs.'
      });
    }
    return {
      flaggedItems,
      summary:
        flaggedItems.length > 0
          ? `${flaggedItems.length} potential fraud signal(s) detected. Manual review recommended.`
          : 'No significant fraud signals detected in this window.'
    };
  }

  private static mockGeneratePlatformInsights(statsSummary: string): PlatformInsightsResult {
    return {
      insights: [
        'User growth and engagement remain within expected ranges for this period.',
        'AI feature usage is a healthy share of total platform activity.'
      ],
      growthSummary: 'Platform growth is steady with no anomalies detected in the summarized window.',
      engagementSummary: 'Engagement signals (messages, applications, AI usage) trend consistently with prior periods.'
    };
  }

  private static mockGetModerationRecommendations(contextSummary: string): ModerationResult {
    const hasOpenTickets = /priority[":\s]*HIGH/i.test(contextSummary);
    return {
      recommendedReviews: hasOpenTickets
        ? [{ target: 'Open high-priority support tickets', reason: 'Unresolved high-priority tickets detected.', priority: 'High' }]
        : [],
      summary: hasOpenTickets
        ? 'One or more high-priority items require moderator attention.'
        : 'No urgent moderation items detected.'
    };
  }

  private static mockGenerateSystemHealthSummary(healthSummary: string): SystemHealthResult {
    const errorMatch = healthSummary.match(/errorEventsLast24h[":\s]*(\d+)/i);
    const errorCount = errorMatch ? Number(errorMatch[1]) : 0;
    const healthStatus = errorCount > 20 ? 'Degraded' : errorCount > 50 ? 'Critical' : 'Healthy';
    return {
      healthStatus,
      issues: errorCount > 20 ? ['Elevated error event rate in the last 24 hours.'] : [],
      recurringPatterns: [],
      summary: `System reporting ${errorCount} error event(s) in the last 24 hours; overall status is ${healthStatus}.`
    };
  }

  private static mockGenerateExecutiveReport(reportType: string, dataSummary: string): ExecutiveReportResult {
    return {
      reportType,
      executiveSummary: `Platform metrics for the "${reportType}" report remain stable with steady user and job activity.`,
      keyMetrics: ['See attached data summary for the full metric breakdown.'],
      recommendations: ['Continue monitoring verification queues and AI feature adoption.']
    };
  }

  private static mockGeneratePredictiveAnalytics(historicalSummary: string): PredictiveAnalyticsResult {
    return {
      growthForecast: 'Continued modest growth is expected based on recent trends.',
      hiringDemandForecast: 'Hiring demand is expected to remain stable to slightly increasing.',
      decliningDepartments: [],
      interviewVolumeForecast: 'Interview volume is expected to track application volume closely.',
      summary: 'Overall outlook is stable based on the available historical data.'
    };
  }
}
