import { AIOrchestrator } from '../modules/ai/ai-orchestrator';
import { PresenceService } from '../modules/shared/presence.service';
import { AdminService } from '../modules/admin/admin.service';

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

async function runBenchmarks() {
  console.log('==================================================');
  console.log('STARTING CAREERBRIDGE SYSTEM BENCHMARK SUITE');
  console.log('==================================================\n');

  console.log('Running AI analysis benchmarks (3 iterations)...');
  const aiLatencies: number[] = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await AIOrchestrator.runAnalysis('bench_user', 'resume-analysis-v1', 'resume-analysis-v1', 'Skill sample React CV');
    aiLatencies.push(Date.now() - start);
  }

  const aiAvg = aiLatencies.reduce((a, b) => a + b, 0) / aiLatencies.length;
  const aiMin = Math.min(...aiLatencies);
  const aiMax = Math.max(...aiLatencies);
  const aiP95 = calculatePercentile(aiLatencies, 95);

  console.log(`\nAI Engine Results:`);
  console.log(`- Avg: ${aiAvg.toFixed(1)}ms`);
  console.log(`- Min: ${aiMin}ms`);
  console.log(`- Max: ${aiMax}ms`);
  console.log(`- p95: ${aiP95}ms`);

  console.log('\nRunning Presence updates benchmarks (100 iterations)...');
  const presenceLatencies: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = Date.now();
    PresenceService.setUserOnline(`user_${i}`);
    presenceLatencies.push(Date.now() - start);
  }

  const presAvg = presenceLatencies.reduce((a, b) => a + b, 0) / presenceLatencies.length;
  const presMin = Math.min(...presenceLatencies);
  const presMax = Math.max(...presenceLatencies);
  const presP95 = calculatePercentile(presenceLatencies, 95);

  console.log(`\nPresence Engine Results:`);
  console.log(`- Avg: ${presAvg.toFixed(2)}ms`);
  console.log(`- Min: ${presMin}ms`);
  console.log(`- Max: ${presMax}ms`);
  console.log(`- p95: ${presP95}ms`);

  console.log('\n==================================================');
  console.log('BENCHMARKS SUCCESSFULLY COMPLETED');
  console.log('==================================================');
}

runBenchmarks().catch(err => {
  console.error('Benchmark suite crashed:', err);
  process.exit(1);
});
