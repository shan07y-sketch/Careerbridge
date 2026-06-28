import { UniversityRepository } from './university.repository';
import { AIOrchestrator } from '../ai/ai-orchestrator';
import { eventBus } from '../shared/event-bus';

export class UniversityService {
  static async getDashboard(universityId: string) {
    return UniversityRepository.getDashboard(universityId);
  }

  static async getStudents(universityId: string) {
    return UniversityRepository.getStudents(universityId);
  }

  static async verifyStudent(universityId: string, studentProfileId: string, status: string) {
    const result = await UniversityRepository.updateStudentStatus(universityId, studentProfileId, status);
    
    eventBus.emit('StudentVerified', { id: studentProfileId, universityId, status });
    if (status === 'Placement Eligible') {
      eventBus.emit('PlacementEligibilityUpdated', { id: studentProfileId, universityId, eligible: true });
    }
    if (status === 'Placement Completed') {
      eventBus.emit('PlacementCompleted', { id: studentProfileId, universityId });
    }

    return result;
  }

  static async getAnalytics(universityId: string) {
    return UniversityRepository.getAnalytics(universityId);
  }

  static async getAIPlacementInsights(universityId: string) {
    return AIOrchestrator.runAnalysis(
      'system_university_officer',
      'career-insight-v1',
      'career-insight-v1',
      `University profile insights request for ID ${universityId}`
    );
  }
}
