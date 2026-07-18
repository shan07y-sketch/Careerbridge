import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for the production Mock Interview flow: starting a
// session persists the AI question plan + context snapshot and first
// question; submitting an answer evaluates the REAL transcript, persists the
// full evaluation, and asks the (possibly adapted) next question; ending a
// session validates every answered question is fully evaluated, aggregates
// the report deterministically from stored rows, and persists it ONCE; every
// operation is scoped to the requesting student's own session.

vi.mock('../interview.repository', () => ({
  InterviewRepository: {
    createSession: vi.fn(),
    getSessionById: vi.fn(),
    createQuestion: vi.fn(),
    recordAnswer: vi.fn(),
    updateQuestionPlan: vi.fn(),
    appendCameraObservation: vi.fn(),
    completeSession: vi.fn(),
    abandonSession: vi.fn(),
    createReport: vi.fn(),
    setSharedWithEmployers: vi.fn(),
    getHistory: vi.fn()
  }
}));

vi.mock('../interview-context.service', () => ({
  InterviewContextService: {
    build: vi.fn()
  }
}));

vi.mock('../interview-ai.service', async () => {
  const actual = await vi.importActual<typeof import('../interview-ai.service')>('../interview-ai.service');
  return {
    computeDeliveryMetrics: actual.computeDeliveryMetrics,
    InterviewAIService: {
      generatePlan: vi.fn(),
      evaluateAnswer: vi.fn(),
      generateAdaptiveQuestion: vi.fn(),
      synthesizeQualitative: vi.fn()
    }
  };
});

vi.mock('../interview-pdf.service', () => ({
  InterviewPdfService: { render: vi.fn() }
}));

vi.mock('../../profile/profile.repository', () => ({
  ProfileRepository: { getStudentProfile: vi.fn() }
}));

vi.mock('../../shared/storage.service', () => ({
  StorageService: { saveFile: vi.fn() }
}));

vi.mock('../../notifications/notifications.service', () => ({
  NotificationsService: { createNotification: vi.fn().mockResolvedValue({}) }
}));

vi.mock('../../../config/database', () => ({
  prisma: { auditLog: { create: vi.fn() } }
}));

vi.mock('../../../config/env', () => ({
  env: { APP_BASE_URL: 'http://localhost:5000' }
}));

import { InterviewService } from '../interview.service';
import { InterviewRepository } from '../interview.repository';
import { InterviewContextService } from '../interview-context.service';
import { InterviewAIService } from '../interview-ai.service';
import { ProfileRepository } from '../../profile/profile.repository';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(InterviewRepository);
const mockedContext = vi.mocked(InterviewContextService);
const mockedAI = vi.mocked(InterviewAIService);
const mockedProfileRepo = vi.mocked(ProfileRepository);
const mockedPrisma = vi.mocked(prisma, true);

const PROFILE = { id: 'profile-1', userId: 'user-1' };

const CONTEXT = {
  student: {
    studentProfileId: 'profile-1',
    fullName: 'Ada Lovelace',
    skills: [{ name: 'React', level: 80 }],
    resumeSkills: ['TypeScript'],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    previousInterviews: [],
    bio: null, careerGoal: 'Frontend Engineer', preferredRole: 'Frontend Engineer',
    gpa: null, graduationYear: null, university: null, department: null,
    resumeExcerpt: null, latestResumeAnalysis: null
  },
  job: { jobId: null, jobTitle: 'Frontend Engineer', companyName: null, description: null, requirements: null, requiredSkills: ['React', 'CSS'] }
};

const PLAN = [
  { type: 'hr', difficulty: 'medium', text: 'Q1?', expectedSkills: [] },
  { type: 'technical', difficulty: 'medium', text: 'Q2?', expectedSkills: ['React'] }
];

const EVALUATION = {
  technicalScore: 70,
  communicationScore: 80,
  problemSolvingScore: 60,
  relevanceScore: 75,
  completenessScore: 65,
  grammarScore: 85,
  feedback: 'Good answer.',
  strengths: ['clarity'],
  weaknesses: ['detail'],
  suggestedBetterAnswer: 'A model answer.',
  estimated: false
};

describe('InterviewService.startInterview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds context, stores the plan + snapshot, and persists the first question', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedContext.build.mockResolvedValue(CONTEXT as any);
    mockedAI.generatePlan.mockResolvedValue({ questions: PLAN, estimated: false } as any);
    mockedRepo.createSession.mockResolvedValue({ id: 'interview-1' } as any);

    const result = await InterviewService.startInterview('user-1', {
      interviewType: 'MIXED',
      difficulty: 'MEDIUM',
      numQuestions: 6,
      jobTitle: 'Frontend Engineer'
    });

    expect(mockedRepo.createSession).toHaveBeenCalledWith(
      PROFILE.id,
      expect.objectContaining({
        jobTitle: 'Frontend Engineer',
        interviewType: 'MIXED',
        difficulty: 'MEDIUM',
        questionPlan: PLAN,
        planEstimated: false
      })
    );
    expect(mockedRepo.createQuestion).toHaveBeenCalledWith('interview-1', 0, {
      questionType: 'hr',
      questionText: 'Q1?',
      difficulty: 'medium',
      expectedSkills: []
    });
    expect(result.mockInterviewId).toBe('interview-1');
    expect(result.totalQuestions).toBe(2);
    expect(result.question).toBe('Q1?');
  });

  it('rejects when the student profile does not exist', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(null);
    await expect(
      InterviewService.startInterview('user-x', { interviewType: 'HR', difficulty: 'EASY', numQuestions: 4, jobTitle: 'X' })
    ).rejects.toMatchObject({ statusCode: 404, errorCode: 'PROFILE_NOT_FOUND' });
  });
});

describe('InterviewService.submitAnswer', () => {
  beforeEach(() => vi.clearAllMocks());

  const SESSION = {
    id: 'interview-1',
    studentProfileId: PROFILE.id,
    status: 'IN_PROGRESS',
    numQuestions: 2,
    questionPlan: PLAN,
    contextSnapshot: CONTEXT,
    questions: [
      { questionIndex: 0, questionType: 'hr', questionText: 'Q1?', difficulty: 'medium', expectedSkills: [], answeredAt: null, answerTranscript: null }
    ]
  };

  it('evaluates the real transcript, persists the evaluation, and creates the adapted next question', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue(SESSION as any);
    mockedAI.evaluateAnswer.mockResolvedValue(EVALUATION as any);
    mockedAI.generateAdaptiveQuestion.mockResolvedValue(PLAN[1] as any);

    const result = await InterviewService.submitAnswer('user-1', 'interview-1', 0, {
      transcript: 'I am a frontend engineer with three years of experience building React apps.',
      answerMethod: 'voice',
      durationSec: 30
    });

    expect(mockedAI.evaluateAnswer).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ text: 'Q1?' }),
      expect.stringContaining('frontend engineer'),
      30
    );
    expect(mockedRepo.recordAnswer).toHaveBeenCalledWith(
      'interview-1',
      0,
      expect.objectContaining({
        answerTranscript: expect.stringContaining('frontend engineer'),
        answerMethod: 'voice',
        technicalAccuracy: 70,
        communicationScore: 80,
        suggestedBetterAnswer: 'A model answer.'
      })
    );
    expect(mockedRepo.createQuestion).toHaveBeenCalledWith('interview-1', 1, {
      questionType: 'technical',
      questionText: 'Q2?',
      difficulty: 'medium',
      expectedSkills: ['React']
    });
    expect(result.isLastQuestion).toBe(false);
    expect(result.nextQuestion).toBe('Q2?');
    expect(result.wordsPerMinute).toBeGreaterThan(0);
  });

  it('rejects an empty transcript', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue(SESSION as any);
    await expect(
      InterviewService.submitAnswer('user-1', 'interview-1', 0, { transcript: '   ', answerMethod: 'text' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects answers on sessions owned by another student', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({ ...SESSION, studentProfileId: 'someone-else' } as any);
    await expect(
      InterviewService.submitAnswer('user-1', 'interview-1', 0, { transcript: 'hi', answerMethod: 'text' })
    ).rejects.toMatchObject({ statusCode: 404, errorCode: 'INTERVIEW_NOT_FOUND' });
  });

  it('rejects answering an already-answered question', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({
      ...SESSION,
      questions: [{ ...SESSION.questions[0], answeredAt: new Date() }]
    } as any);
    await expect(
      InterviewService.submitAnswer('user-1', 'interview-1', 0, { transcript: 'hi again', answerMethod: 'text' })
    ).rejects.toMatchObject({ statusCode: 409, errorCode: 'QUESTION_ALREADY_ANSWERED' });
  });
});

describe('InterviewService.endInterview', () => {
  beforeEach(() => vi.clearAllMocks());

  const ANSWERED_QUESTION = {
    questionIndex: 0,
    questionType: 'technical',
    difficulty: 'medium',
    questionText: 'Q1?',
    expectedSkills: ['React'],
    answerTranscript: 'A thorough answer about React rendering.',
    answerMethod: 'voice',
    answerDurationSec: 40,
    answeredAt: new Date(),
    wordsPerMinute: 120,
    fillerWordCount: 1,
    technicalAccuracy: 80,
    communicationScore: 70,
    problemSolvingScore: 60,
    relevanceScore: 75,
    completenessScore: 65,
    grammarScore: 90,
    answerQualityScore: 73,
    feedback: 'Solid.',
    strengths: ['depth'],
    weaknesses: ['pace'],
    suggestedBetterAnswer: 'Model.',
    evaluationEstimated: false
  };

  const QUALITATIVE = {
    aiSummary: 'A solid interview.',
    strengths: ['depth'],
    weaknesses: ['pace'],
    missingSkills: ['CSS'],
    improvementPlan: ['practice'],
    learningRoadmap: [{ step: 1, title: 'CSS', description: 'learn it', resources: [] }],
    suggestedCourses: ['CSS Mastery'],
    recommendedProjects: ['Build a UI kit'],
    recommendedCertifications: [],
    careerRecommendations: ['Keep going'],
    suggestedQuestions: ['Explain flexbox'],
    estimated: false
  };

  const COMPLETED_SESSION = {
    id: 'interview-1',
    studentProfileId: PROFILE.id,
    status: 'IN_PROGRESS',
    difficulty: 'MEDIUM',
    jobTitle: 'Frontend Engineer',
    createdAt: new Date(Date.now() - 300_000),
    completedAt: null,
    cameraObservations: [{ at: 'x', type: 'window_blur' }, { at: 'y', type: 'window_blur' }],
    contextSnapshot: CONTEXT,
    questions: [ANSWERED_QUESTION],
    studentProfile: { id: PROFILE.id, firstName: 'Ada', lastName: 'Lovelace', userId: 'user-1' },
    reports: []
  };

  it('aggregates scores from stored rows, persists the report once, and completes the session', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue(COMPLETED_SESSION as any);
    mockedAI.synthesizeQualitative.mockResolvedValue(QUALITATIVE as any);
    mockedRepo.createReport.mockResolvedValue({ id: 'report-1', score: 73 } as any);

    const result = await InterviewService.endInterview('user-1', 'interview-1');

    const expectedOverall = Math.round((80 + 70 + 60 + 75 + 65 + 90) / 6);
    expect(mockedRepo.createReport).toHaveBeenCalledWith(
      'interview-1',
      expect.objectContaining({
        score: expectedOverall,
        technicalScore: 80,
        communicationScore: 70,
        problemSolvingScore: 60,
        estimated: false,
        cameraSummary: [{ event: 'window_blur', count: 2 }],
        questionBreakdown: expect.arrayContaining([
          expect.objectContaining({ questionText: 'Q1?', overallScore: expectedOverall })
        ])
      })
    );
    expect(mockedRepo.completeSession).toHaveBeenCalledWith('interview-1', expect.any(Number));
    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'INTERVIEW_COMPLETED' }) })
    );
    expect(result.id).toBe('report-1');
  });

  it('marks the report estimated when any per-answer evaluation was estimated', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({
      ...COMPLETED_SESSION,
      questions: [{ ...ANSWERED_QUESTION, evaluationEstimated: true }]
    } as any);
    mockedAI.synthesizeQualitative.mockResolvedValue(QUALITATIVE as any);
    mockedRepo.createReport.mockResolvedValue({ id: 'report-1' } as any);

    await InterviewService.endInterview('user-1', 'interview-1');

    expect(mockedRepo.createReport).toHaveBeenCalledWith(
      'interview-1',
      expect.objectContaining({ estimated: true, modelVersion: 'interview-final-report-v2-estimated' })
    );
  });

  it('abandons the session instead of fabricating a report when nothing was answered', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({ ...COMPLETED_SESSION, questions: [] } as any);

    await expect(InterviewService.endInterview('user-1', 'interview-1')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'INTERVIEW_NO_ANSWERS'
    });
    expect(mockedRepo.abandonSession).toHaveBeenCalledWith('interview-1');
    expect(mockedRepo.createReport).not.toHaveBeenCalled();
  });

  it('refuses to build a report when an answered question is missing evaluation fields', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({
      ...COMPLETED_SESSION,
      questions: [{ ...ANSWERED_QUESTION, communicationScore: null }]
    } as any);

    await expect(InterviewService.endInterview('user-1', 'interview-1')).rejects.toMatchObject({
      errorCode: 'INTERVIEW_REPORT_VALIDATION_FAILED'
    });
    expect(mockedRepo.createReport).not.toHaveBeenCalled();
  });
});

describe('InterviewService.addObservation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('records allow-listed observable events', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({
      id: 'interview-1', studentProfileId: PROFILE.id, status: 'IN_PROGRESS', questions: [], reports: []
    } as any);

    await InterviewService.addObservation('user-1', 'interview-1', 'face_lost');
    expect(mockedRepo.appendCameraObservation).toHaveBeenCalledWith(
      'interview-1',
      expect.objectContaining({ type: 'face_lost' })
    );
  });

  it('rejects unknown observation types', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({
      id: 'interview-1', studentProfileId: PROFILE.id, status: 'IN_PROGRESS', questions: [], reports: []
    } as any);

    await expect(InterviewService.addObservation('user-1', 'interview-1', 'cheating_detected')).rejects.toMatchObject({
      statusCode: 400
    });
  });
});

describe('InterviewService.setSharing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('only completed interviews can be shared with employers', async () => {
    mockedProfileRepo.getStudentProfile.mockResolvedValue(PROFILE as any);
    mockedRepo.getSessionById.mockResolvedValue({
      id: 'interview-1', studentProfileId: PROFILE.id, status: 'IN_PROGRESS', questions: [], reports: []
    } as any);

    await expect(InterviewService.setSharing('user-1', 'interview-1', true)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'INTERVIEW_NOT_COMPLETED'
    });
  });
});
