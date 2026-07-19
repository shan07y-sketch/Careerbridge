import type { Student } from '../types';

/**
 * A student counts as "onboarded" when their persisted profile already carries
 * the substance the onboarding wizard exists to collect (degree, graduation
 * year, career goal or skills). The signal is derived from REAL database
 * fields returned by POST /auth/login and GET /auth/me — not a client-side
 * flag — so it survives new devices, reinstalls and cleared storage.
 *
 * Returning users therefore land on their dashboard; only genuinely fresh
 * profiles are routed through /student/onboarding.
 */
export const isStudentOnboarded = (user: Student | null | undefined): boolean => {
  if (!user) return false;
  return Boolean(
    user.degree ||
    (user.gradYear && user.gradYear > 0) ||
    user.careerGoal ||
    (user.skills && user.skills.length > 0)
  );
};
