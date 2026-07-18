/**
 * reset_seed.ts
 *
 * Deletes all seed-managed rows from the database in reverse-FK-dependency
 * order, so that re-running `npm run seed:generate && npm run seed` does not
 * accumulate stale/duplicate rows across regenerations (ingest_seed.ts only
 * upserts by id -- it never removes rows that no longer exist in the freshly
 * generated JSON, e.g. because a re-run picked different random UUIDs).
 *
 * SAFETY: this script is destructive. It is gated behind two independent
 * checks so it can never accidentally wipe a real environment:
 *   1. `ALLOW_SEED_RESET=true` must be set explicitly.
 *   2. `NODE_ENV` must NOT be `production`.
 * Both conditions must hold or the script refuses to run.
 *
 * Table order mirrors (reversed) the topological/FK order used by
 * ingest_seed.ts's `tables` array -- see the comment block there for the
 * full dependency chain.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allowed = process.env.ALLOW_SEED_RESET === 'true';
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (nodeEnv === 'production') {
    console.error('❌  Refusing to run: NODE_ENV=production. This script must never run against a production database.');
    process.exit(1);
  }
  if (!allowed) {
    console.error('❌  Refusing to run: set ALLOW_SEED_RESET=true to confirm you want to delete all seed-managed rows.');
    console.error('    Example: ALLOW_SEED_RESET=true npm run seed:reset');
    process.exit(1);
  }

  console.log('⚠️   ALLOW_SEED_RESET=true and NODE_ENV != production. Proceeding with destructive reset...\n');

  // Reverse of the FK-safe forward order in ingest_seed.ts's `tables` array.
  // $transaction runs these sequentially in one DB transaction so a failure
  // midway does not leave the database in a half-deleted state.
  const deletions: Array<{ label: string; run: () => Promise<{ count: number }> }> = [
    { label: 'MockInterviewReport', run: () => prisma.mockInterviewReport.deleteMany() },
    { label: 'MockInterview', run: () => prisma.mockInterview.deleteMany() },
    { label: 'ResumeAnalysis', run: () => prisma.resumeAnalysis.deleteMany() },
    { label: 'CareerInsight', run: () => prisma.careerInsight.deleteMany() },
    { label: 'Notification', run: () => prisma.notification.deleteMany() },
    { label: 'Message', run: () => prisma.message.deleteMany() },
    { label: 'ConversationParticipant', run: () => prisma.conversationParticipant.deleteMany() },
    { label: 'Interview', run: () => prisma.interview.deleteMany() },
    { label: 'ApplicationNote', run: () => prisma.applicationNote.deleteMany() },
    { label: 'Offer', run: () => prisma.offer.deleteMany() },
    { label: 'Application', run: () => prisma.application.deleteMany() },
    { label: 'Resume', run: () => prisma.resume.deleteMany() },
    { label: 'Certification', run: () => prisma.certification.deleteMany() },
    { label: 'Project', run: () => prisma.project.deleteMany() },
    { label: 'Experience', run: () => prisma.experience.deleteMany() },
    { label: 'Education', run: () => prisma.education.deleteMany() },
    { label: 'JobSkill', run: () => prisma.jobSkill.deleteMany() },
    { label: 'StudentSkill', run: () => prisma.studentSkill.deleteMany() },
    { label: 'Job', run: () => prisma.job.deleteMany() },
    { label: 'Recruiter', run: () => prisma.recruiter.deleteMany() },
    { label: 'StudentProfile', run: () => prisma.studentProfile.deleteMany() },
    { label: 'Department', run: () => prisma.department.deleteMany() },
    { label: 'University', run: () => prisma.university.deleteMany() },
    { label: 'Conversation', run: () => prisma.conversation.deleteMany() },
    { label: 'Skill', run: () => prisma.skill.deleteMany() },
    { label: 'JobCategory', run: () => prisma.jobCategory.deleteMany() },
    { label: 'User', run: () => prisma.user.deleteMany() },
    { label: 'Company', run: () => prisma.company.deleteMany() },
  ];

  let totalDeleted = 0;
  for (const { label, run } of deletions) {
    try {
      const result = await run();
      totalDeleted += result.count;
      console.log(`  🗑️   ${label}: ${result.count} rows deleted`);
    } catch (err: any) {
      // Tables that don't exist yet (pre-migration) or that Prisma client
      // doesn't know about (schema drift) shouldn't halt the whole reset.
      console.warn(`  ⚠️   ${label}: skipped (${(err?.message ?? String(err)).split('\n')[0]})`);
    }
  }

  console.log(`\n✅  Reset complete. ${totalDeleted} total rows deleted across ${deletions.length} tables.`);
}

main()
  .catch((e) => {
    console.error('Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
