import { Router } from 'express';
import { prisma } from '../config/database';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';

const router = Router();

/**
 * Shared read-only directory endpoints (companies, recruiters, mentors,
 * peers) used across roles. PostgreSQL is the single source of truth: every
 * field below is a real column or a real computed count. Where the schema
 * genuinely has no value yet (a company rating, a recruiter avatar) we return
 * an honest empty/zero value and let the UI show its own empty state. We do
 * NOT fabricate identities, avatars, ratings, photos, or phone numbers --
 * the previous version of this file invented "Christy Owens"/"Sarah Lin" from
 * email substrings and stamped every company with rating 4.8 / 3 open jobs.
 */

// Only PUBLISHED, non-deleted jobs count as a company's "open jobs".
const OPEN_JOBS_FILTER = { where: { status: 'PUBLISHED' as const, isDeleted: false } };

function mapCompany(company: any) {
  return {
    id: company.id,
    name: company.name,
    logo: company.logoUrl || '',
    banner: company.coverImageUrl || '',
    employeeCount: typeof company.size === 'number' ? `${company.size.toLocaleString()} employees` : '',
    location: company.headquarters || '',
    industry: company.industry || '',
    description: company.description || '',
    culturePhotos: Array.isArray(company.galleryImages) ? company.galleryImages : [],
    openJobsCount: company._count?.jobs ?? 0,
    rating: 0, // No rating/review system exists yet -- 0 means "unrated".
    website: company.website || ''
  };
}

function mapRecruiter(recruiter: any) {
  const name = [recruiter.firstName, recruiter.lastName].filter(Boolean).join(' ')
    || recruiter.user?.email
    || '';
  return {
    id: recruiter.id,
    name,
    companyId: recruiter.companyId,
    companyName: recruiter.company?.name || '',
    avatar: '', // No avatar column on Recruiter -- the UI renders initials.
    bio: recruiter.title || '', // Real job title; there is no bio column.
    activeJobs: Array.isArray(recruiter.jobs) ? recruiter.jobs.map((j: any) => j.id) : [],
    email: recruiter.user?.email || '',
    phone: recruiter.phone || ''
  };
}

function mapMentor(mentor: any) {
  const profile = mentor.studentProfile || {};
  return {
    id: mentor.id,
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '',
    avatar: profile.avatarUrl || '',
    role: mentor.jobTitle || '',
    companyName: mentor.companyName || '',
    expertise: Array.isArray(mentor.expertise) ? mentor.expertise : [],
    bio: mentor.bio || '',
    rating: typeof mentor.rating === 'number' ? mentor.rating : 0,
    reviewsCount: mentor._count?.bookings ?? 0,
    availabilitySlots: [] // No availability model yet -- honest empty.
  };
}

const RECRUITER_INCLUDE = {
  company: true,
  user: { select: { email: true } },
  jobs: { where: { isDeleted: false }, select: { id: true } }
};

// GET /companies
router.get('/companies', catchAsync(async (_req, res) => {
  const companies = await prisma.company.findMany({
    where: { isDeleted: false },
    include: { _count: { select: { jobs: OPEN_JOBS_FILTER } } },
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data: companies.map(mapCompany) });
}));

// GET /companies/:id
router.get('/companies/:id', catchAsync(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { jobs: OPEN_JOBS_FILTER } } }
  });
  if (!company || company.isDeleted) {
    throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }
  res.json({ success: true, data: mapCompany(company) });
}));

// GET /recruiters -- recruiter directory (student Network "Verified Recruiters")
router.get('/recruiters', catchAsync(async (_req, res) => {
  const recruiters = await prisma.recruiter.findMany({
    include: RECRUITER_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ success: true, data: recruiters.map(mapRecruiter) });
}));

// GET /recruiters/:id
router.get('/recruiters/:id', catchAsync(async (req, res) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: { id: req.params.id },
    include: RECRUITER_INCLUDE
  });
  if (!recruiter) {
    throw new AppError('Recruiter not found', 404, 'RECRUITER_NOT_FOUND');
  }
  res.json({ success: true, data: mapRecruiter(recruiter) });
}));

// GET /recruiters/company/:companyId
router.get('/recruiters/company/:companyId', catchAsync(async (req, res) => {
  const recruiter = await prisma.recruiter.findFirst({
    where: { companyId: req.params.companyId },
    include: RECRUITER_INCLUDE
  });
  res.json({ success: true, data: recruiter ? mapRecruiter(recruiter) : null });
}));

// GET /mentors
router.get('/mentors', catchAsync(async (_req, res) => {
  const mentors = await prisma.mentor.findMany({
    include: { studentProfile: true, _count: { select: { bookings: true } } },
    orderBy: { rating: 'desc' },
    take: 100
  });
  res.json({ success: true, data: mentors.map(mapMentor) });
}));

// GET /mentors/:id
router.get('/mentors/:id', catchAsync(async (req, res) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: req.params.id },
    include: { studentProfile: true, _count: { select: { bookings: true } } }
  });
  if (!mentor) {
    throw new AppError('Mentor not found', 404, 'MENTOR_NOT_FOUND');
  }
  res.json({ success: true, data: mapMentor(mentor) });
}));

// GET /peers -- lightweight directory of other students for networking.
router.get('/peers', catchAsync(async (_req, res) => {
  const students = await prisma.studentProfile.findMany({
    include: {
      university: { select: { name: true } },
      skills: { include: { skill: true }, take: 8 }
    },
    orderBy: { createdAt: 'desc' },
    take: 48
  });
  const peers = students.map((s: any) => ({
    id: s.id,
    name: [s.firstName, s.lastName].filter(Boolean).join(' ') || '',
    email: '',
    university: s.university?.name || '',
    degree: '',
    gradYear: s.graduationYear || 0,
    profilePicture: s.avatarUrl || '',
    careerGoal: s.preferredRole || '',
    workMode: 'On-site',
    preferredLocation: (s.preferredLocations || []).join('; '),
    skills: (s.skills || []).map((sk: any) => ({ name: sk.skill?.name || '', level: sk.level || 0 })),
    resumeScore: 0,
    readinessScore: 0,
    linkedInConnected: false,
    gitHubConnected: false,
    phoneVerified: false,
    emailVerified: false
  }));
  res.json({ success: true, data: peers });
}));

export default router;
