import React, { useEffect, useState } from 'react';
import { CandidateManagementService } from '../../services';
import type { TimelineEntry } from '../../services';

const ICONS: Record<TimelineEntry['type'], string> = {
  STAGE_CHANGE: 'move_up',
  NOTE_ADDED: 'sticky_note_2',
  INTERVIEW_SCHEDULED: 'event',
  INTERVIEW_UPDATED: 'event_repeat',
  OFFER_CREATED: 'description',
  OFFER_EXTENDED: 'mail',
  OFFER_RESPONDED: 'fact_check',
  OFFER_WITHDRAWN: 'cancel'
};

const COLORS: Record<TimelineEntry['type'], string> = {
  STAGE_CHANGE: 'bg-blue-100 text-blue-700',
  NOTE_ADDED: 'bg-surface-container-high text-on-surface-variant',
  INTERVIEW_SCHEDULED: 'bg-amber-100 text-amber-700',
  INTERVIEW_UPDATED: 'bg-amber-100 text-amber-700',
  OFFER_CREATED: 'bg-green-100 text-green-700',
  OFFER_EXTENDED: 'bg-green-100 text-green-700',
  OFFER_RESPONDED: 'bg-green-100 text-green-700',
  OFFER_WITHDRAWN: 'bg-red-100 text-red-700'
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Unified chronological feed for a single candidate application -- replaces
 * the previously-disconnected separate stages/notes/interviews/offer
 * sections with one coherent timeline backed by GET /employer/applications/:id/timeline.
 */
export const ActivityTimeline: React.FC<{ applicationId: string }> = ({ applicationId }) => {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setError(null);
    CandidateManagementService.getTimeline(applicationId)
      .then(data => { if (!cancelled) setEntries(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load activity.'); });
    return () => { cancelled = true; };
  }, [applicationId]);

  if (error) {
    return <p role="alert" className="text-error text-sm font-semibold">{error}</p>;
  }

  if (entries === null) {
    return (
      <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading activity timeline">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-surface-container-high rounded w-3/4" />
              <div className="h-2.5 bg-surface-container-high rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant">
        <span className="material-symbols-outlined text-3xl opacity-40" aria-hidden="true">history</span>
        <p className="text-sm font-semibold mt-2">No activity yet</p>
        <p className="text-xs mt-1">Stage changes, notes, interviews, and offers will appear here as they happen.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 pl-1" aria-label="Candidate activity timeline">
      {entries.map((entry, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${COLORS[entry.type]}`}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[16px]">{ICONS[entry.type]}</span>
            </span>
            {i < entries.length - 1 && <span className="w-px flex-1 bg-primary/10 mt-1" aria-hidden="true" />}
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-sm text-on-surface break-words">{entry.summary}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {entry.actorLabel} &middot; <time dateTime={entry.timestamp} title={new Date(entry.timestamp).toLocaleString()}>{formatRelative(entry.timestamp)}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default ActivityTimeline;
