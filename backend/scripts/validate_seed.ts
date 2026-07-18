import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
}

const results: CheckResult[] = [];

function pass(check: string, detail: string) {
  results.push({ check, status: 'PASS', detail });
  console.log(`PASS  ${check}: ${detail}`);
}
function fail(check: string, detail: string) {
  results.push({ check, status: 'FAIL', detail });
  console.error(`FAIL  ${check}: ${detail}`);
}
function warn(check: string, detail: string) {
  results.push({ check, status: 'WARN', detail });
  console.warn(`WARN  ${check}: ${detail}`);
}

async function rawCount(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: string | bigint }>>(sql);
  return Number(rows[0]?.count ?? 0);
}

async function main() {
  console.log('CareerBridge Seed Validation Script');
  console.log('====================================\n');

  // -- 1. Row Counts ----------------------------------------------------------
  console.log('-- Row Counts --------------------------------------------\n');

  // Minimums kept in sync with careerbridge_seed_engine/config.py's CountsConfig
  // defaults (students=1200, jobs=400, companies=80, recruiters=150,
  // applications=2500, interviews=450, offers=200, conversations=550,
  // notifications=2200). Set generously below the exact target counts to
  // tolerate config tuning without breaking validation.
  const countChecks: { table: string; sql: string; min: number }[] = [
    { table: 'User',                sql: 'SELECT COUNT(*) AS count FROM "User"',                min: 1390 },
    { table: 'Company',             sql: 'SELECT COUNT(*) AS count FROM "Company"',             min: 60   },
    { table: 'University',          sql: 'SELECT COUNT(*) AS count FROM "University"',          min: 30   },
    { table: 'Department',          sql: 'SELECT COUNT(*) AS count FROM "Department"',          min: 60   },
    { table: 'StudentProfile',      sql: 'SELECT COUNT(*) AS count FROM "StudentProfile"',      min: 1000 },
    { table: 'Recruiter',           sql: 'SELECT COUNT(*) AS count FROM "Recruiter"',           min: 100  },
    { table: 'Job',                 sql: 'SELECT COUNT(*) AS count FROM "Job"',                 min: 300  },
    { table: 'Skill',               sql: 'SELECT COUNT(*) AS count FROM "Skill"',               min: 60   },
    { table: 'StudentSkill',        sql: 'SELECT COUNT(*) AS count FROM "StudentSkill"',        min: 6000 },
    { table: 'JobSkill',            sql: 'SELECT COUNT(*) AS count FROM "JobSkill"',            min: 1500 },
    { table: 'Education',           sql: 'SELECT COUNT(*) AS count FROM "Education"',           min: 1000 },
    { table: 'Experience',          sql: 'SELECT COUNT(*) AS count FROM "Experience"',          min: 600  },
    { table: 'Project',             sql: 'SELECT COUNT(*) AS count FROM "Project"',             min: 2000 },
    { table: 'Certification',       sql: 'SELECT COUNT(*) AS count FROM "Certification"',       min: 800  },
    { table: 'Resume',              sql: 'SELECT COUNT(*) AS count FROM "Resume"',              min: 1000 },
    { table: 'Application',         sql: 'SELECT COUNT(*) AS count FROM "Application"',         min: 2000 },
    { table: 'Interview',           sql: 'SELECT COUNT(*) AS count FROM "Interview"',           min: 350  },
    { table: 'Conversation',        sql: 'SELECT COUNT(*) AS count FROM "Conversation"',        min: 400  },
    { table: 'Message',             sql: 'SELECT COUNT(*) AS count FROM "Message"',             min: 1500 },
    { table: 'Notification',        sql: 'SELECT COUNT(*) AS count FROM "Notification"',        min: 1800 },
    { table: 'CareerInsight',       sql: 'SELECT COUNT(*) AS count FROM "CareerInsight"',       min: 1000 },
    { table: 'ResumeAnalysis',      sql: 'SELECT COUNT(*) AS count FROM "ResumeAnalysis"',      min: 1000 },
    { table: 'MockInterview',       sql: 'SELECT COUNT(*) AS count FROM "MockInterview"',       min: 1000 },
    { table: 'MockInterviewReport', sql: 'SELECT COUNT(*) AS count FROM "MockInterviewReport"', min: 1000 },
    { table: 'InterviewQuestion',   sql: 'SELECT COUNT(*) AS count FROM "InterviewQuestion"',   min: 4000 },
    { table: 'PlacementDrive',      sql: 'SELECT COUNT(*) AS count FROM "PlacementDrive"',       min: 50   },
    { table: 'PlatformAnnouncement',sql: 'SELECT COUNT(*) AS count FROM "PlatformAnnouncement"', min: 5    },
    { table: 'AuditLog',            sql: 'SELECT COUNT(*) AS count FROM "AuditLog"',             min: 2000 },
  ];

  for (const { table, sql, min } of countChecks) {
    const count = await rawCount(sql);
    count >= min
      ? pass(`Count: ${table}`, `${count} rows (min ${min})`)
      : fail(`Count: ${table}`, `${count} rows (expected >= ${min})`);
  }

  // -- 2. FK Integrity (orphan checks) -----------------------------------------
  console.log('\n-- FK Integrity --------------------------------------------\n');

  const fkChecks: { label: string; sql: string }[] = [
    {
      label: 'StudentProfile -> User',
      sql: `SELECT COUNT(*) AS count FROM "StudentProfile" sp
            LEFT JOIN "User" u ON sp."userId" = u.id
            WHERE u.id IS NULL`,
    },
    {
      label: 'Recruiter -> User',
      sql: `SELECT COUNT(*) AS count FROM "Recruiter" r
            LEFT JOIN "User" u ON r."userId" = u.id
            WHERE u.id IS NULL`,
    },
    {
      label: 'Recruiter -> Company',
      sql: `SELECT COUNT(*) AS count FROM "Recruiter" r
            LEFT JOIN "Company" c ON r."companyId" = c.id
            WHERE c.id IS NULL`,
    },
    {
      label: 'Job -> Company',
      sql: `SELECT COUNT(*) AS count FROM "Job" j
            LEFT JOIN "Company" c ON j."companyId" = c.id
            WHERE c.id IS NULL`,
    },
    {
      label: 'Job -> Recruiter',
      sql: `SELECT COUNT(*) AS count FROM "Job" j
            LEFT JOIN "Recruiter" r ON j."recruiterId" = r.id
            WHERE r.id IS NULL`,
    },
    {
      label: 'Application -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "Application" a
            LEFT JOIN "StudentProfile" sp ON a."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'Application -> Job',
      sql: `SELECT COUNT(*) AS count FROM "Application" a
            LEFT JOIN "Job" j ON a."jobId" = j.id
            WHERE j.id IS NULL`,
    },
    {
      label: 'Interview -> Application',
      sql: `SELECT COUNT(*) AS count FROM "Interview" iv
            LEFT JOIN "Application" a ON iv."applicationId" = a.id
            WHERE a.id IS NULL`,
    },
    {
      label: 'Message -> Conversation',
      sql: `SELECT COUNT(*) AS count FROM "Message" m
            LEFT JOIN "Conversation" c ON m."conversationId" = c.id
            WHERE c.id IS NULL`,
    },
    {
      label: 'Message -> Sender (StudentProfile)',
      sql: `SELECT COUNT(*) AS count FROM "Message" m
            LEFT JOIN "StudentProfile" sp ON m."senderId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'Notification -> Recipient (User)',
      sql: `SELECT COUNT(*) AS count FROM "Notification" n
            LEFT JOIN "User" u ON n."recipientId" = u.id
            WHERE u.id IS NULL`,
    },
    {
      label: 'CareerInsight -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "CareerInsight" ci
            LEFT JOIN "StudentProfile" sp ON ci."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'ResumeAnalysis -> Resume',
      sql: `SELECT COUNT(*) AS count FROM "ResumeAnalysis" ra
            LEFT JOIN "Resume" r ON ra."resumeId" = r.id
            WHERE r.id IS NULL`,
    },
    {
      label: 'ResumeAnalysis -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "ResumeAnalysis" ra
            LEFT JOIN "StudentProfile" sp ON ra."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'MockInterviewReport -> MockInterview',
      sql: `SELECT COUNT(*) AS count FROM "MockInterviewReport" mr
            LEFT JOIN "MockInterview" mi ON mr."mockInterviewId" = mi.id
            WHERE mi.id IS NULL`,
    },
    {
      label: 'Education -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "Education" e
            LEFT JOIN "StudentProfile" sp ON e."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'Experience -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "Experience" ex
            LEFT JOIN "StudentProfile" sp ON ex."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'Certification -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "Certification" c
            LEFT JOIN "StudentProfile" sp ON c."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
    {
      label: 'Resume -> StudentProfile',
      sql: `SELECT COUNT(*) AS count FROM "Resume" r
            LEFT JOIN "StudentProfile" sp ON r."studentProfileId" = sp.id
            WHERE sp.id IS NULL`,
    },
  ];

  for (const { label, sql } of fkChecks) {
    const orphans = await rawCount(sql);
    orphans === 0
      ? pass(`FK: ${label}`, 'No orphan records')
      : fail(`FK: ${label}`, `${orphans} orphan records found`);
  }

  // -- 3. Data Quality ----------------------------------------------------------
  console.log('\n-- Data Quality --------------------------------------------\n');

  const qualityChecks: { label: string; sql: string; warnOnly?: boolean }[] = [
    {
      label: 'Every student has >=1 skill',
      sql: `SELECT COUNT(*) AS count FROM "StudentProfile" sp
            WHERE NOT EXISTS (SELECT 1 FROM "StudentSkill" ss WHERE ss."studentProfileId" = sp.id)`,
      warnOnly: true,
    },
    {
      label: 'Every student has >=1 resume',
      sql: `SELECT COUNT(*) AS count FROM "StudentProfile" sp
            WHERE NOT EXISTS (SELECT 1 FROM "Resume" r WHERE r."studentProfileId" = sp.id)`,
      warnOnly: true,
    },
    {
      label: 'Every student has >=1 career insight',
      sql: `SELECT COUNT(*) AS count FROM "StudentProfile" sp
            WHERE NOT EXISTS (SELECT 1 FROM "CareerInsight" ci WHERE ci."studentProfileId" = sp.id)`,
      warnOnly: true,
    },
    {
      label: 'Every job has >=1 required skill',
      sql: `SELECT COUNT(*) AS count FROM "Job" j
            WHERE NOT EXISTS (SELECT 1 FROM "JobSkill" js WHERE js."jobId" = j.id)`,
      warnOnly: true,
    },
    {
      label: 'No duplicate applications (student+job pair)',
      sql: `SELECT COUNT(*) AS count FROM (
              SELECT "studentProfileId", "jobId", COUNT(*) AS c
              FROM "Application"
              GROUP BY "studentProfileId", "jobId"
              HAVING COUNT(*) > 1
            ) AS dups`,
    },
    {
      label: 'All Users have valid role enum',
      sql: `SELECT COUNT(*) AS count FROM "User"
            WHERE role NOT IN ('STUDENT','EMPLOYER','UNIVERSITY','ADMIN')`,
    },
    {
      label: 'All Jobs have valid jobType enum',
      sql: `SELECT COUNT(*) AS count FROM "Job"
            WHERE "jobType" NOT IN ('FULL_TIME','PART_TIME','INTERNSHIP','CONTRACT','TEMPORARY')`,
    },
  ];

  for (const { label, sql, warnOnly } of qualityChecks) {
    const badCount = await rawCount(sql);
    if (badCount === 0) {
      pass(`Quality: ${label}`, 'OK');
    } else if (warnOnly) {
      warn(`Quality: ${label}`, `${badCount} records affected`);
    } else {
      fail(`Quality: ${label}`, `${badCount} records with issue`);
    }
  }

  // -- 4. Summary -----------------------------------------------------------
  console.log('\n====================================');
  const passes = results.filter(r => r.status === 'PASS').length;
  const fails  = results.filter(r => r.status === 'FAIL').length;
  const warns  = results.filter(r => r.status === 'WARN').length;

  console.log(`Total checks : ${results.length}`);
  console.log(`Passed   : ${passes}`);
  console.log(`Failed   : ${fails}`);
  console.log(`Warnings : ${warns}`);

  if (fails === 0) {
    console.log('\nAll critical validations PASSED! Database is consistent.\n');
  } else {
    console.log('\nSome validations FAILED. Please review above.\n');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Validation crashed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
