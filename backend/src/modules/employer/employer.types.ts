import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export interface EmployerRequest extends AuthenticatedRequest {
  companyId?: string;
}
