import { AuthService } from '../modules/auth/auth.service';
import { ResumeService } from '../modules/resume/resume.service';
import { EmployerService } from '../modules/employer/employer.service';
import { UniversityService } from '../modules/university/university.service';
import { AdminService } from '../modules/admin/admin.service';
import { AIOrchestrator } from '../modules/ai/ai-orchestrator';
import { eventBus } from '../modules/shared/event-bus';
import { PresenceService } from '../modules/shared/presence.service';
import { logger } from '../config/logger';

async function runE2ESuite() {
  console.log('==================================================');
  console.log('STARTING CAREERBRIDGE E2E SYSTEM INTEGRATION SUITE');
  console.log('==================================================\n');

  let assertionCount = 0;
  const assert = (condition: boolean, message: string) => {
    assertionCount++;
    if (condition) {
      console.log(`[PASS] Assertion #${assertionCount}: ${message}`);
    } else {
      console.error(`[FAIL] Assertion #${assertionCount}: ${message}`);
      process.exit(1);
    }
  };

  const eventRegistry: string[] = [];
  eventBus.on('MessageSent', () => eventRegistry.push('MessageSent'));
  eventBus.on('NotificationCreated', () => eventRegistry.push('NotificationCreated'));
  eventBus.on('ApplicationCreated', () => eventRegistry.push('ApplicationCreated'));
  eventBus.on('PresenceChanged', () => eventRegistry.push('PresenceChanged'));
  eventBus.on('JobCreated', () => eventRegistry.push('JobCreated'));
  eventBus.on('RecruiterInvited', () => eventRegistry.push('RecruiterInvited'));
  eventBus.on('StudentVerified', () => eventRegistry.push('StudentVerified'));

  const startBenchmark = Date.now();

  console.log('Test 1: Validating Presence State Manager...');
  PresenceService.setUserOnline('student_test_user_id');
  let presence = PresenceService.getUserPresence('student_test_user_id');
  assert(presence.status === 'ONLINE', 'Presence state correctly sets ONLINE');

  PresenceService.setUserAway('student_test_user_id');
  presence = PresenceService.getUserPresence('student_test_user_id');
  assert(presence.status === 'AWAY', 'Presence state correctly sets AWAY');

  PresenceService.setUserOffline('student_test_user_id');
  presence = PresenceService.getUserPresence('student_test_user_id');
  assert(presence.status === 'OFFLINE', 'Presence state correctly sets OFFLINE');
  assert(eventRegistry.includes('PresenceChanged'), 'EventBus registers PresenceChanged emits');

  console.log('\nTest 2: Validating AI Orchestrator & Caching Pipeline...');
  const resumeText = 'Experienced Fullstack Engineer, React, Node, TS';
  
  const result1 = await AIOrchestrator.runAnalysis('student_user_1', 'resume-analysis-v1', 'resume-analysis-v1', resumeText);
  assert(result1.score === 85, 'AI returns structured resume match analysis score');

  const result2 = await AIOrchestrator.runAnalysis('student_user_1', 'resume-analysis-v1', 'resume-analysis-v1', resumeText);
  assert(result2.score === 85, 'AI returns matching cached analysis results');

  console.log('\nTest 3: Validating Persistent Feature Flags Manager...');
  const flagStatus = await AdminService.updateFeatureFlag('admin_officer_id', 'enableAI', false);
  assert(flagStatus.value === false, 'Feature flag modifies persistent key value');
  
  await AdminService.updateFeatureFlag('admin_officer_id', 'enableAI', true);
  const reverted = await AdminService.getFeatureFlags();
  const targetFlag = reverted.find(f => f.key === 'enableAI');
  assert(targetFlag?.value === true, 'Feature flag correctly toggles back to active status');

  console.log('\nTest 4: Validating Global Admin Search Query Indexes...');
  const searchResults = await AdminService.globalSearch('Google');
  assert(searchResults.companies !== undefined, 'Admin search returns matched companies lists');
  assert(searchResults.jobs !== undefined, 'Admin search returns matched jobs list details');

  console.log('\nTest 5: Validating Operational System Health Metrics...');
  const diagnostics = await AdminService.getSystemMonitoring();
  assert(diagnostics.apiHealth === 'HEALTHY', 'Diagnostics system parses API health');
  assert(diagnostics.databaseStatus !== undefined, 'Diagnostics evaluates database availability');

  const totalDuration = Date.now() - startBenchmark;
  console.log('\n==================================================');
  console.log(`ALL ${assertionCount} INTEGRATION ASSERTIONS PASSED SUCCESSFULLY`);
  console.log(`TOTAL BENCHMARK PROCESSING DURATION: ${totalDuration}ms`);
  console.log('==================================================');
}

runE2ESuite().catch(err => {
  console.error('Integration Suite failed with runtime exception:', err);
  process.exit(1);
});
