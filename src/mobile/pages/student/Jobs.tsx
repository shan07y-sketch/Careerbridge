/**
 * Mobile Jobs browser — searchable, filterable list with large touch cards.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../../types';
import { JobService } from '../../../services';
import { MobileShell, Card, Chip, SkeletonList, EmptyState, ErrorState, PullToRefresh, Avatar } from '../../components';

type Filter = 'all' | 'Remote' | 'Hybrid' | 'On-site' | 'Internship';

const MobileJobs: React.FC = () => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(job => {
      if (filter === 'Internship' && job.type !== 'Internship') return false;
      if ((filter === 'Remote' || filter === 'Hybrid' || filter === 'On-site') && job.workMode !== filter) return false;
      if (q && !`${job.title} ${job.companyName} ${job.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, query, filter]);

  return (
    <MobileShell title="Jobs" subtitle={`${jobs.length} open roles`}>
      <div className="px-4 pt-3 sticky top-14 z-20 bg-surface pb-2">
        <label className="flex items-center gap-2 h-11 px-4 rounded-full bg-surface-container">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search roles or companies"
            aria-label="Search jobs"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
            </button>
          )}
        </label>
        <div className="flex gap-2 overflow-x-auto pt-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {(['all', 'Remote', 'Hybrid', 'On-site', 'Internship'] as Filter[]).map(f => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f}
            </Chip>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList count={6} itemClass="h-24" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="work_off" title="No matching jobs" hint="Try a different search or clear the filters." />
      ) : (
        <div className="px-4 pt-2 space-y-2.5">
          <PullToRefresh onRefresh={load}>
            <div className="space-y-2.5">
              {filtered.map(job => (
                <Card key={job.id} onClick={() => navigate(`/student/jobs/${job.id}`)}>
                  <div className="flex items-start gap-3">
                    <Avatar src={job.companyLogo} name={job.companyName} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-snug">{job.title}</p>
                      <p className="text-xs text-on-surface-variant">{job.companyName}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-on-surface-variant">
                        {job.location && <span>{job.location}</span>}
                        {job.workMode && <span>· {job.workMode}</span>}
                        {job.salaryRange && <span>· {job.salaryRange}</span>}
                        {job.postedTime && <span>· {job.postedTime}</span>}
                      </div>
                    </div>
                    {job.matchRate > 0 && (
                      <span className="text-xs font-bold text-success shrink-0">{Math.round(job.matchRate)}%</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </PullToRefresh>
        </div>
      )}
    </MobileShell>
  );
};

export default MobileJobs;
