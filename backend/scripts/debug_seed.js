const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    // Test 1: university upsert
    const u = await p.university.upsert({
      where: { id: '30e30384-e5e6-4ab8-9afb-437bb6e82775' },
      create: {
        id: '30e30384-e5e6-4ab8-9afb-437bb6e82775',
        userId: '132445a0-dba3-480a-9305-4a8215b8d200',
        name: 'Indian Institute of Technology, Madras',
        logoUrl: 'https://test.com',
        location: 'Chennai, India',
      },
      update: { name: 'Indian Institute of Technology, Madras' },
    });
    console.log('University OK:', u.id);
  } catch (e) {
    console.error('University FAIL:', e.message);
  }

  try {
    // Test 2: studentProfile upsert - get first student record
    const records = require('./data/students.json');
    const r = records[0];
    const sp = await p.studentProfile.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        userId: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        phone: r.phone ?? null,
        bio: r.bio ?? null,
        currentGpa: r.currentGpa ?? null,
        universityId: r.universityId ?? null,
        departmentId: r.departmentId ?? null,
        graduationYear: r.graduationYear ?? null,
        preferredRole: r.preferredRole ?? null,
        preferredWorkMode: r.preferredWorkMode ?? null,
        preferredLocations: Array.isArray(r.preferredLocations) ? r.preferredLocations : [],
      },
      update: { firstName: r.firstName },
    });
    console.log('StudentProfile OK:', sp.id);
  } catch (e) {
    console.error('StudentProfile FAIL:', e.message);
  }

  try {
    // Test 3: recruiter upsert
    const records = require('./data/recruiters.json');
    const r = records[0];
    const rec = await p.recruiter.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        userId: r.userId,
        companyId: r.companyId,
        title: r.title ?? 'Recruiter',
        phone: r.phone ?? null,
      },
      update: { title: r.title },
    });
    console.log('Recruiter OK:', rec.id);
  } catch (e) {
    console.error('Recruiter FAIL:', e.message);
  }
}

test().finally(() => p.$disconnect());
