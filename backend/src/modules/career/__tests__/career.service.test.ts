import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for Career Intelligence (Phase 3): generating an
// insight looks up the student's real context (skills, latest resume
// analysis, recent mock interview reports), forwards a structured summary to
// the AI Engine, persists the rich result, and writes an audit log entry.
// Also covers the two pre-existing read-only methods and the validation
// guard for a missing target role.

vi.mock('../career.repository', () => ({
  CareerRepository: {
    getCareerInsights: vi.fn(),
    getMockInterviewReports: vi.fn(),
    getCareerContext: vi.fn(),
    createCareerInsight: vi.fn(),
    getRoleReferenceSkills: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('../career-engine.client', () => ({
  CareerEngineClient: {
    generateInsight: vi.fn()
  }
}));

vi.mock('../../profile/profile.repository', () => ({
  ProfileRepository: {
    getStudentProfile: vi.fn()
  }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    auditLog: { create: vi.fn() }
  }
}));

import { CareerRepository } from '../career.repository';
import { CareerEngineClient } from '../career-engine.client';
import { ProfileRepository } from '../../profile/profile.repository';
import { prisma } from '../../../config/database';
import { CareerService } from '../career.service';

describe('CareerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCareerInsights / getMockInterviewReports', () => {
    it('rejects when the student profile does not exist', async () => {
      (ProfileRepository.getStudentProfile as any).mockResolvedValue(null);
      await expect(CareerService.getCareerInsights('user-1')).rejects.toThrow('Student profile not found.');
      await expect(CareerService.getMockInterviewReports('user-1')).rejects.toThrow('Student profile not found.');
    });

    it('delegates to the repository using the resolved profile id', async () => {
      (ProfileRepository.getStudentProfile as any).mockResolvedValue({ id: 'profile-1' });
      (CareerRepository.getCareerInsights as any).mockResolvedValue([{ id: 'insight-1' }]);
      const result = await CareerService.getCareerInsights('user-1');
      expect(CareerRepository.getCareerInsights).toHaveBeenCalledWith('profile-1');
      expect(result).toEqual([{ id: 'insight-1' }]);
    });
  });

  describe('generateCareerInsight', () => {
    it('rejects an empty target role', async () => {
      await expect(CareerService.generateCareerInsight('user-1', '   ')).rejects.toThrow(
        'A target role is required to generate career insights.'
      );
      expect(ProfileRepository.getStudentProfile).not.toHaveBeenCalled();
    });

    it('rejects when the student profile does not exist', async () => {
      (ProfileRepository.getStudentProfile as any).mockResolvedValue(null);
      await expect(CareerService.generateCareerInsight('user-1', 'Data Scientist')).rejects.toThrow(
        'Student profile not found.'
      );
    });

    it('builds context from skills/resume/interviews, calls the AI Engine, persists the result, and audit-logs it', async () => {
      (ProfileRepository.getStudentProfile as any).mockResolvedValue({ id: 'profile-1' });
      (CareerRepository.getCareerContext as any).mockResolvedValue({
        skills: [{ skill: { name: 'Python' } }, { skill: { name: 'SQL' } }],
        resumes: [
          {
            resumeAnalyses: [{ score: 82, summary: 'Solid data fundamentals.' }]
          }
        ],
        mockInterviews: [
          {
            jobTitle: 'Data Scientist',
            reports: [
              {
                score: 74,
                technicalScore: 70,
                hrScore: 80,
                communicationScore: 75,
                aiSummary: 'Good technical depth, work on concision.'
              }
            ]
          }
        ]
      });

      const engineResult = {
        readinessPercent: 68,
        summary: 'You are 68% ready for Data Scientist roles.',
        whyThisScore: 'Strong Python/SQL, missing production ML experience.',
        matchedSkills: ['Python', 'SQL'],
        missingSkills: ['MLOps', 'A/B Testing'],
        recommendedProjects: ['Build an end-to-end ML pipeline'],
        recommendedCourses: ['Applied ML in Production'],
        recommendedInterviewTopics: ['Statistics fundamentals'],
        roadmap: [{ title: 'Week 1', description: 'Learn MLOps basics' }]
      };
      (CareerEngineClient.generateInsight as any).mockResolvedValue(engineResult);
      (CareerRepository.createCareerInsight as any).mockResolvedValue({ id: 'insight-99', ...engineResult });

      const result = await CareerService.generateCareerInsight('user-1', 'Data Scientist');

      expect(CareerEngineClient.generateInsight).toHaveBeenCalledWith(
        'Data Scientist',
        ['Python', 'SQL'],
        expect.stringContaining('82'),
        expect.stringContaining('Data Scientist'),
        expect.any(Array)
      );
      expect(CareerRepository.createCareerInsight).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          targetRole: 'Data Scientist',
          readinessPercent: 68,
          matchedSkills: ['Python', 'SQL'],
          missingSkills: ['MLOps', 'A/B Testing']
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', action: 'CAREER_INSIGHT_GENERATED' })
        })
      );
      expect(result).toEqual({ id: 'insight-99', ...engineResult });
    });

    it('handles a student with no resume or interview history gracefully', async () => {
      (ProfileRepository.getStudentProfile as any).mockResolvedValue({ id: 'profile-2' });
      (CareerRepository.getCareerContext as any).mockResolvedValue({
        skills: [],
        resumes: [],
        mockInterviews: []
      });
      (CareerEngineClient.generateInsight as any).mockResolvedValue({
        readinessPercent: 20,
        summary: 'Just getting started.',
        whyThisScore: 'No resume or interview history yet.',
        matchedSkills: [],
        missingSkills: ['Everything relevant to the role'],
        recommendedProjects: [],
        recommendedCourses: [],
        recommendedInterviewTopics: [],
        roadmap: []
      });
      (CareerRepository.createCareerInsight as any).mockResolvedValue({ id: 'insight-1' });

      await CareerService.generateCareerInsight('user-2', 'Frontend Engineer');

      expect(CareerEngineClient.generateInsight).toHaveBeenCalledWith(
        'Frontend Engineer',
        [],
        undefined,
        undefined,
        expect.any(Array)
      );
    });
  });
});
