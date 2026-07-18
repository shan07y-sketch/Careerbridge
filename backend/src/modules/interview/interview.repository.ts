import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export class InterviewRepository {
  static async createSession(
    studentProfileId: string,
    data: {
      jobTitle: string;
      targetRole?: string;
      numQuestions: number;
      interviewType: 'HR' | 'TECHNICAL' | 'BEHAVIORAL' | 'APTITUDE' | 'MIXED';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      jobId?: string;
      companyName?: string;
      questionPlan: Prisma.InputJsonValue;
      contextSnapshot: Prisma.InputJsonValue;
      planEstimated: boolean;
    }
  ) {
    return prisma.mockInterview.create({
      data: {
        studentProfileId,
        jobTitle: data.jobTitle,
        targetRole: data.targetRole,
        numQuestions: data.numQuestions,
        interviewType: data.interviewType,
        difficulty: data.difficulty,
        jobId: data.jobId,
        companyName: data.companyName,
        questionPlan: data.questionPlan,
        contextSnapshot: data.contextSnapshot,
        planEstimated: data.planEstimated,
        status: 'IN_PROGRESS'
      }
    });
  }

  static async getSessionById(id: string) {
    return prisma.mockInterview.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { questionIndex: 'asc' } },
        reports: { orderBy: { createdAt: 'desc' }, take: 1 },
        studentProfile: { select: { id: true, firstName: true, lastName: true, userId: true } }
      }
    });
  }

  static async updateQuestionPlan(mockInterviewId: string, questionPlan: Prisma.InputJsonValue) {
    return prisma.mockInterview.update({ where: { id: mockInterviewId }, data: { questionPlan } });
  }

  static async createQuestion(
    mockInterviewId: string,
    questionIndex: number,
    data: { questionType: string; questionText: string; difficulty: string; expectedSkills: string[] }
  ) {
    return prisma.interviewQuestion.upsert({
      where: { mockInterviewId_questionIndex: { mockInterviewId, questionIndex } },
      create: {
        mockInterviewId,
        questionIndex,
        questionType: data.questionType,
        questionText: data.questionText,
        difficulty: data.difficulty,
        expectedSkills: data.expectedSkills,
        askedAt: new Date()
      },
      update: {}
    });
  }

  static async recordAnswer(
    mockInterviewId: string,
    questionIndex: number,
    data: {
      answerTranscript: string;
      answerMethod: string;
      answerDurationSec?: number;
      audioUrl?: string;
      videoUrl?: string;
      wordsPerMinute?: number | null;
      fillerWordCount?: number;
      technicalAccuracy?: number;
      communicationScore?: number;
      problemSolvingScore?: number;
      relevanceScore?: number;
      completenessScore?: number;
      grammarScore?: number;
      answerQualityScore?: number;
      feedback?: string;
      strengths?: string[];
      weaknesses?: string[];
      suggestedBetterAnswer?: string;
      evaluationEstimated?: boolean;
    }
  ) {
    const { wordsPerMinute, ...rest } = data;
    return prisma.interviewQuestion.update({
      where: { mockInterviewId_questionIndex: { mockInterviewId, questionIndex } },
      data: {
        ...rest,
        wordsPerMinute: wordsPerMinute ?? undefined,
        answeredAt: new Date()
      }
    });
  }

  static async appendCameraObservation(
    mockInterviewId: string,
    observation: { at: string; type: string; detail?: string }
  ) {
    const session = await prisma.mockInterview.findUnique({
      where: { id: mockInterviewId },
      select: { cameraObservations: true }
    });
    const existing = Array.isArray(session?.cameraObservations)
      ? (session!.cameraObservations as Prisma.JsonArray)
      : [];
    // Bound stored events so a misbehaving client cannot grow the row unboundedly.
    const next = [...existing, observation as unknown as Prisma.JsonValue].slice(-500);
    return prisma.mockInterview.update({
      where: { id: mockInterviewId },
      data: { cameraObservations: next as Prisma.InputJsonValue }
    });
  }

  static async completeSession(mockInterviewId: string, totalDurationSec: number) {
    return prisma.mockInterview.update({
      where: { id: mockInterviewId },
      data: { status: 'COMPLETED', completedAt: new Date(), totalDurationSec, questionPlan: Prisma.DbNull }
    });
  }

  static async abandonSession(mockInterviewId: string) {
    return prisma.mockInterview.update({
      where: { id: mockInterviewId },
      data: { status: 'ABANDONED', questionPlan: Prisma.DbNull }
    });
  }

  static async createReport(mockInterviewId: string, data: Omit<Prisma.MockInterviewReportUncheckedCreateInput, 'mockInterviewId'>) {
    return prisma.mockInterviewReport.create({ data: { mockInterviewId, ...data } });
  }

  static async setReportPdfUrl(reportId: string, pdfUrl: string) {
    return prisma.mockInterviewReport.update({ where: { id: reportId }, data: { pdfUrl } });
  }

  static async setSharedWithEmployers(mockInterviewId: string, shared: boolean) {
    return prisma.mockInterview.update({
      where: { id: mockInterviewId },
      data: { sharedWithEmployers: shared, sharedAt: shared ? new Date() : null }
    });
  }

  static async getHistory(studentProfileId: string) {
    return prisma.mockInterview.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' },
      include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  }

  /** Completed, student-shared sessions for a student -- employer-facing read. */
  static async getSharedSessionsForStudent(studentProfileId: string) {
    return prisma.mockInterview.findMany({
      where: { studentProfileId, sharedWithEmployers: true, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      include: {
        questions: { orderBy: { questionIndex: 'asc' } },
        reports: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }
}
