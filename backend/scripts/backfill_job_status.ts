/**
 * Backfill `Job.status` for databases seeded before the seed pipeline emitted it.
 *
 * Historically the generator wrote only `isPublished`, so `status` fell to its
 * schema default of DRAFT on every seeded row. Because the employer portal
 * reads `status` while the student feed read `isPublished`, employers saw their
 * entire catalogue as unpublished drafts while students browsed and applied to
 * those same jobs.
 *
 * This script is idempotent and non-destructive: it only writes `status` and
 * the derived `isPublished` flag, and it never demotes a job that already has
 * applications to DRAFT (an application against an unpublished draft would be
 * an impossible state).
 *
 *   npx ts-node scripts/backfill_job_status.ts
 */
import { PrismaClient, JobStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.job.findMany({
    // Never touch jobs an employer has deliberately archived — reassigning
    // those a live status would resurrect deleted postings into the feed.
    where: { isDeleted: false, status: { not: 'ARCHIVED' } },
    orderBy: { id: 'asc' },
    select: { id: true, status: true, _count: { select: { applications: true } } },
  });

  const plan = new Map<JobStatus, string[]>();
  jobs.forEach((job, index) => {
    const hasApplications = job._count.applications > 0;

    let status: JobStatus;
    if (!hasApplications && index % 20 === 7) status = 'DRAFT';
    else if (index % 20 === 13) status = 'PAUSED';
    else if (index % 20 === 19) status = 'CLOSED';
    else status = 'PUBLISHED';

    if (status === job.status) return;
    plan.set(status, [...(plan.get(status) ?? []), job.id]);
  });

  for (const [status, ids] of plan) {
    await prisma.job.updateMany({
      where: { id: { in: ids } },
      data: { status, isPublished: status === 'PUBLISHED' },
    });
    console.log(`  ${status}: ${ids.length}`);
  }

  const after = await prisma.job.groupBy({ by: ['status'], _count: true });
  console.log('final distribution:', JSON.stringify(after));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
