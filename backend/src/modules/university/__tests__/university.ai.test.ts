import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for University AI (Phase 5): placement prediction,
// department analytics insight, campus drive recommendations, and executive
// placement reports. All reuse Resume Intelligence / Mock Interview AI
// signals via UniversityRepository's dedicated context queries, and all must
// stay scoped to the requesting university's own students/data -- the same
// ownership discipline as every other university.service.ts method.

vi.mock('../university.repository', () => ({
  UniversityRepository: {
    findStudentInUniversity: vi.fn(),
    getPlacementPredictionContext: vi.fn(),
    createStudentPlacementInsight: vi.fn(),
    getLatestStudentPlacementInsight: vi.fn(),
    getAnalytics: vi.fn(),
    getDriveRecommendationContext: vi.fn()
  }
}));

vi.mock('../university-ai-engine.client', () => ({
  UniversityAIEngineClient: {
    predictStudentPlacement: vi.fn(),
    generateDepartmentInsight: vi.fn(),
    recommendDrives: vi.fn(),
    generatePlacementReport: vi.fn()
  }
}));

vi.mock('../campus-drive.service', () => ({
  CampusDriveService: {
    getDrives: vi.fn(),
    createDrive: vi.fn(),
    updateDrive: vi.fn(),
    deleteDrive: vi.fn()
  }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    auditLog: { create: vi.fn() },
    studentProfile: { findMany: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    supportTicket: { create: vi.fn() },
    notification: { createMany: vi.fn() }
  }
}));

import { UniversityService } from '../university.service';
import { UniversityRepository } from '../university.repository';
import { UniversityAIEngineClient } from '../university-ai-engine.client';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(UniversityRepository);
const mockedEngine = vi.mocked(UniversityAIEngineClient);
const mockedPrisma = vi.mocked(prisma, true);

describe('UniversityService (University AI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assessStudentPlacement', () => {
    it('rejects when the student does not belong to this university', async () => {
      mockedRepo.getPlacementPredictionContext.mockResolvedValue(null);
      await expect(
        UniversityService.assessStudentPlacement('user-1', 'univ-1', 'student-1')
      ).rejects.toThrow('Student not found in this university.');
    });

    it('builds context, calls the AI Engine, persists the insight, and audit-logs it', async () => {
      mockedRepo.getPlacementPredictionContext.mockResolvedValue({
        id: 'student-1',
        firstName: 'Ada',
        graduationYear: 2026,
        currentGpa: 3.8,
        department: { name: 'Computer Science' },
        skills: [{ skill: { name: 'Python' } }, { skill: { name: 'SQL' } }],
        resumes: [{ resumeAnalyses: [{ score: 85, summary: 'Strong fundamentals.' }] }],
        mockInterviews: [
          {
            jobTitle: 'Backend Engineer',
            reports: [{ score: 80, technicalScore: 82, hrScore: 75, communicationScore: 78, aiSummary: 'Confident answers.' }]
          }
        ]
      } as any);

      const engineResult = {
        placementProbability: 78,
        riskLevel: 'Low',
        summary: 'Strong placement outlook.',
        riskFactors: [],
        strengths: ['Solid technical fundamentals'],
        suggestedActions: ['Apply to more backend-focused roles']
      };
      mockedEngine.predictStudentPlacement.mockResolvedValue(engineResult as any);
      mockedRepo.createStudentPlacementInsight.mockResolvedValue({ id: 'insight-1', ...engineResult } as any);

      const result = await UniversityService.assessStudentPlacement('user-1', 'univ-1', 'student-1');

      expect(mockedEngine.predictStudentPlacement).toHaveBeenCalledWith(
        'Ada',
        'Computer Science',
        2026,
        3.8,
        ['Python', 'SQL'],
        expect.stringContaining('85'),
        expect.stringContaining('Backend Engineer')
      );
      expect(mockedRepo.createStudentPlacementInsight).toHaveBeenCalledWith(
        'student-1',
        expect.objectContaining({ placementProbability: 78, riskLevel: 'Low', modelVersion: 'student-placement-v1' })
      );
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'STUDENT_PLACEMENT_INSIGHT_GENERATED' }) })
      );
      expect(result).toEqual({ id: 'insight-1', ...engineResult });
    });

    it('handles a student with no resume or interview history gracefully', async () => {
      mockedRepo.getPlacementPredictionContext.mockResolvedValue({
        id: 'student-2',
        firstName: 'Grace',
        graduationYear: 2027,
        currentGpa: null,
        department: null,
        skills: [],
        resumes: [],
        mockInterviews: []
      } as any);
      mockedEngine.predictStudentPlacement.mockResolvedValue({
        placementProbability: 20,
        riskLevel: 'High',
        summary: 'Insufficient data.',
        riskFactors: ['No resume or interview data available'],
        strengths: [],
        suggestedActions: ['Upload a resume', 'Complete a mock interview']
      } as any);
      mockedRepo.createStudentPlacementInsight.mockResolvedValue({ id: 'insight-2' } as any);

      await UniversityService.assessStudentPlacement('user-1', 'univ-1', 'student-2');

      expect(mockedEngine.predictStudentPlacement).toHaveBeenCalledWith(
        'Grace',
        undefined,
        2027,
        null,
        [],
        undefined,
        undefined
      );
    });
  });

  describe('getLatestStudentInsight', () => {
    it('rejects when the student is not owned by the university', async () => {
      mockedRepo.findStudentInUniversity.mockResolvedValue(null);
      await expect(UniversityService.getLatestStudentInsight('univ-1', 'student-1')).rejects.toThrow(
        'Student not found in this university.'
      );
    });

    it('returns the latest insight scoped to the university', async () => {
      mockedRepo.findStudentInUniversity.mockResolvedValue({ id: 'student-1' } as any);
      mockedRepo.getLatestStudentPlacementInsight.mockResolvedValue({ id: 'insight-1', placementProbability: 70 } as any);

      const result = await UniversityService.getLatestStudentInsight('univ-1', 'student-1');

      expect(mockedRepo.getLatestStudentPlacementInsight).toHaveBeenCalledWith('univ-1', 'student-1');
      expect(result).toEqual({ id: 'insight-1', placementProbability: 70 });
    });
  });

  describe('generateDepartmentInsight', () => {
    it('summarizes analytics, calls the AI Engine, and audit-logs the insight', async () => {
      mockedRepo.getAnalytics.mockResolvedValue({
        placementPercentage: 65,
        totalStudents: 200,
        studentsPlaced: 130,
        averageSalary: 75000,
        highestPackage: 150000,
        hiringTrends: [{ year: '2025', placements: 60 }],
        departmentBreakdown: [{ departmentId: 'd1', departmentName: 'CS', placed: 80, total: 100, placementPercentage: 80 }]
      } as any);

      const engineResult = {
        insights: ['CS department leads placements.'],
        recommendations: ['Focus outreach on lower-performing departments.'],
        outlookSummary: 'Overall placement outlook is positive.'
      };
      mockedEngine.generateDepartmentInsight.mockResolvedValue(engineResult as any);

      const result = await UniversityService.generateDepartmentInsight('user-1', 'univ-1');

      expect(mockedEngine.generateDepartmentInsight).toHaveBeenCalledWith(expect.stringContaining('65%'));
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'DEPARTMENT_INSIGHT_GENERATED' }) })
      );
      expect(result).toEqual(engineResult);
    });
  });

  describe('recommendCampusDrives', () => {
    it('summarizes skill/analytics context, calls the AI Engine, and audit-logs the recommendation', async () => {
      mockedRepo.getDriveRecommendationContext.mockResolvedValue({
        topSkills: [{ name: 'Python', count: 40 }],
        analytics: {
          hiringTrends: [{ year: '2025', placements: 60 }],
          departmentBreakdown: [{ departmentName: 'CS', placementPercentage: 80 }]
        },
        pastDrives: [{ title: 'Tech Recruit Day 2025' }]
      } as any);

      const engineResult = {
        recommendedDrives: [{ targetRole: 'Backend Engineer', reason: 'High Python skill concentration.', priority: 'High' }],
        summary: 'Focus on backend-heavy drives next cycle.'
      };
      mockedEngine.recommendDrives.mockResolvedValue(engineResult as any);

      const result = await UniversityService.recommendCampusDrives('user-1', 'univ-1');

      expect(mockedEngine.recommendDrives).toHaveBeenCalledWith(expect.stringContaining('Python'));
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CAMPUS_DRIVE_RECOMMENDATIONS_GENERATED' }) })
      );
      expect(result).toEqual(engineResult);
    });
  });

  describe('generatePlacementReport', () => {
    it('summarizes analytics, calls the AI Engine, and audit-logs the report', async () => {
      mockedRepo.getAnalytics.mockResolvedValue({
        placementPercentage: 65,
        totalStudents: 200,
        studentsPlaced: 130,
        averageSalary: 75000,
        highestPackage: 150000,
        hiringTrends: [{ year: '2025', placements: 60 }],
        departmentBreakdown: [{ departmentId: 'd1', departmentName: 'CS', placed: 80, total: 100, placementPercentage: 80 }]
      } as any);

      const engineResult = {
        executiveSummary: 'Placement performance is trending upward.',
        keyFindings: ['CS department leads placements.'],
        recommendations: ['Increase outreach to underperforming departments.']
      };
      mockedEngine.generatePlacementReport.mockResolvedValue(engineResult as any);

      const result = await UniversityService.generatePlacementReport('user-1', 'univ-1');

      expect(mockedEngine.generatePlacementReport).toHaveBeenCalledWith(expect.stringContaining('65%'));
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'PLACEMENT_REPORT_GENERATED' }) })
      );
      expect(result).toEqual(engineResult);
    });
  });
});
