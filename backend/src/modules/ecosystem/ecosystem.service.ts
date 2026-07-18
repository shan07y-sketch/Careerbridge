/**
 * Ecosystem discovery service. PostgreSQL is the single source of truth. Every
 * method returns REAL seeded rows. The ranking layer only reorders/annotates a
 * subset -- it never invents rows. Each role gets the whole connected
 * ecosystem (scoped to what it may publicly discover), so every portal is
 * populated with multiple discovery sections. No fabricated identities,
 * ratings, or counts -- missing values are honest zero/empty.
 */
import { prisma } from '../../config/database';
import {
  rankingProvider,
  StudentSignal,
  JobSignal,
  CompanySignal,
  MentorSignal
} from '../recommendations/ranking.service';

const PUBLISHED = { status: 'PUBLISHED' as const, isDeleted: false };

async function companyRatingMap(companyIds: string[]): Promise<Record<string, number>> {
  if (!companyIds.length) return {};
  try {
    const rows = await prisma.$queryRawUnsafe<{ companyId: string; avg: number }[]>(
      `SELECT "companyId", AVG("score")::float AS avg FROM "CompanyRating" WHERE "companyId" = ANY($1) GROUP BY "companyId"`,
      companyIds
    );
    return Object.fromEntries(rows.map((r) => [r.companyId, Math.round(r.avg * 10) / 10]));
  } catch {
    return {};
  }
}

async function getStudentSignal(userId: string): Promise<StudentSignal & { profileId?: string }> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { skills: { include: { skill: true } } }
  });
  if (!profile) return {};
  return {
    profileId: profile.id,
    skills: (profile.skills || []).map((s: any) => ({ name: s.skill?.name || '', level: s.level || 0 })),
    preferredLocation: (profile.preferredLocations || [])[0] || '',
    workMode: profile.preferredWorkMode || '',
    gradYear: profile.graduationYear || undefined,
    careerGoal: profile.preferredRole || ''
  };
}

function jobToSignal(job: any): JobSignal {
  return {
    id: job.id,
    title: job.title,
    location: job.location,
    workMode: job.workMode,
    jobType: job.jobType,
    requiredSkills: (job.skillsRequired || []).map((s: any) => s.skill?.name).filter(Boolean),
    postedAt: job.createdAt
  };
}

const mapPublicStudent = (s: any) => ({
  id: s.id,
  name: [s.firstName, s.lastName].filter(Boolean).join(' '),
  avatar: s.avatarUrl || '',
  university: s.university?.name || '',
  gradYear: s.graduationYear || null,
  preferredRole: s.preferredRole || '',
  workMode: s.preferredWorkMode || '',
  skills: (s.skills || []).map((sk: any) => ({ name: sk.skill?.name || '', level: sk.level || 0 }))
});

const mapRecruiter = (r: any) => ({
  id: r.id,
  name: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.title,
  title: r.title,
  companyName: r.company?.name || ''
});

const mapJobLite = (j: any) => ({
  id: j.id,
  title: j.title,
  companyName: j.company?.name || '',
  location: j.location,
  workMode: j.workMode,
  jobType: j.jobType,
  postedAt: j.createdAt
});

const mapEvent = (e: any) => ({ id: e.id, title: e.title, scheduledAt: e.scheduledAt, location: e.location });
const mapDrive = (d: any) => ({ id: d.id, title: d.title, location: d.location, scheduledAt: d.scheduledAt, universityName: d.university?.name || '' });

export const EcosystemService = {
  async studentRecommendations(userId: string) {
    const signal = await getStudentSignal(userId);

    const [jobs, companies, mentors, recruiters, universities, events, peers] = await Promise.all([
      prisma.job.findMany({ where: PUBLISHED, include: { company: true, skillsRequired: { include: { skill: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.company.findMany({ where: { isDeleted: false }, include: { _count: { select: { jobs: { where: PUBLISHED } } } }, take: 200 }),
      prisma.mentor.findMany({ include: { studentProfile: true, _count: { select: { bookings: true } } }, take: 100 }),
      prisma.recruiter.findMany({ include: { company: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 12 }),
      prisma.university.findMany({ where: { isDeleted: false }, include: { _count: { select: { students: true } } }, orderBy: { name: 'asc' }, take: 12 }),
      prisma.event.findMany({ where: { isDeleted: false }, orderBy: { scheduledAt: 'asc' }, take: 6 }),
      prisma.studentProfile.findMany({ where: { userId: { not: userId } }, include: { university: { select: { name: true } }, skills: { include: { skill: true }, take: 6 } }, orderBy: { createdAt: 'desc' }, take: 8 })
    ]);

    const ratingMap = await companyRatingMap(companies.map((c) => c.id));

    const jobSignals = jobs.map(jobToSignal);
    const companySignals: CompanySignal[] = companies.map((c: any) => ({ id: c.id, industry: c.industry, openJobsCount: c._count?.jobs ?? 0, rating: ratingMap[c.id] ?? 0, requiredSkills: [] }));
    const mentorSignals: MentorSignal[] = mentors.map((m: any) => ({ id: m.id, expertise: m.expertise || [], rating: m.rating ?? 0, reviewsCount: m._count?.bookings ?? 0 }));

    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const companyById = new Map(companies.map((c) => [c.id, c]));
    const mentorById = new Map(mentors.map((m) => [m.id, m]));

    return {
      hasProfile: !!signal.profileId,
      totals: { jobs: jobs.length, companies: companies.length, mentors: mentors.length, recruiters: recruiters.length, universities: universities.length },
      recommendedJobs: rankingProvider.rankJobsForStudent(signal, jobSignals, 12).map((r) => {
        const j: any = jobById.get(r.item.id);
        return { id: j.id, title: j.title, companyName: j.company?.name || '', location: j.location, workMode: j.workMode, jobType: j.jobType, salaryMin: j.salaryMin, salaryMax: j.salaryMax, score: r.score, reasons: r.reasons };
      }),
      recommendedCompanies: rankingProvider.rankCompaniesForStudent(signal, companySignals, 8).map((r) => {
        const c: any = companyById.get(r.item.id);
        return { id: c.id, name: c.name, industry: c.industry, logo: c.logoUrl || '', openJobsCount: c._count?.jobs ?? 0, rating: ratingMap[c.id] ?? 0, score: r.score, reasons: r.reasons };
      }),
      recommendedMentors: rankingProvider.rankMentorsForStudent(signal, mentorSignals, 6).map((r) => {
        const m: any = mentorById.get(r.item.id); const p = m.studentProfile || {};
        return { id: m.id, name: [p.firstName, p.lastName].filter(Boolean).join(' '), avatar: p.avatarUrl || '', role: m.jobTitle, companyName: m.companyName, expertise: m.expertise || [], rating: m.rating ?? 0, score: r.score, reasons: r.reasons };
      }),
      recruiters: recruiters.map(mapRecruiter),
      universities: universities.map((u: any) => ({ id: u.id, name: u.name, location: u.location, studentCount: u._count?.students ?? 0 })),
      events: events.map(mapEvent),
      internships: jobs.filter((j: any) => j.jobType === 'INTERNSHIP').slice(0, 8).map(mapJobLite),
      peers: peers.map(mapPublicStudent)
    };
  },

  async talentPool(params: { page?: number; pageSize?: number; skill?: string; university?: string; gradYear?: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));
    const where: any = {};
    if (params.university) where.university = { name: { contains: params.university, mode: 'insensitive' } };
    if (params.gradYear) where.graduationYear = params.gradYear;
    if (params.skill) where.skills = { some: { skill: { name: { contains: params.skill, mode: 'insensitive' } } } };

    const [rows, total] = await Promise.all([
      prisma.studentProfile.findMany({ where, include: { university: { select: { name: true } }, skills: { include: { skill: true }, take: 10 } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.studentProfile.count({ where })
    ]);
    return { students: rows.map(mapPublicStudent), total, page, pageSize };
  },

  async rankCandidates(companyId: string, jobId: string, limit = 20) {
    const job = await prisma.job.findFirst({ where: { id: jobId, companyId }, include: { skillsRequired: { include: { skill: true } } } });
    if (!job) return null;
    const rows = await prisma.studentProfile.findMany({ include: { university: { select: { name: true } }, skills: { include: { skill: true }, take: 12 } }, take: 400 });
    const candidates = rows.map((s: any) => ({ ...mapPublicStudent(s), gradYear: s.graduationYear || undefined, preferredLocation: (s.preferredLocations || [])[0] || '' }));
    const ranked = rankingProvider.rankCandidatesForJob(jobToSignal(job), candidates as any, limit);
    return { job: { id: job.id, title: job.title }, candidates: ranked.map((r) => ({ ...r.item, score: r.score, reasons: r.reasons })) };
  },

  async employerOverview() {
    const nextYear = new Date().getFullYear() + 1;
    const [universities, topSkills, upcomingGraduates, events, companies, recruiters, campusDrives, studentTotal] = await Promise.all([
      prisma.university.findMany({ where: { isDeleted: false }, include: { _count: { select: { students: true } } }, orderBy: { name: 'asc' }, take: 25 }),
      prisma.studentSkill.groupBy({ by: ['skillId'], _count: { skillId: true }, orderBy: { _count: { skillId: 'desc' } }, take: 12 }),
      prisma.studentProfile.count({ where: { graduationYear: { in: [new Date().getFullYear(), nextYear] } } }),
      prisma.event.findMany({ where: { isDeleted: false }, orderBy: { scheduledAt: 'asc' }, take: 8 }),
      prisma.company.findMany({ where: { isDeleted: false }, include: { _count: { select: { jobs: { where: PUBLISHED }, recruiters: true } } }, orderBy: { name: 'asc' }, take: 18 }),
      prisma.recruiter.findMany({ include: { company: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 15 }),
      prisma.placementDrive.findMany({ where: { isDeleted: false }, include: { university: { select: { name: true } } }, orderBy: { scheduledAt: 'asc' }, take: 8 }),
      prisma.studentProfile.count()
    ]);

    const skillIds = topSkills.map((s: any) => s.skillId);
    const skillNames = await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, name: true } });
    const nameById = new Map(skillNames.map((s) => [s.id, s.name]));

    return {
      studentTotal,
      upcomingGraduates,
      universities: universities.map((u: any) => ({ id: u.id, name: u.name, studentCount: u._count?.students ?? 0 })),
      topSkills: topSkills.map((s: any) => ({ name: nameById.get(s.skillId) || '', studentCount: s._count.skillId })),
      events: events.map(mapEvent),
      companies: companies.map((c: any) => ({ id: c.id, name: c.name, industry: c.industry, logo: c.logoUrl || '', openJobsCount: c._count?.jobs ?? 0, recruiterCount: c._count?.recruiters ?? 0 })),
      recruiters: recruiters.map(mapRecruiter),
      campusDrives: campusDrives.map(mapDrive)
    };
  },

  async universityOverview(userId: string) {
    const uni = await prisma.university.findUnique({ where: { userId } });
    const uniId = uni?.id;

    const [recruiters, openJobs, recentJobs, jobsByCategory, companies, internships, campusDrives, students, employerTotal] = await Promise.all([
      prisma.recruiter.findMany({ include: { company: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 25 }),
      prisma.job.count({ where: PUBLISHED }),
      prisma.job.findMany({ where: PUBLISHED, include: { company: { select: { name: true } }, category: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 12 }),
      prisma.job.groupBy({ by: ['categoryId'], where: PUBLISHED, _count: { categoryId: true }, orderBy: { _count: { categoryId: 'desc' } }, take: 8 }),
      prisma.company.findMany({ where: { isDeleted: false }, include: { _count: { select: { jobs: { where: PUBLISHED }, recruiters: true } } }, orderBy: { name: 'asc' }, take: 18 }),
      prisma.job.findMany({ where: { ...PUBLISHED, jobType: 'INTERNSHIP' }, include: { company: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.placementDrive.findMany({ where: { isDeleted: false }, include: { university: { select: { name: true } } }, orderBy: { scheduledAt: 'asc' }, take: 8 }),
      prisma.studentProfile.findMany({ where: uniId ? { universityId: uniId } : {}, include: { university: { select: { name: true } }, skills: { include: { skill: true }, take: 6 } }, orderBy: { createdAt: 'desc' }, take: 12 }),
      prisma.company.count({ where: { isDeleted: false } })
    ]);

    const catIds = jobsByCategory.map((c: any) => c.categoryId);
    const cats = await prisma.jobCategory.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } });
    const catName = new Map(cats.map((c) => [c.id, c.name]));

    return {
      employerTotal,
      openJobsTotal: openJobs,
      recruiters: recruiters.map(mapRecruiter),
      employerActivity: recentJobs.map((j: any) => ({ id: j.id, title: j.title, companyName: j.company?.name || '', category: j.category?.name || '', postedAt: j.createdAt })),
      hiringTrends: jobsByCategory.map((c: any) => ({ category: catName.get(c.categoryId) || '', openRoles: c._count.categoryId })),
      companies: companies.map((c: any) => ({ id: c.id, name: c.name, industry: c.industry, logo: c.logoUrl || '', openJobsCount: c._count?.jobs ?? 0, recruiterCount: c._count?.recruiters ?? 0 })),
      internships: internships.map(mapJobLite),
      campusDrives: campusDrives.map(mapDrive),
      students: students.map(mapPublicStudent)
    };
  }
};
