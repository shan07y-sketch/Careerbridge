import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export interface UniversityRequest extends AuthenticatedRequest {
  universityId?: string;
}
