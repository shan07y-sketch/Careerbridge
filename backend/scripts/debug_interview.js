const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const records = require('./data/interviews.json');

async function test() {
  for (const r of records) {
    try {
      const raw = r.scheduledAt;
      const padded = typeof raw === 'string' && raw.length === 10 
        ? raw + 'T00:00:00.000Z' 
        : raw;
      const d = padded ? new Date(padded) : new Date();
      
      await p.interview.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          applicationId: r.applicationId,
          title: r.title || r.interviewType || 'Interview',
          scheduledAt: d,
          duration: r.duration || 60,
          locationUrl: r.locationUrl || null,
          status: r.status || 'SCHEDULED',
          feedback: r.feedback || null,
        },
        update: { status: r.status || 'SCHEDULED' },
      });
    } catch (e) {
      const lines = e.message.split('\n').filter(l => l.trim());
      console.error('FAIL id=' + r.id + ' applicationId=' + r.applicationId);
      console.error('   Error: ' + lines[0]);
      // Check if applicationId exists
      const app = await p.application.findUnique({ where: { id: r.applicationId } });
      console.error('   Application exists?', app ? 'YES' : 'NO');
    }
  }
  console.log('Done');
}

test().finally(() => p.$disconnect());
