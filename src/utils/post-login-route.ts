import type { AuthResult } from '../contexts/AuthContext';
import { isStudentOnboarded } from './onboarding';

/**
 * Where a user lands immediately after authenticating.
 *
 * Shared by every sign-in surface (desktop, mobile, admin, and the two-step
 * verification step) so they cannot drift apart. Routing used to be duplicated
 * per screen, which is how the onboarding wizard ended up re-appearing for
 * returning students on one path but not another.
 *
 * The role always comes from the backend response, never from whichever tab
 * the user happened to be on.
 */
export function resolveLandingRoute({ role, user }: AuthResult): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'employer':
      return '/employer/dashboard';
    case 'university':
      return '/university/dashboard';
    default:
      // Returning students with a saved profile go straight to their
      // dashboard; only genuinely fresh profiles see the onboarding wizard.
      return isStudentOnboarded(user) ? '/student/dashboard' : '/student/onboarding';
  }
}
