import { InterviewRepository } from './interview.repository';
import { InterviewPdfService } from './interview-pdf.service';
import { InterviewContextService, InterviewContext } from './interview-context.service';
import {
  InterviewAIService,
  PlannedQuestion,
  InterviewTypeKey,
  DifficultyKey,
  computeDeliveryMetrics
} from './interview-ai.service';
import { ProfileRepository } from '../profile/profile.repository';
import { StorageService } from '../shared/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppError } from '../../utils/app-error';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

/**
 * Mock Interview service: DB-backed session lifecycle. All state (question
 * plan, answers, evaluations, camera observations) lives in PostgreSQL, so
 * sessions survive restarts and the API can scale horizontally. The final
 * report is computed ONCE from the stored per-question rows, validated, and
 * persisted -- every surface (dashboard, employer, university, PDF) reads
 * that same stored record.
 */

const OBSERVATION_TYPES = new Set([
  'face_detected',
  'face_lost',
  'multiple_faces',
  'camera_disconnected',
  'camera_denied',
  'looking_away',
  'window_blur',
  'window_focus',
  'idle',
  'camera_enabled',
  'camera_disabled'
]);

interface StartOptions {
  interviewType: InterviewTypeKey;
  difficulty: DifficultyKey;
  numQuestions: number;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  targetRole?: string;
}

interface AnswerPayload {
  transcript: string;
  answerMethod: 'voice' | 'text';
  durationSec?: number;
  audioFile?: Express.Multer.File;
  videoFile?: Express.Multer.File;
}

const avg = (nums: number[]) => (nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);
const definedAvg = (nums: (number | null | undefined)[]) => avg(nums.filter((n): n is number => typeof n === 'number'));

function questionOverall(q: {
  technicalAccuracy: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  relevanceScore: number | null;
  completenessScore: number | null;
  grammarScore: number | null;
}): number {
  return definedAvg([
    q.technicalAccuracy,
    q.communicationScore,
    q.problemSolvingScore,
    q.relevanceScore,
    q.completenessScore,
    q.grammarScore
  ]);
}

export class InterviewService {
  private static async requireOwnedSession(userId: string, mockInterviewId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    const session = await InterviewRepository.getSessionById(mockInterviewId);
    if (!session || session.studentProfileId !== profile.id) {
      throw new AppError('Interview session not found.', 404, 'INTERVIEW_NOT_FOUND');
    }
    return { profile, session };
  }

  // -------------------------------------------------------------- start --

  static async startInterview(userId: string, options: StartOptions) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');

    const context = await InterviewContextService.build(profile.id, {
      jobId: options.jobId,
      jobTitle: options.jobTitle,
      companyName: options.companyName
    }).catch(err => {
      throw new AppError(err.message, 400, 'INTERVIEW_CONTEXT_ERROR');
    });

    const numQuestions = Math.max(3, Math.min(options.numQuestions || 6, 12));
    const plan = await InterviewAIService.generatePlan(context, options.interviewType, options.difficulty, numQuestions);
    if (plan.questions.length === 0) {
      throw new AppError('Could not generate an interview plan.', 502, 'INTERVIEW_PLAN_FAILED');
    }

    const session = await InterviewRepository.createSession(profile.id, {
      jobTitle: context.job.jobTitle,
      targetRole: options.targetRole,
      numQuestions: plan.questions.length,
      interviewType: options.interviewType,
      difficulty: options.difficulty,
      jobId: options.jobId,
      companyName: context.job.companyName ?? undefined,
      questionPlan: plan.questions as any,
      contextSnapshot: context as any,
      planEstimated: plan.estimated
    });

    const first = plan.questions[0];
    await InterviewRepository.createQuestion(session.id, 0, {
      questionType: first.type,
      questionText: first.text,
      difficulty: first.difficulty,
      expectedSkills: first.expectedSkills
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INTERVIEW_STARTED',
        details: JSON.stringify({
          mockInterviewId: session.id,
          jobTitle: context.job.jobTitle,
          interviewType: options.interviewType,
          difficulty: options.difficulty,
          planEstimated: plan.estimated
        })
      }
    });

    return {
      mockInterviewId: session.id,
      totalQuestions: plan.questions.length,
      interviewType: options.interviewType,
      difficulty: options.difficulty,
      jobTitle: context.job.jobTitle,
      companyName: context.job.companyName,
      planEstimated: plan.estimated,
      questionIndex: 0,
      question: first.text,
      questionType: first.type,
      questionDifficulty: first.difficulty,
      expectedSkills: first.expectedSkills
    };
  }

  // ------------------------------------------------------------- answer --

  static async submitAnswer(userId: string, mockInterviewId: string, questionIndex: number, payload: AnswerPayload) {
    const { session } = await this.requireOwnedSession(userId, mockInterviewId);
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError('This interview session has already ended.', 409, 'INTERVIEW_NOT_IN_PROGRESS');
    }

    const question = session.questions.find(q => q.questionIndex === questionIndex);
    if (!question) throw new AppError('Question not found in this session.', 404, 'QUESTION_NOT_FOUND');
    if (question.answeredAt) {
      throw new AppError('This question has already been answered.', 409, 'QUESTION_ALREADY_ANSWERED');
    }

    const transcript = payload.transcript.trim();
    if (!transcript) throw new AppError('An answer transcript is required.', 400, 'VALIDATION_ERROR');

    const plan = (session.questionPlan as unknown as PlannedQuestion[]) ?? [];
    const planned: PlannedQuestion = plan[questionIndex] ?? {
      type: question.questionType,
      difficulty: question.difficulty ?? 'medium',
      text: question.questionText,
      expectedSkills: question.expectedSkills
    };
    // Evaluate against the question as ACTUALLY asked (adaptive may have replaced the plan text).
    planned.text = question.questionText;
    planned.expectedSkills = question.expectedSkills;

    const context = session.contextSnapshot as unknown as InterviewContext;
    const durationSec = payload.durationSec && payload.durationSec > 0 ? payload.durationSec : null;
    const delivery = computeDeliveryMetrics(transcript, durationSec);

    const [audioStored, videoStored, evaluation] = await Promise.all([
      payload.audioFile ? StorageService.saveFile(payload.audioFile) : Promise.resolve(null),
      payload.videoFile ? StorageService.saveFile(payload.videoFile) : Promise.resolve(null),
      InterviewAIService.evaluateAnswer(context, planned, transcript, durationSec)
    ]);

    await InterviewRepository.recordAnswer(mockInterviewId, questionIndex, {
      answerTranscript: transcript,
      answerMethod: payload.answerMethod,
      answerDurationSec: durationSec ?? undefined,
      audioUrl: audioStored ? `${env.APP_BASE_URL}/uploads/${audioStored.storagePath}` : undefined,
      videoUrl: videoStored ? `${env.APP_BASE_URL}/uploads/${videoStored.storagePath}` : undefined,
      wordsPerMinute: delivery.wordsPerMinute,
      fillerWordCount: delivery.fillerWordCount,
      technicalAccuracy: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      problemSolvingScore: evaluation.problemSolvingScore,
      relevanceScore: evaluation.relevanceScore,
      completenessScore: evaluation.completenessScore,
      grammarScore: evaluation.grammarScore,
      answerQualityScore: Math.round(
        (evaluation.technicalScore +
          evaluation.communicationScore +
          evaluation.problemSolvingScore +
          evaluation.relevanceScore +
          evaluation.completenessScore +
          evaluation.grammarScore) /
          6
      ),
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestedBetterAnswer: evaluation.suggestedBetterAnswer,
      evaluationEstimated: evaluation.estimated
    });

    // ---- adaptive next question ------------------------------------------
    const nextIndex = questionIndex + 1;
    const isLastQuestion = nextIndex >= session.numQuestions;
    let next: PlannedQuestion | undefined;

    if (!isLastQuestion) {
      const answeredSoFar = session.questions
        .filter(q => q.answeredAt && q.questionIndex !== questionIndex)
        .map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty ?? 'medium',
          transcript: q.answerTranscript ?? '',
          overallScore: questionOverall(q)
        }));
      answeredSoFar.push({
        questionText: question.questionText,
        questionType: question.questionType,
        difficulty: question.difficulty ?? 'medium',
        transcript,
        overallScore: Math.round(
          (evaluation.technicalScore + evaluation.communicationScore + evaluation.problemSolvingScore +
            evaluation.relevanceScore + evaluation.completenessScore + evaluation.grammarScore) / 6
        )
      });

      const plannedNext = plan[nextIndex] ?? planned;
      next = await InterviewAIService.generateAdaptiveQuestion(context, plannedNext, answeredSoFar);

      if (next.text !== plannedNext.text) {
        const updatedPlan = [...plan];
        updatedPlan[nextIndex] = next;
        await InterviewRepository.updateQuestionPlan(mockInterviewId, updatedPlan as any);
      }
      await InterviewRepository.createQuestion(mockInterviewId, nextIndex, {
        questionType: next.type,
        questionText: next.text,
        difficulty: next.difficulty,
        expectedSkills: next.expectedSkills
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INTERVIEW_ANSWER_SUBMITTED',
        details: JSON.stringify({ mockInterviewId, questionIndex, answerMethod: payload.answerMethod, estimated: evaluation.estimated })
      }
    });

    return {
      questionIndex,
      transcript,
      wordsPerMinute: delivery.wordsPerMinute,
      fillerWordCount: delivery.fillerWordCount,
      evaluation: {
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        problemSolvingScore: evaluation.problemSolvingScore,
        relevanceScore: evaluation.relevanceScore,
        completenessScore: evaluation.completenessScore,
        grammarScore: evaluation.grammarScore,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        suggestedBetterAnswer: evaluation.suggestedBetterAnswer,
        estimated: evaluation.estimated
      },
      isLastQuestion,
      nextQuestionIndex: !isLastQuestion ? nextIndex : undefined,
      nextQuestion: next?.text,
      nextQuestionType: next?.type,
      nextQuestionDifficulty: next?.difficulty,
      nextExpectedSkills: next?.expectedSkills
    };
  }

  // -------------------------------------------------------- observations --

  static async addObservation(userId: string, mockInterviewId: string, type: string, detail?: string) {
    const { session } = await this.requireOwnedSession(userId, mockInterviewId);
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError('This interview session has already ended.', 409, 'INTERVIEW_NOT_IN_PROGRESS');
    }
    if (!OBSERVATION_TYPES.has(type)) {
      throw new AppError(`Unknown observation type "${type}".`, 400, 'VALIDATION_ERROR');
    }
    await InterviewRepository.appendCameraObservation(mockInterviewId, {
      at: new Date().toISOString(),
      type,
      detail: detail ? String(detail).slice(0, 200) : undefined
    });
    return { recorded: true };
  }

  // ---------------------------------------------------------------- end --

  static async endInterview(userId: string, mockInterviewId: string) {
    const { session } = await this.requireOwnedSession(userId, mockInterviewId);
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError('This interview session has already ended.', 409, 'INTERVIEW_NOT_IN_PROGRESS');
    }

    // The report covers exactly the questions that were asked AND answered.
    const answered = session.questions
      .filter(q => q.answeredAt && q.answerTranscript)
      .sort((a, b) => a.questionIndex - b.questionIndex);

    if (answered.length === 0) {
      await InterviewRepository.abandonSession(mockInterviewId);
      throw new AppError(
        'No answers were recorded, so no report can be generated. The session was closed.',
        422,
        'INTERVIEW_NO_ANSWERS'
      );
    }

    // ---- report validation: every included question fully evaluated ------
    for (const q of answered) {
      const missing = [
        q.answerTranscript ? null : 'transcript',
        q.technicalAccuracy != null ? null : 'technicalScore',
        q.communicationScore != null ? null : 'communicationScore',
        q.problemSolvingScore != null ? null : 'problemSolvingScore',
        q.relevanceScore != null ? null : 'relevanceScore',
        q.completenessScore != null ? null : 'completenessScore',
        q.grammarScore != null ? null : 'grammarScore',
        q.feedback ? null : 'feedback'
      ].filter(Boolean);
      if (missing.length > 0) {
        throw new AppError(
          `Question ${q.questionIndex + 1} is missing evaluation fields (${missing.join(', ')}). Report cannot be generated.`,
          500,
          'INTERVIEW_REPORT_VALIDATION_FAILED'
        );
      }
    }

    const context = session.contextSnapshot as unknown as InterviewContext;

    // ---- deterministic aggregation from stored rows ----------------------
    const perOverall = answered.map(q => questionOverall(q));
    const overallScore = avg(perOverall);
    const technicalQs = answered.filter(q => q.questionType === 'technical');
    const behavioralQs = answered.filter(q => q.questionType === 'behavioral' || q.questionType === 'hr');
    const technicalScore = technicalQs.length
      ? definedAvg(technicalQs.map(q => q.technicalAccuracy))
      : definedAvg(answered.map(q => q.technicalAccuracy));
    const behavioralScore = behavioralQs.length
      ? avg(behavioralQs.map(q => questionOverall(q)))
      : overallScore;
    const communicationScore = definedAvg(answered.map(q => q.communicationScore));
    const problemSolvingScore = definedAvg(answered.map(q => q.problemSolvingScore));
    const grammarScore = definedAvg(answered.map(q => q.grammarScore));
    const answerQualityScore = definedAvg(answered.map(q => q.answerQualityScore));
    const hrQs = answered.filter(q => q.questionType === 'hr');
    const hrScore = hrQs.length ? avg(hrQs.map(q => questionOverall(q))) : behavioralScore;

    const fillerWordCount = answered.reduce((s, q) => s + (q.fillerWordCount ?? 0), 0);
    const wpmValues = answered.map(q => q.wordsPerMinute).filter((n): n is number => typeof n === 'number');
    const speakingSpeedWpm = wpmValues.length ? Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length) : 0;

    // Confidence estimate: labeled as an estimate; derived from measurable
    // delivery signals (filler density, answer completeness, pace stability).
    const fillerPerAnswer = fillerWordCount / answered.length;
    const paceStability =
      wpmValues.length >= 2
        ? Math.max(0, 100 - Math.round((Math.max(...wpmValues) - Math.min(...wpmValues)) / 2))
        : 70;
    const completenessAvg = definedAvg(answered.map(q => q.completenessScore));
    const confidenceScore = Math.round(
      Math.max(20, Math.min(95, completenessAvg * 0.5 + paceStability * 0.2 + Math.max(0, 100 - fillerPerAnswer * 8) * 0.3))
    );

    // Job/skill match: only meaningful when a real job was targeted.
    const requiredSkills = context.job.requiredSkills.map(s => s.toLowerCase());
    const studentSkillSet = new Set(
      [...context.student.skills.map(s => s.name), ...context.student.resumeSkills].map(s => s.toLowerCase())
    );
    const demonstrated = new Set(
      answered.flatMap(q => (questionOverall(q) >= 60 ? q.expectedSkills.map(s => s.toLowerCase()) : []))
    );
    let skillMatchPercent: number | null = null;
    let jobMatchPercent: number | null = null;
    let missingSkills: string[] = [];
    if (requiredSkills.length > 0) {
      const have = requiredSkills.filter(s => studentSkillSet.has(s) || demonstrated.has(s));
      skillMatchPercent = Math.round((have.length / requiredSkills.length) * 100);
      jobMatchPercent = Math.round(skillMatchPercent * 0.5 + overallScore * 0.5);
      missingSkills = context.job.requiredSkills.filter(s => !studentSkillSet.has(s.toLowerCase()) && !demonstrated.has(s.toLowerCase()));
    } else {
      missingSkills = [
        ...new Set(answered.filter(q => questionOverall(q) < 60).flatMap(q => q.expectedSkills))
      ].slice(0, 6);
    }

    const difficultyBonus = session.difficulty === 'HARD' ? 8 : session.difficulty === 'MEDIUM' ? 4 : 0;
    const interviewReadiness = Math.max(0, Math.min(100, Math.round(overallScore * 0.7 + confidenceScore * 0.2) + difficultyBonus));

    // Camera observation aggregation -- observable events only.
    const observations = Array.isArray(session.cameraObservations)
      ? (session.cameraObservations as { at?: string; type?: string }[])
      : [];
    const cameraSummary =
      observations.length > 0
        ? Object.entries(
            observations.reduce<Record<string, number>>((acc, o) => {
              if (o?.type) acc[o.type] = (acc[o.type] ?? 0) + 1;
              return acc;
            }, {})
          ).map(([event, count]) => ({ event, count }))
        : null;

    const totalDurationSec = Math.max(
      1,
      Math.round(
        answered.reduce((s, q) => s + (q.answerDurationSec ?? 0), 0) ||
          (session.completedAt ?? new Date()).getTime() / 1000 - session.createdAt.getTime() / 1000
      )
    );

    const questionBreakdown = answered.map(q => ({
      questionIndex: q.questionIndex,
      questionType: q.questionType,
      difficulty: q.difficulty,
      questionText: q.questionText,
      expectedSkills: q.expectedSkills,
      answerTranscript: q.answerTranscript,
      answerMethod: q.answerMethod,
      answerDurationSec: q.answerDurationSec,
      wordsPerMinute: q.wordsPerMinute,
      fillerWordCount: q.fillerWordCount,
      technicalScore: q.technicalAccuracy,
      communicationScore: q.communicationScore,
      problemSolvingScore: q.problemSolvingScore,
      relevanceScore: q.relevanceScore,
      completenessScore: q.completenessScore,
      grammarScore: q.grammarScore,
      overallScore: questionOverall(q),
      feedback: q.feedback,
      strengths: q.strengths,
      weaknesses: q.weaknesses,
      suggestedBetterAnswer: q.suggestedBetterAnswer,
      evaluationEstimated: q.evaluationEstimated
    }));

    // ---- qualitative synthesis (Gemini prose over the stored numbers) ----
    const qualitative = await InterviewAIService.synthesizeQualitative(
      context,
      {
        overallScore,
        technicalScore,
        communicationScore,
        behavioralScore,
        problemSolvingScore,
        interviewReadiness,
        jobMatchPercent,
        missingSkills
      },
      answered.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty ?? 'medium',
        transcript: q.answerTranscript ?? '',
        overallScore: questionOverall(q),
        feedback: q.feedback ?? '',
        weaknesses: q.weaknesses
      }))
    );

    const anyEstimated = qualitative.estimated || answered.some(q => q.evaluationEstimated);

    const created = await InterviewRepository.createReport(mockInterviewId, {
      summary: qualitative.aiSummary,
      score: overallScore,
      status: 'PARSED',
      modelVersion: anyEstimated ? 'interview-final-report-v2-estimated' : 'interview-final-report-v2',
      technicalScore,
      hrScore,
      communicationScore,
      confidenceScore,
      grammarScore,
      answerQualityScore,
      behavioralScore,
      problemSolvingScore,
      interviewReadiness,
      jobMatchPercent,
      skillMatchPercent,
      speakingSpeedWpm,
      fillerWordCount,
      strengths: qualitative.strengths,
      weaknesses: qualitative.weaknesses,
      missingSkills: qualitative.missingSkills,
      improvementPlan: qualitative.improvementPlan,
      learningRoadmap: qualitative.learningRoadmap as any,
      suggestedCourses: qualitative.suggestedCourses,
      recommendedProjects: qualitative.recommendedProjects,
      recommendedCertifications: qualitative.recommendedCertifications,
      careerRecommendations: qualitative.careerRecommendations,
      suggestedQuestions: qualitative.suggestedQuestions,
      aiSummary: qualitative.aiSummary,
      questionBreakdown: questionBreakdown as any,
      cameraSummary: cameraSummary as any,
      estimated: anyEstimated
    });

    await InterviewRepository.completeSession(mockInterviewId, totalDurationSec);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INTERVIEW_COMPLETED',
        details: JSON.stringify({ mockInterviewId, overallScore, questions: answered.length, estimated: anyEstimated })
      }
    });

    await NotificationsService.createNotification({
      recipientId: userId,
      type: 'AI',
      title: 'Your interview report is ready',
      content: `Mock interview for ${session.jobTitle} scored ${overallScore}/100. Open the report for your full evaluation and learning roadmap.`,
      priority: 'MEDIUM'
    }).catch(() => undefined);

    return created;
  }

  // -------------------------------------------------------------- reads --

  static async getHistory(userId: string) {
    const profile = await ProfileRepository.getStudentProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return InterviewRepository.getHistory(profile.id);
  }

  static async getSessionDetail(userId: string, mockInterviewId: string) {
    const { session } = await this.requireOwnedSession(userId, mockInterviewId);
    // The remaining plan and raw context are internal state -- not part of the API surface.
    const { questionPlan: _plan, contextSnapshot: _ctx, ...rest } = session as any;
    return rest;
  }

  /**
   * Streams the stored report as a branded PDF. Renders from the persisted
   * MockInterviewReport only -- never recomputes, so re-downloads of old
   * reports always produce the same document.
   */
  static async getReportPdf(userId: string, mockInterviewId: string) {
    const { session } = await this.requireOwnedSession(userId, mockInterviewId);
    const report = session.reports[0];
    if (!report) {
      throw new AppError('No report exists for this interview yet.', 404, 'REPORT_NOT_FOUND');
    }
    const studentName = `${session.studentProfile.firstName} ${session.studentProfile.lastName}`.trim();
    const buffer = await InterviewPdfService.render({ ...report, session: { ...session, studentName } } as any);
    const datePart = (session.completedAt ?? session.createdAt).toISOString().slice(0, 10);
    const safeRole = session.jobTitle.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40);
    return { buffer, fileName: `CareerBridge-Interview-Report-${safeRole}-${datePart}.pdf` };
  }

  static async setSharing(userId: string, mockInterviewId: string, shared: boolean) {
    const { session } = await this.requireOwnedSession(userId, mockInterviewId);
    if (session.status !== 'COMPLETED') {
      throw new AppError('Only completed interviews can be shared with employers.', 409, 'INTERVIEW_NOT_COMPLETED');
    }
    const updated = await InterviewRepository.setSharedWithEmployers(mockInterviewId, shared);
    await prisma.auditLog.create({
      data: {
        userId,
        action: shared ? 'INTERVIEW_REPORT_SHARED' : 'INTERVIEW_REPORT_UNSHARED',
        details: JSON.stringify({ mockInterviewId })
      }
    });
    return { id: updated.id, sharedWithEmployers: updated.sharedWithEmployers, sharedAt: updated.sharedAt };
  }
}
