/**
 * Mobile Jobs browser — premium searchable, filterable role feed.
 * Aurora hero + glass search, sticky filter chips, match-ranked cards.
 * All data comes from JobService (real API); presentation only.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../../types';
import { JobService } from '../../../services';
import { MobileShell, Chip, JobListCard, SkeletonList, EmptyState, ErrorState, PullToRefresh } from '../../components';

type Filter = 'all' | 'Remote' | 'Hybrid' | 'On-site' | 'Internship';
type Sort = 'match' | 'recent';

const FILTERS: Filter[] = ['all', 'Remote', 'Hybrid', 'On-site', 'Internship'];

const MobileJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('match');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = jobs.filter(job => {
      if (filter === 'Internship' && job.type !== 'Internship') return false;
      if ((filter === 'Remote' || filter === 'Hybrid' || filter === 'On-site') && job.workMode !== filter) return false;
      if (q && !`${job.title} ${job.companyName} ${job.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === 'match') list.sort((a, b) => (b.matchRate || 0) - (a.matchRate || 0));
    return list;
  }, [jobs, query, filter, sort]);

  const hasMatches = useMemo(() => jobs.some(j => (j.matchRate || 0) > 0), [jobs]);

  return (
    <MobileShell bare>
      {/* ---- Aurora hero + search ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-white/70 leading-none">Discover</p>
            <h1 className="text-2xl font-extrabold leading-tight">Find your role</h1>
          </div>
          <button
            onClick={() => navigate('/student/saved')}
            aria-label="Saved jobs"
            className="m-press w-11 h-11 rounded-full m-glass flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white">bookmark</span>
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 h-12 px-4 rounded-2xl m-glass">
          <span className="material-symbols-outlined text-[20px] text-white/80" aria-hidden="true">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search roles or companies"
            aria-label="Search jobs"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="m-press">
              <span className="material-symbols-outlined text-[18px] text-white/80">close</span>
            </button>
          )}
        </label>

        <p className="mt-3 text-[13px] text-white/75">
          <span className="font-bold text-white">{jobs.length}</span> open roles
          {hasMatches && ' · ranked by how well they match you'}
        </p>
      </section>

      {/* ---- Sticky refine bar ---- */}
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-on-surface/5">
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All roles' : f}
            </Chip>
          ))}
          {hasMatches && (
            <Chip selected={sort === 'match'} onClick={() => setSort(s => (s === 'match' ? 'recent' : 'match'))}>
              <span className="material-symbols-outlined text-[16px]">
                {sort === 'match' ? 'auto_awesome' : 'schedule'}
              </span>
              {sort === 'match' ? 'Best match' : 'Most recent'}
            </Chip>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonList count={6} itemClass="h-28" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="work_off"
          title={query || filter !== 'all' ? 'No matching jobs' : 'No open roles yet'}
          hint={query || filter !== 'all' ? 'Try a different search or clear the filters.' : 'Check back soon — new roles are added regularly.'}
          action={(query || filter !== 'all') ? (
            <button
              onClick={() => { setQuery(''); setFilter('all'); }}
              className="m-press h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold"
            >
              Clear filters
            </button>
          ) : undefined}
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

export default MobileJobs;
