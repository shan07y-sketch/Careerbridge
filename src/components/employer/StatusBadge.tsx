export const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  REVIEWING: 'Reviewing',
  SHORTLISTED: 'Shortlisted',
  SCREENING: 'Screening',
  INTERVIEWING: 'Interviewing',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn'
};

export const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-surface-container-high text-on-surface-variant',
  REVIEWING: 'bg-blue-100 text-blue-700',
  SHORTLISTED: 'bg-primary-fixed text-primary',
  SCREENING: 'bg-purple-100 text-purple-700',
  INTERVIEWING: 'bg-amber-100 text-amber-700',
  OFFERED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-surface-container text-on-surface-variant'
};

/**
 * Single source of truth for candidate/application status styling. Was
 * previously duplicated verbatim in HiringPipelinePanel and
 * CandidatesQueuePanel -- both now import this instead.
 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${
        STATUS_COLORS[status] || 'bg-surface-container text-on-surface-variant'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default StatusBadge;
