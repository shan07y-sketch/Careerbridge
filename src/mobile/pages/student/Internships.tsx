/**
 * Mobile Internships — premium, focused view of internship roles.
 * Filters the real jobs feed to internships; shared JobListCard language.
 * All data from JobService (real API); presentation only.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../../types';
import { JobService } from '../../../services';
import { MobileShell, Chip, JobListCard, SkeletonList, EmptyState, ErrorState, PullToRefresh } from '../../components';

type Filter = 'all' | 'Remote' | 'Hybrid' | 'On-site';
const FILTERS: Filter[] = ['all', 'Remote', 'Hybrid', 'On-site'];

const isInternship = (job: Job): boolean =>
  String(job.type || '').toLowerCase().includes('intern');

const MobileInternships: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setError(null);
    try {
      setJobs(await JobService.getJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const internships = useMemo(() => jobs.filter(isInternship), [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return internships
      .filter(job => {
        if (filter !== 'all' && job.workMode !== filter) return false;
        if (q && !`${job.title} ${job.companyName} ${job.location}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (b.matchRate || 0) - (a.matchRate || 0));
  }, [internships, query, filter]);

  if (loading) {
    return <MobileShell title="Internships"><SkeletonList count={6} itemClass="h-28" /></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Internships"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  return (
    <MobileShell bare>
      {/* ---- Aurora hero + search ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <p className="text-[13px] text-white/70 leading-none">Early careers</p>
        <h1 className="text-2xl font-extrabold leading-tight">Internships</h1>

        <label className="mt-4 flex items-center gap-2 h-12 px-4 rounded-2xl m-glass">
          <span className="material-symbols-outlined text-[20px] text-white/80" aria-hidden="true">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search internships"
            aria-label="Search internships"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="m-press">
              <span className="material-symbols-outlined text-[18px] text-white/80">close</span>
            </button>
          )}
        </label>

        <p className="mt-3 text-[13px] text-white/75">
          <span className="font-bold text-white">{internships.length}</span> internship{internships.length === 1 ? '' : 's'} open
        </p>
      </section>

      {/* ---- Sticky refine bar ---- */}
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-on-surface/5">
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="school"
          title={internships.length === 0 ? 'No internships open yet' : 'No matching internships'}
          hint={internships.length === 0
            ? 'New internships are posted regularly — check back soon.'
            : 'Try a different search or clear the filters.'}
          action={(query || filter !== 'all') ? (
            <button onClick={() => { setQuery(''); setFilter('all'); }} className="m-press h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold">
              Clear filters
            </button>
          ) : (
            <button onClick={() => navigate('/student/jobs')} className="m-press h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold">
              Browse all jobs
            </button>
          )}
        />
      ) : (
        <PullToRefresh onRefresh={load}>
          <div className="px-4 pt-3 space-y-3">
            {filtered.map((job, i) => (
              <JobListCard key={job.id} job={job} index={i} onOpen={() => navigate(`/student/jobs/${job.id}`)} />
            ))}
            <div className="h-4" />
          </div>
        </PullToRefresh>
      )}
    </MobileShell>
  );
};

export default MobileInternships;
