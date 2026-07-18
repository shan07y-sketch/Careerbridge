import { JobStatus } from '@prisma/client';
import { AppError } from '../../utils/app-error';

/**
 * Single source of truth for legal Job lifecycle transitions. Every job
 * status change (publish, pause, close, reopen, archive) must go through
 * `assertValidTransition` rather than ad hoc if/else scattered across the
 * service -- this keeps the state machine auditable in one place.
 *
 *   DRAFT      -> PUBLISHED, ARCHIVED
 *   PUBLISHED  -> PAUSED, CLOSED, ARCHIVED
 *   PAUSED     -> PUBLISHED, CLOSED, ARCHIVED
 *   CLOSED     -> PUBLISHED (reopen), ARCHIVED
 *   ARCHIVED   -> (terminal; no outbound transitions)
 */
const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['PAUSED', 'CLOSED', 'ARCHIVED'],
  PAUSED: ['PUBLISHED', 'CLOSED', 'ARCHIVED'],
  CLOSED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: []
};

export function assertValidTransition(from: JobStatus, to: JobStatus) {
  if (from === to) return; // no-op transitions are harmless
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new AppError(
      `Cannot move a job from ${from} to ${to}.`,
      409,
      'INVALID_JOB_STATUS_TRANSITION'
    );
  }
}
