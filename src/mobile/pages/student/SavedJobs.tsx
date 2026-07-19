/**
 * Mobile Saved Jobs — premium bookmarked-roles list with one-tap unsave.
 * Mirrors the Jobs card language. All data + mutations via JobService (real API).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../../types';
import { JobService } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, JobListCard, SkeletonList, EmptyState, ErrorState, PullToRefresh } from '../../components';

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
            {jobs.map((job, i) => (
              <JobListCard
                key={job.id}
                job={job}
                index={i}
                onOpen={() => navigate(`/student/jobs/${job.id}`)}
                onUnsave={() => unsave(job.id)}
              />
            ))}
            <div className="h-4" />
          </div>
        </PullToRefresh>
      )}
    </MobileShell>
  );
};

export default MobileSavedJobs;
