/**
 * Mobile Saved Jobs — premium bookmarked-roles list with one-tap unsave.
 * Mirrors the Jobs card language. All data + mutations via JobService (real API).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../../types';
import { JobService } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, SkeletonList, EmptyState, ErrorState, PullToRefresh, Avatar } from '../../components';

const MobileSavedJobs: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setJobs(await JobService.getSavedJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unsave = async (jobId: string) => {
    const prev = jobs;
    setJobs(p => p.filter(j => j.id !== jobId)); // optimistic
    try {
      await JobService.toggleSaveJob(jobId);
      showToast('Removed from saved');
    } catch (err) {
      setJobs(prev); // revert on failure
      showToast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  if (loading) {
    return <MobileShell title="Saved jobs"><SkeletonList count={5} itemClass="h-28" /></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Saved jobs"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  return (
    <MobileShell bare>
      {/* ---- Aurora hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-white/70 leading-none">Your shortlist</p>
            <h1 className="text-2xl font-extrabold leading-tight">Saved jobs</h1>
          </div>
          <button
            onClick={() => navigate('/student/jobs')}
            aria-label="Browse jobs"
            className="m-press w-11 h-11 rounded-full m-glass flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white">search</span>
          </button>
        </div>
        <p className="mt-3 text-[13px] text-white/75">
          <span className="font-bold text-white">{jobs.length}</span> {jobs.length === 1 ? 'role' : 'roles'} bookmarked
        </p>
      </section>

      {jobs.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Nothing saved yet"
          hint="Bookmark jobs you like and they'll appear here for easy access."
          action={
            <button onClick={() => navigate('/student/jobs')} className="m-press h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold">
              Browse jobs
            </button>
          }
        />
      ) : (
        <PullToRefresh onRefresh={load}>
          <div className="px-4 pt-3 space-y-3">
            {jobs.map((job, i) => {
              const match = Math.round(job.matchRate || 0);
              return (
                <div
                  key={job.id}
                  className={`m-card-lift rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 shadow-sm m-rise m-rise-${Math.min(i + 1, 5)}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={job.companyLogo} name={job.companyName} size={44} />
                    <button className="flex-1 min-w-0 text-left" onClick={() => navigate(`/student/jobs/${job.id}`)}>
                      <p className="text-[15px] font-bold leading-snug truncate">{job.title}</p>
                      <p className="text-xs text-on-surface-variant truncate">{job.companyName}</p>
                    </button>
                    <button
                      onClick={() => unsave(job.id)}
                      aria-label={`Remove ${job.title} from saved`}
                      className="m-press w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    >
                      <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    </button>
                  </div>

                  <button className="w-full text-left" onClick={() => navigate(`/student/jobs/${job.id}`)}>
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
                      {match > 0 && <span className="font-extrabold text-primary">{match}% match</span>}
                    </div>
                    {match > 0 && (
                      <div className="mt-3 h-1.5 rounded-full bg-on-surface/8 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#3bb98b]" style={{ width: `${Math.min(100, match)}%` }} />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
            <div className="h-4" />
          </div>
        </PullToRefresh>
      )}
    </MobileShell>
  );
};

export default MobileSavedJobs;
