import { prisma } from '../../config/database';

/**
 * InterviewContextService: assembles everything the AI interviewer is allowed
 * to know about the candidate and the targeted job BEFORE the first question
 * is generated. The assembled snapshot is frozen onto the MockInterview row
 * (contextSnapshot) so a report is always traceable to exactly what the AI saw.
 */

export interface StudentInterviewContext {
  studentProfileId: string;
  fullName: string;
  bio: string | null;
  careerGoal: string | null;
  preferredRole: string | null;
  gpa: number | null;
  graduationYear: number | null;
  university: string | null;
  department: string | null;
  skills: { name: string; level: number }[];
  certifications: { name: string; issuingOrg: string }[];
  projects: { title: string; description: string }[];
  experience: { companyName: string; roleTitle: string; description: string | null }[];
  education: { institution: string; degree: string; fieldOfStudy: string }[];
  resumeExcerpt: string | null;
  resumeSkills: string[];
  latestResumeAnalysis: { score: number; summary: string } | null;
  previousInterviews: {
    jobTitle: string;
    interviewType: string;
    difficulty: string;
    overallScore: number | null;
    weaknesses: string[];
  }[];
}

export interface JobInterviewContext {
  jobId: string | null;
  jobTitle: string;
  companyName: string | null;
  description: string | null;
  requirements: string | null;
  requiredSkills: string[];
}

export interface InterviewContext {
  student: StudentInterviewContext;
  job: JobInterviewContext;
}

const RESUME_EXCERPT_MAX_CHARS = 4000;

export class InterviewContextService {
  static async build(
    studentProfileId: string,
    options: { jobId?: string; jobTitle?: string; companyName?: string }
  ): Promise<InterviewContext> {
    const [profile, activeResume, latestAnalysis, previousSessions] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        include: {
          university: true,
          department: true,
          skills: { include: { skill: true } },
          certifications: true,
          projects: true,
          experienceHistory: true,
          educationHistory: true
        }
      }),
      prisma.resume.findFirst({
        where: { studentProfileId, isActive: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.resumeAnalysis.findFirst({
        where: { studentProfileId },
        orderBy: { generatedAt: 'desc' }
      }),
      prisma.mockInterview.findMany({
        where: { studentProfileId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 3,
        include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } }
      })
    ]);

    if (!profile) {
      throw new Error(`Student profile ${studentProfileId} not found while building interview context.`);
    }

    const student: StudentInterviewContext = {
      studentProfileId,
      fullName: `${profile.firstName} ${profile.lastName}`.trim(),
      bio: profile.bio,
      careerGoal: profile.careerPath ?? profile.preferredRole,
      preferredRole: profile.preferredRole,
      gpa: profile.currentGpa,
      graduationYear: profile.graduationYear,
      university: profile.university?.name ?? null,
      department: profile.department?.name ?? null,
      skills: profile.skills.map(s => ({ name: s.skill.name, level: s.level })),
      certifications: profile.certifications.map(c => ({ name: c.name, issuingOrg: c.issuingOrg })),
      projects: profile.projects.map(p => ({ title: p.title, description: p.description.slice(0, 400) })),
      experience: profile.experienceHistory.map(e => ({
        companyName: e.companyName,
        roleTitle: e.roleTitle,
        description: e.description ? e.description.slice(0, 300) : null
      })),
      education: profile.educationHistory.map(e => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy
      })),
      resumeExcerpt: activeResume?.parsedText ? activeResume.parsedText.slice(0, RESUME_EXCERPT_MAX_CHARS) : null,
      resumeSkills: activeResume?.extractedSkills ?? [],
      latestResumeAnalysis: latestAnalysis
        ? { score: latestAnalysis.score, summary: latestAnalysis.summary.slice(0, 600) }
        : null,
      previousInterviews: previousSessions.map(s => ({
        jobTitle: s.jobTitle,
        interviewType: (s as any).interviewType ?? 'MIXED',
        difficulty: (s as any).difficulty ?? 'MEDIUM',
        overallScore: s.reports[0]?.score ?? null,
        weaknesses: (s.reports[0] as any)?.weaknesses ?? []
      }))
    };

    let job: JobInterviewContext;
    if (options.jobId) {
      const dbJob = await prisma.job.findUnique({
        where: { id: options.jobId },
        include: { company: true, skillsRequired: { include: { skill: true } } }
      });
      if (!dbJob) {
        throw new Error(`Job ${options.jobId} not found while building interview context.`);
      }
      job = {
        jobId: dbJob.id,
        jobTitle: dbJob.title,
        companyName: dbJob.company.name,
        description: dbJob.description.slice(0, 2500),
        requirements: dbJob.requirements.slice(0, 2000),
        requiredSkills: dbJob.skillsRequired.map(js => js.skill.name)
      };
    } else {
      job = {
        jobId: null,
        jobTitle: options.jobTitle || student.preferredRole || 'Software Engineer',
        companyName: options.companyName ?? null,
        description: null,
        requirements: null,
        requiredSkills: []
      };
    }

    return { student, job };
  }
}
