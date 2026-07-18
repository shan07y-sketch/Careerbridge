import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Seeded users all share the password published in credentials.json. The
// Python generator emits a non-bcrypt placeholder hash, so we swap in a real
// bcrypt hash here so seeded accounts can actually authenticate.
const SEEDED_PASSWORD = 'seeded_user_password123';
const seededPasswordHash = bcrypt.hashSync(SEEDED_PASSWORD, 10);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Coerce any value to a Date; returns undefined when not parsable. */
function toDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  const str = String(val);
  // pad "YYYY-MM-DD" → full ISO so new Date() parses it as UTC
  const padded = str.length === 10 ? `${str}T00:00:00.000Z` : str;
  const d = new Date(padded);
  return isNaN(d.getTime()) ? undefined : d;
}

/** JSON-stringify arrays/objects; passthrough strings/nulls. */
function toText(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v) || typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Coerce company size string → integer or null. */
function sizeToInt(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const str = String(v).toLowerCase();
  if (str.includes('enterprise') || str.includes('large')) return 10000;
  if (str.includes('mid')) return 1000;
  if (str.includes('small')) return 200;
  if (str.includes('startup')) return 50;
  const n = parseInt(str, 10);
  return isNaN(n) ? null : n;
}

/**
 * Map seed data user roles to valid Prisma UserRole enum values.
 * Prisma schema: STUDENT | EMPLOYER | UNIVERSITY | ADMIN
 * Seed data uses: STUDENT | RECRUITER | UNIVERSITY | ADMIN
 */
function mapUserRole(role: string): string {
  const map: Record<string, string> = {
    STUDENT: 'STUDENT',
    RECRUITER: 'EMPLOYER', // Prisma has no RECRUITER role; map to EMPLOYER
    EMPLOYER: 'EMPLOYER',
    UNIVERSITY: 'UNIVERSITY',
    ADMIN: 'ADMIN',
  };
  return map[role?.toUpperCase()] ?? 'STUDENT';
}

/** Extract a short error message from a Prisma/Node error object. */
function errMsg(err: any): string {
  const raw = err?.message ?? String(err);
  // Prisma error messages include context after the first newline; take first line
  const first = raw.split('\n').find((l: string) => l.trim().length > 0) ?? raw;
  return first.trim().slice(0, 200);
}

// ──────────────────────────────────────────────
// Table definitions – STRICT topological order:
//   Company → User → University → Department →
//   StudentProfile → Recruiter →
//   JobCategory → Job →
//   Skill → StudentSkill / JobSkill →
//   Education / Experience / Project / Certification / Resume →
//   Application → Interview →
//   Conversation → ConversationParticipant / Message →
//   Notification → CareerInsight → ResumeAnalysis →
//   MockInterview → MockInterviewReport
// ──────────────────────────────────────────────

type TableDef = {
  name: string;
  file: string;
  prismaName: string;
  compositePk?: string;         // e.g. 'studentProfileId_skillId'
  /**
   * Unique constraint name (other than id) to use for upsert.
   * e.g. 'studentProfileId_jobId' maps to @@unique([studentProfileId, jobId])
   */
  uniqueKey?: string;
  transform: (r: Record<string, any>) => Record<string, any> | null;
};

const tables: TableDef[] = [
  // ── Level 0: no FK deps ──
  {
    name: 'Company',
    file: 'companies.json',
    prismaName: 'company',
    transform: (r) => ({
      id: r.id,
      name: r.name,
      logoUrl: r.logoUrl ?? null,
      website: r.website ?? null,
      industry: r.industry ?? 'Technology',
      description: r.description ?? '',
      size: sizeToInt(r.size),
      headquarters: r.headquarters ?? null,
    }),
  },
  {
    name: 'JobCategory',
    file: 'job_categories.json',
    prismaName: 'jobCategory',
    transform: (r) => ({ id: r.id, name: r.name }),
  },
  {
    name: 'Skill',
    file: 'skills.json',
    prismaName: 'skill',
    transform: (r) => ({ id: r.id, name: r.name }),
  },
  {
    name: 'Conversation',
    file: 'conversations.json',
    prismaName: 'conversation',
    transform: (r) => ({ id: r.id }),
  },

  // ── Level 1: User depends on Company (optional) ──
  {
    name: 'User',
    file: 'users.json',
    prismaName: 'user',
    transform: (r) => ({
      id: r.id,
      email: r.email,
      passwordHash:
        r.passwordHash && r.passwordHash.startsWith('$2')
          ? r.passwordHash
          : seededPasswordHash,
      role: mapUserRole(r.role),
      isVerified: r.isVerified ?? true,
      companyId: r.companyId ?? null,
    }),
  },

  // ── Level 2: University depends on User ──
  {
    name: 'University',
    file: 'universities.json',
    prismaName: 'university',
    transform: (r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      logoUrl: r.logoUrl ?? null,
      location: r.location ?? '',
    }),
  },

  // ── Level 3: Department depends on University ──
  {
    name: 'Department',
    file: 'departments.json',
    prismaName: 'department',
    transform: (r) => ({
      id: r.id,
      universityId: r.universityId,
      name: r.name,
    }),
  },

  // ── Level 4: StudentProfile depends on User + University + Department ──
  {
    name: 'StudentProfile',
    file: 'students.json',
    prismaName: 'studentProfile',
    transform: (r) => ({
      id: r.id,
      userId: r.userId,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone ?? null,
      avatarUrl: r.avatarUrl ?? null,
      bio: r.bio ?? null,
      currentGpa: r.currentGpa ?? null,
      universityId: r.universityId ?? null,
      departmentId: r.departmentId ?? null,
      graduationYear: r.graduationYear ?? null,
      preferredRole: r.preferredRole ?? null,
      preferredWorkMode: r.preferredWorkMode ?? null,
      preferredLocations: Array.isArray(r.preferredLocations) ? r.preferredLocations : [],
      ...(r.verificationStatus ? { verificationStatus: r.verificationStatus } : {}),
    }),
  },

  // ── Level 4b: PlacementDrive depends on University ──
  {
    name: 'PlacementDrive',
    file: 'placement_drives.json',
    prismaName: 'placementDrive',
    transform: (r) => ({
      id: r.id,
      universityId: r.universityId,
      title: r.title,
      description: r.description ?? '',
      location: r.location ?? '',
      scheduledAt: toDate(r.scheduledAt) ?? new Date(),
      deadline: toDate(r.deadline) ?? new Date(),
    }),
  },

  // ── Level 4: Recruiter depends on User + Company ──
  {
    name: 'Recruiter',
    file: 'recruiters.json',
    prismaName: 'recruiter',
    transform: (r) => ({
      id: r.id,
      userId: r.userId,
      companyId: r.companyId,
      title: r.title ?? 'Recruiter',
      phone: r.phone ?? null,
    }),
  },

  // ── Level 5: Job depends on Company + Recruiter + JobCategory ──
  {
    name: 'Job',
    file: 'jobs.json',
    prismaName: 'job',
    transform: (r) => ({
      id: r.id,
      companyId: r.companyId,
      recruiterId: r.recruiterId,
      categoryId: r.categoryId,
      title: r.title,
      description: r.description ?? '',
      requirements: toText(r.requirements) ?? '',
      benefits: toText(r.benefits) ?? null,
      location: r.location ?? '',
      jobType: r.jobType,
      workMode: r.workMode,
      salaryMin: r.salaryMin ?? null,
      salaryMax: r.salaryMax ?? null,
      currency: r.currency ?? 'USD',
      deadline: toDate(r.deadline) ?? null,
      isPublished: r.isPublished ?? true,
    }),
  },

  // ── Level 6: Junction tables depend on StudentProfile/Job/Skill ──
  {
    name: 'StudentSkill',
    file: 'student_skills.json',
    prismaName: 'studentSkill',
    compositePk: 'studentProfileId_skillId',
    transform: (r) => ({
      studentProfileId: r.studentProfileId,
      skillId: r.skillId,
      level: typeof r.level === 'number' ? r.level : 50,
    }),
  },
  {
    name: 'JobSkill',
    file: 'job_skills.json',
    prismaName: 'jobSkill',
    compositePk: 'jobId_skillId',
    transform: (r) => ({
      jobId: r.jobId,
      skillId: r.skillId,
    }),
  },

  // ── Level 6: Profile sub-records ──
  {
    name: 'Education',
    file: 'education.json',
    prismaName: 'education',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      institution: r.institution ?? '',
      degree: r.degree ?? '',
      fieldOfStudy: r.fieldOfStudy ?? '',
      startDate: toDate(r.startDate) ?? new Date('2020-01-01'),
      endDate: toDate(r.endDate) ?? null,
      gpa: r.gpa ?? null,
    }),
  },
  {
    name: 'Experience',
    file: 'experience.json',
    prismaName: 'experience',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      companyName: r.companyName ?? '',
      roleTitle: r.roleTitle ?? '',
      employmentType: r.employmentType ?? null,
      startDate: toDate(r.startDate) ?? new Date('2022-01-01'),
      endDate: toDate(r.endDate) ?? null,
      isCurrent: r.isCurrent ?? false,
      description: r.description ?? null,
      location: r.location ?? null,
    }),
  },
  {
    name: 'Project',
    file: 'projects.json',
    prismaName: 'project',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      title: r.title ?? '',
      description: r.description ?? '',
      linkUrl: r.linkUrl ?? null,
      repoUrl: r.repoUrl ?? null,
      startDate: toDate(r.startDate) ?? null,
      endDate: toDate(r.endDate) ?? null,
    }),
  },
  {
    name: 'Certification',
    file: 'certifications.json',
    prismaName: 'certification',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      name: r.name ?? '',
      issuingOrg: r.issuingOrg ?? r.issuing_org ?? '',
      issueDate: toDate(r.issueDate ?? r.issue_date) ?? new Date('2023-01-01'),
      expiryDate: toDate(r.expiryDate ?? r.expiry_date) ?? null,
      credentialId: r.credentialId ?? r.credential_id ?? null,
      credentialUrl: r.credentialUrl ?? r.credential_url ?? null,
    }),
  },

  // ── Level 7: Resume depends on StudentProfile ──
  {
    name: 'Resume',
    file: 'resumes.json',
    prismaName: 'resume',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      fileName: r.fileName ?? 'resume.pdf',
      fileUrl: r.fileUrl ?? '/uploads/resumes/dummy_resume.pdf',
      status: r.status ?? 'PARSED',
      parsedText: toText(r.parsedText),
    }),
  },

  // ── Level 8: Application depends on StudentProfile + Job ──
  // Application has @@unique([studentProfileId, jobId]); upsert via that key
  {
    name: 'Application',
    file: 'applications.json',
    prismaName: 'application',
    uniqueKey: 'studentProfileId_jobId',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      jobId: r.jobId,
      status: r.status ?? 'APPLIED',
      coverLetter: r.coverLetter ?? null,
    }),
  },

  // ── Level 9: Interview depends on Application ──
  {
    name: 'Interview',
    file: 'interviews.json',
    prismaName: 'interview',
    transform: (r) => ({
      id: r.id,
      applicationId: r.applicationId,
      title: r.title ?? r.interviewType ?? 'Interview',
      scheduledAt: toDate(r.scheduledAt) ?? new Date(),
      duration: r.duration ?? 60,
      locationUrl: r.locationUrl ?? null,
      status: r.status ?? 'SCHEDULED',
      feedback: r.feedback ?? null,
    }),
  },

  // ── Level 9: Offer depends on Application + Recruiter ──
  // Offer has @@unique on applicationId (one offer per application).
  {
    name: 'Offer',
    file: 'offers.json',
    prismaName: 'offer',
    uniqueKey: 'applicationId',
    transform: (r) => ({
      id: r.id,
      applicationId: r.applicationId,
      createdByRecruiterId: r.createdByRecruiterId,
      title: r.title ?? 'Job Offer',
      salary: r.salary ?? 0,
      currency: r.currency ?? 'USD',
      startDate: toDate(r.startDate) ?? new Date(),
      notes: r.notes ?? null,
      status: r.status ?? 'DRAFT',
      extendedAt: toDate(r.extendedAt) ?? null,
      respondedAt: toDate(r.respondedAt) ?? null,
      withdrawnAt: toDate(r.withdrawnAt) ?? null,
    }),
  },

  // ── Level 9: Messaging (Conversation already seeded at Level 0) ──
  {
    name: 'ConversationParticipant',
    file: 'participants.json',
    prismaName: 'conversationParticipant',
    transform: (r) => ({
      id: r.id,
      conversationId: r.conversationId,
      studentProfileId: r.studentProfileId,
    }),
  },
  {
    name: 'Message',
    file: 'messages.json',
    prismaName: 'message',
    transform: (r) => ({
      id: r.id,
      conversationId: r.conversationId,
      senderId: r.senderId,
      content: r.content ?? '',
      status: r.status ?? 'SENT',
    }),
  },

  // ── Level 9: Notification depends on User ──
  {
    name: 'Notification',
    file: 'notifications.json',
    prismaName: 'notification',
    transform: (r) => ({
      id: r.id,
      senderId: r.senderId ?? null,
      recipientId: r.recipientId,
      type: r.type ?? 'SYSTEM',
      priority: r.priority ?? 'MEDIUM',
      title: r.title ?? '',
      content: r.content ?? '',
      isRead: r.isRead ?? false,
      linkUrl: r.linkUrl ?? null,
    }),
  },

  // ── Level 10: AI data depends on StudentProfile ──
  {
    name: 'CareerInsight',
    file: 'career_insights.json',
    prismaName: 'careerInsight',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      summary: toText(r.summary) ?? '',
      score: r.score ?? 0,
      status: r.status ?? 'COMPLETED',
      modelVersion: r.modelVersion ?? 'v1',
      generatedAt: toDate(r.generatedAt) ?? new Date(),
    }),
  },

  // ── Level 11: ResumeAnalysis depends on StudentProfile + Resume ──
  {
    name: 'ResumeAnalysis',
    file: 'resume_analyses.json',
    prismaName: 'resumeAnalysis',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      resumeId: r.resumeId,
      summary: toText(r.summary) ?? '',
      score: r.score ?? 0,
      status: r.status ?? 'COMPLETED',
      modelVersion: r.modelVersion ?? 'v1',
      generatedAt: toDate(r.generatedAt) ?? new Date(),
    }),
  },

  // ── Level 11: MockInterview depends on StudentProfile ──
  {
    name: 'MockInterview',
    file: 'mock_interviews.json',
    prismaName: 'mockInterview',
    transform: (r) => ({
      id: r.id,
      studentProfileId: r.studentProfileId,
      jobTitle: r.jobTitle ?? 'Software Engineer',
      durationLimit: r.durationLimit ?? 30,
    }),
  },

  // ── Level 12: MockInterviewReport depends on MockInterview ──
  {
    name: 'MockInterviewReport',
    file: 'mock_interview_reports.json',
    prismaName: 'mockInterviewReport',
    transform: (r) => ({
      id: r.id,
      mockInterviewId: r.mockInterviewId,
      summary: toText(r.summary) ?? '',
      score: r.score ?? 0,
      status: r.status ?? 'COMPLETED',
      modelVersion: r.modelVersion ?? 'v1',
      generatedAt: toDate(r.generatedAt) ?? new Date(),
    }),
  },

  // ── Level 13: InterviewQuestion depends on MockInterview ──
  {
    name: 'InterviewQuestion',
    file: 'interview_questions.json',
    prismaName: 'interviewQuestion',
    transform: (r) => ({
      id: r.id,
      mockInterviewId: r.mockInterviewId,
      questionIndex: r.questionIndex ?? 0,
      questionType: r.questionType ?? 'HR',
      questionText: r.questionText ?? '',
      answerTranscript: r.answerTranscript ?? null,
      wordsPerMinute: r.wordsPerMinute ?? null,
      fillerWordCount: r.fillerWordCount ?? null,
      eyeContactPercent: r.eyeContactPercent ?? null,
      answerQualityScore: r.answerQualityScore ?? null,
      technicalAccuracy: r.technicalAccuracy ?? null,
      grammarScore: r.grammarScore ?? null,
      feedback: r.feedback ?? null,
      strengths: Array.isArray(r.strengths) ? r.strengths : [],
      weaknesses: Array.isArray(r.weaknesses) ? r.weaknesses : [],
    }),
  },

  // ── Level 13: AuditLog depends on User (userId nullable) ──
  {
    name: 'AuditLog',
    file: 'audit_logs.json',
    prismaName: 'auditLog',
    transform: (r) => ({
      id: r.id,
      userId: r.userId ?? null,
      action: r.action ?? 'EVENT',
      ipAddress: r.ipAddress ?? null,
      details: r.details ?? null,
      createdAt: toDate(r.createdAt) ?? new Date(),
    }),
  },

  // ── Level 13: PlatformAnnouncement (createdBy nullable) ──
  {
    name: 'PlatformAnnouncement',
    file: 'platform_announcements.json',
    prismaName: 'platformAnnouncement',
    transform: (r) => ({
      id: r.id,
      title: r.title ?? '',
      content: r.content ?? '',
      severity: r.severity ?? 'info',
      isActive: r.isActive ?? true,
      createdBy: r.createdBy ?? null,
      expiresAt: toDate(r.expiresAt) ?? null,
      createdAt: toDate(r.createdAt) ?? new Date(),
    }),
  },
];

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  console.log('🚀 CareerBridge TypeScript Ingestion Pipeline\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  let mode = 'reset';
  let selectiveTables: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && i + 1 < args.length) {
      mode = args[++i].toLowerCase();
    } else if (args[i] === '--selective' && i + 1 < args.length) {
      selectiveTables = args[++i].split(',').map((t) => t.trim().toLowerCase());
    }
  }

  console.log(`📌 Mode : ${mode.toUpperCase()}`);
  if (selectiveTables.length) console.log(`🎯 Tables: ${selectiveTables.join(', ')}`);
  console.log();

  const dataDir = path.join(__dirname, 'data');

  // Ensure uploads directory + dummy resume exist
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'resumes');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(
    path.join(uploadsDir, 'dummy_resume.pdf'),
    '%PDF-1.4 Mock PDF Resume Content for CareerBridge Seeding',
  );

  const isSelected = (t: TableDef) =>
    selectiveTables.length === 0 ||
    selectiveTables.includes(t.name.toLowerCase()) ||
    selectiveTables.includes(t.prismaName.toLowerCase());

  // ── 1. RESET: delete all rows in REVERSE topological order ──
  if (mode === 'reset') {
    console.log('⚠️  Reset Mode: Deleting all rows (reverse order)…\n');
    for (const t of [...tables].reverse()) {
      if (!isSelected(t)) continue;
      try {
        const result = await (prisma as any)[t.prismaName].deleteMany();
        console.log(`   🗑  ${t.name}: deleted ${result.count} rows`);
      } catch (err: any) {
        console.warn(`   ⚠️  ${t.name}: skip – ${errMsg(err)}`);
      }
    }
    console.log();
  }

  // ── 2. INSERT / UPSERT ──
  console.log('📥 Inserting seed data…\n');
  const summary: { table: string; ok: number; fail: number; errs: string[] }[] = [];

  for (const t of tables) {
    if (!isSelected(t)) continue;

    const filePath = path.join(dataDir, t.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`   ❌ ${t.name}: seed file not found (${t.file})`);
      continue;
    }

    const records: Record<string, any>[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let ok = 0;
    let fail = 0;
    const errs: string[] = [];

    for (const raw of records) {
      try {
        const mapped = t.transform(raw);
        if (!mapped) continue;

        if (t.compositePk) {
          const fields = t.compositePk.split('_');
          const where: Record<string, any> = {};
          fields.forEach((f) => { where[f] = mapped[f]; });
          await (prisma as any)[t.prismaName].upsert({
            where: { [t.compositePk]: where },
            create: mapped,
            update: mapped,
          });
        } else if (t.uniqueKey) {
          // Table has a unique constraint; upsert by that instead of id.
          // Single-field @unique columns (e.g. Offer.applicationId) use the
          // field name directly as the where key. Composite @@unique([a, b])
          // constraints use Prisma's generated `a_b` compound key name
          // wrapping a nested { a, b } object.
          const fields = t.uniqueKey.split('_');
          const whereClause: Record<string, any> = fields.length === 1
            ? { [fields[0]]: mapped[fields[0]] }
            : { [t.uniqueKey]: fields.reduce((acc: Record<string, any>, f) => { acc[f] = mapped[f]; return acc; }, {}) };
          await (prisma as any)[t.prismaName].upsert({
            where: whereClause,
            create: mapped,
            update: mapped,
          });
        } else {
          await (prisma as any)[t.prismaName].upsert({
            where: { id: mapped.id },
            create: mapped,
            update: mapped,
          });
        }
        ok++;
      } catch (err: any) {
        fail++;
        const msg = errMsg(err);
        if (!errs.includes(msg)) errs.push(msg);
      }
    }

    const icon = fail === 0 ? '✅' : ok === 0 ? '❌' : '⚠️ ';
    console.log(`${icon}  ${t.name}: ${ok}/${records.length} upserted (${fail} failed)`);
    errs.slice(0, 2).forEach((e) => console.log(`       └─ ${e}`));
    summary.push({ table: t.name, ok, fail, errs });
  }

  // ── 3. Summary ──
  console.log('\n════════════════════════════════');
  const totalOk   = summary.reduce((s, r) => s + r.ok, 0);
  const totalFail = summary.reduce((s, r) => s + r.fail, 0);
  console.log(`Total seeded  : ${totalOk}`);
  console.log(`Total failed  : ${totalFail}`);
  if (totalFail === 0) {
    console.log('\n🎉 All records inserted successfully!');
  } else {
    console.log('\n⚠️  Some records failed – see error lines above.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Pipeline crashed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
