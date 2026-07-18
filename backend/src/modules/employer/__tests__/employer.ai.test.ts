import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression coverage for Employer AI (Phase 4): candidate evaluation and
// comparison. Both reuse Resume Intelligence / Mock Interview AI signals via
// EmployerRepository's dedicated context queries, and both must stay scoped
// to the requesting recruiter's own company -- the same ownership discipline
// as every other employer.service.ts method.

vi.mock('../employer.repository', () => ({
  EmployerRepository: {
    getCandidateEvaluationContext: vi.fn(),
    createCandidateEvaluation: vi.fn(),
    getLatestCandidateEvaluation: vi.fn(),
    getComparisonContext: vi.fn(),
    findApplicationInCompany: vi.fn(),
    findJobInCompany: vi.fn()
  }
}));

vi.mock('../employer-ai-engine.client', () => ({
  EmployerAIEngineClient: {
    evaluateCandidate: vi.fn(),
    compareCandidates: vi.fn()
  }
}));

vi.mock('../../../config/database', () => ({
  prisma: {
    recruiter: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}));

import { EmployerService } from '../employer.service';
import { EmployerRepository } from '../employer.repository';
import { EmployerAIEngineClient } from '../employer-ai-engine.client';
import { prisma } from '../../../config/database';

const mockedRepo = vi.mocked(EmployerRepository);
const mockedEngine = vi.mocked(EmployerAIEngineClient);
const mockedPrisma = vi.mocked(prisma, true);

const RECRUITER = { id: 'recruiter-1', companyId: 'company-1', userId: 'user-recruiter-1' };

describe('EmployerService (Employer AI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.recruiter.findUnique.mockResolvedValue(RECRUITER as any);
  });

  describe('evaluateCandidate', () => {
    it('rejects when the application does not belong to the recruiter company', async () => {
      mockedRepo.getCandidateEvaluationContext.mockResolvedValue(null);
      await expect(EmployerService.evaluateCandidate('user-recruiter-1', 'app-1')).rejects.toThrow(
        'Candidate application not found or unauthorized.'
      );
    });

    it('builds context, calls the AI Engine, persists the evaluation, and audit-logs it', async () => {
      mockedRepo.getCandidateEvaluationContext.mockResolvedValue({
        id: 'app-1',
        job: { id: 'job-1', title: 'Backend Engineer', description: 'Build APIs', requirements: 'Node, Postgres' },
        studentProfile: {
          skills: [{ skill: { name: 'Node.js' } }, { skill: { name: 'PostgreSQL' } }],
          resumes: [{ resumeAnalyses: [{ score: 88, summary: 'Strong backend fundamentals.' }] }],
          mockInterviews: [
            {
              jobTitle: 'Backend Engineer',
              reports: [{ score: 80, technicalScore: 85, hrScore: 75, communicationScore: 78, aiSummary: 'Solid technical answers.' }]
            }
          ]
        }
      } as any);

      const engineResult = {
        fitScore: 82,
        recommendation: 'Yes',
        summary: 'Strong technical match for this backend role.',
        strengths: ['Node.js depth'],
        concerns: ['Limited large-scale system design experience'],
        skillsMatch: ['Node.js', 'PostgreSQL'],
        skillsGap: ['Kubernetes'],
        interviewSignal: 'Performed well on technical questions.'
      };
      mockedEngine.evaluateCandidate.mockResolvedValue(engineResult as any);
      mockedRepo.createCandidateEvaluation.mockResolvedValue({ id: 'eval-1', ...engineResult } as any);

      const result = await EmployerService.evaluateCandidate('user-recruiter-1', 'app-1');

      expect(mockedEngine.evaluateCandidate).toHaveBeenCalledWith(
        'Backend Engineer',
        'Build APIs',
        'Node, Postgres',
        ['Node.js', 'PostgreSQL'],
        expect.stringContaining('88'),
        expect.stringContaining('Backend Engineer')
      );
      expect(mockedRepo.createCandidateEvaluation).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({ fitScore: 82, recommendation: 'Yes', modelVersion: 'candidate-evaluation-v1' })
      );
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CANDIDATE_EVALUATION_GENERATED' })
        })
      );
      expect(result).toEqual({ id: 'eval-1', ...engineResult });
    });

    it('handles a candidate with no resume or interview history gracefully', async () => {
      mockedRepo.getCandidateEvaluationContext.mockResolvedValue({
        id: 'app-2',
        job: { id: 'job-1', title: 'Frontend Engineer', description: 'Build UIs', requirements: 'React' },
        studentProfile: { skills: [], resumes: [], mockInterviews: [] }
      } as any);
      mockedEngine.evaluateCandidate.mockResolvedValue({
        fitScore: 10,
        recommendation: 'No',
        summary: 'Insufficient data.',
        strengths: [],
        concerns: ['No resume or interview data available'],
        skillsMatch: [],
        skillsGap: ['React'],
        interviewSignal: null
      } as any);
      mockedRepo.createCandidateEvaluation.mockResolvedValue({ id: 'eval-2' } as any);

      await EmployerService.evaluateCandidate('user-recruiter-1', 'app-2');

      expect(mockedEngine.evaluateCandidate).toHaveBeenCalledWith(
        'Frontend Engineer',
        'Build UIs',
        'React',
        [],
        undefined,
        undefined
      );
    });
  });

  describe('getLatestEvaluation', () => {
    it('rejects when the application is not owned by the recruiter company', async () => {
      mockedRepo.findApplicationInCompany.mockResolvedValue(null);
      await expect(EmployerService.getLatestEvaluation('user-recruiter-1', 'app-1')).rejects.toThrow(
        'Candidate application details not found or unauthorized.'
      );
    });

    it('returns the latest evaluation scoped to the company', async () => {
      mockedRepo.findApplicationInCompany.mockResolvedValue({ id: 'app-1' } as any);
      mockedRepo.getLatestCandidateEvaluation.mockResolvedValue({ id: 'eval-1', fitScore: 70 } as any);

      const result = await EmployerService.getLatestEvaluation('user-recruiter-1', 'app-1');

      expect(mockedRepo.getLatestCandidateEvaluation).toHaveBeenCalledWith('company-1', 'app-1');
      expect(result).toEqual({ id: 'eval-1', fitScore: 70 });
    });
  });

  describe('compareCandidates', () => {
    it('rejects fewer than two candidate ids', async () => {
      await expect(EmployerService.compareCandidates('user-recruiter-1', 'job-1', ['app-1'])).rejects.toThrow(
        'Select at least two candidates to compare.'
      );
    });

    it('rejects a job not owned by the recruiter company', async () => {
      mockedRepo.findJobInCompany.mockResolvedValue(null);
      await expect(
        EmployerService.compareCandidates('user-recruiter-1', 'job-1', ['app-1', 'app-2'])
      ).rejects.toThrow('Job not found or unauthorized.');
    });

    it('rejects when fewer than two supplied candidates actually belong to the job', async () => {
      mockedRepo.findJobInCompany.mockResolvedValue({ id: 'job-1', title: 'Backend Engineer' } as any);
      mockedRepo.getComparisonContext.mockResolvedValue([{ id: 'app-1' }] as any);

      await expect(
        EmployerService.compareCandidates('user-recruiter-1', 'job-1', ['app-1', 'app-2'])
      ).rejects.toThrow('At least two of the supplied candidates must belong to this job.');
    });

    it('builds candidate contexts, calls the AI Engine, and audit-logs the comparison', async () => {
      mockedRepo.findJobInCompany.mockResolvedValue({
        id: 'job-1',
        title: 'Backend Engineer',
        description: 'Build APIs',
        requirements: 'Node, Postgres'
      } as any);
      mockedRepo.getComparisonContext.mockResolvedValue([
        {
          id: 'app-1',
          studentProfile: {
            firstName: 'Ada',
            lastName: 'Lovelace',
            skills: [{ skill: { name: 'Node.js' } }],
            resumes: [{ resumeAnalyses: [{ score: 90, summary: 'Excellent.' }] }],
            mockInterviews: []
          }
        },
        {
          id: 'app-2',
          studentProfile: {
            firstName: 'Grace',
            lastName: 'Hopper',
            skills: [{ skill: { name: 'PostgreSQL' } }],
            resumes: [],
            mockInterviews: []
          }
        }
      ] as any);

      const comparisonResult = {
        rankings: [
          { candidateId: 'app-1', rank: 1, fitScore: 90, summary: 'Best overall match.' },
          { candidateId: 'app-2', rank: 2, fitScore: 70, summary: 'Solid but less experienced.' }
        ],
        overallRecommendation: 'Ada is the stronger candidate for this role.'
      };
      mockedEngine.compareCandidates.mockResolvedValue(comparisonResult as any);

      const result = await EmployerService.compareCandidates('user-recruiter-1', 'job-1', ['app-1', 'app-2']);

      expect(mockedEngine.compareCandidates).toHaveBeenCalledWith(
        'Backend Engineer',
        'Build APIs',
        'Node, Postgres',
        expect.arrayContaining([
          expect.objectContaining({ candidateId: 'app-1', name: 'Ada Lovelace', skills: ['Node.js'] }),
          expect.objectContaining({ candidateId: 'app-2', name: 'Grace Hopper', skills: ['PostgreSQL'] })
        ])
      );
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CANDIDATES_COMPARED' }) })
      );
      expect(result).toEqual(comparisonResult);
    });
  });
});
