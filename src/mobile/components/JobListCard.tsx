/**
 * JobListCard — the shared premium job row used across Jobs, Saved Jobs and
 * Internships. Presentation only; the parent owns data + navigation.
 * When `onUnsave` is provided a filled-bookmark toggle replaces the match pill.
 */
import React from 'react';
import type { Job } from '../../types';
import { Avatar } from './ui';

interface JobListCardProps {
  job: Job;
  index?: number;
  onOpen: () => void;
  onUnsave?: () => void;
}

export const JobListCard: React.FC<JobListCardProps> = ({ job, index = 0, onOpen, onUnsave }) => {
  const match = Math.round(job.matchRate || 0);
  return (
    <div className={`m-card-lift rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 shadow-sm m-rise m-rise-${Math.min(index + 1, 5)}`}>
      <div className="flex items-start gap-3">
        <Avatar src={job.companyLogo} name={job.companyName} size={44} />
        <button className="flex-1 min-w-0 text-left" onClick={onOpen}>
          <p className="text-[15px] font-bold leading-snug truncate">{job.title}</p>
          <p className="text-xs text-on-surface-variant truncate">{job.companyName}</p>
        </button>
        {onUnsave ? (
          <button
            onClick={onUnsave}
            aria-label={`Remove ${job.title} from saved`}
            className="m-press w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
          </button>
        ) : match > 0 ? (
          <span className="shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{match}% match</span>
        ) : null}
      </div>

      <button className="w-full text-left" onClick={onOpen}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-on-surface-variant">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>{job.location}
            </span>
          )}
          {job.workMode && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">home_work</span>{job.workMode}
            </span>
          )}
          {job.salaryRange && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">payments</span>{job.salaryRange}
            </span>
          )}
          {job.postedTime && <span>· {job.postedTime}</span>}
          {onUnsave && match > 0 && <span className="font-extrabold text-primary">{match}% match</span>}
        </div>
        {match > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-on-surface/8 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#3bb98b]" style={{ width: `${Math.min(100, match)}%` }} />
          </div>
        )}
      </button>
    </div>
  );
};
