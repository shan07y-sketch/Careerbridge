import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobService } from '../../services';
import type { Job } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Button } from '../../components/ui/Button';
import { JobCard } from '../../components/cards/JobCard';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

type WorkMode = 'All' | 'Remote' | 'Hybrid' | 'On-site';
type SortKey = 'match' | 'newest' | 'salary' | 'deadline';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'match', label: 'Best match' },
  { key: 'newest', label: 'Newest' },
  { key: 'salary', label: 'Highest salary' },
  { key: 'deadline', label: 'Deadline soon' },
];

const salaryFloor = (range: string): number => {
  const first = range.replace(/\$/g, '').replace(/k/gi, '').split('-')[0];
  const n = parseInt((first || '').trim(), 10);
  return Number.isFinite(n) ? n : 0;
};

export const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('All');
  const [easyApplyOnly, setEasyApplyOnly] = useState(false);
  const [strongMatchOnly, setStrongMatchOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('match');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchJobsData = async () => {
    try {
      setIsLoading(true);
      setError(false);
      const items = await JobService.getJobs();
      setJobs(items);
      const saved = await JobService.getSavedJobs();
      setSavedCount(saved.length);
    } catch (err) {
      console.error('Failed to load opportunities', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJobsData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, workMode, easyApplyOnly, strongMatchOnly, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setWorkMode('All');
    setEasyApplyOnly(false);
    setStrongMatchOnly(false);
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q));
    }
    if (workMode !== 'All') result = result.filter(j => j.workMode === workMode);
    if (easyApplyOnly) result = result.filter(j => j.easyApply);
    if (strongMatchOnly) result = result.filter(j => j.matchRate >= 85);

    if (sortBy === 'match') result.sort((a, b) => b.matchRate - a.matchRate);
    else if (sortBy === 'newest') result.sort((a, b) => b.postedTime.localeCompare(a.postedTime));
    else if (sortBy === 'salary') result.sort((a, b) => salaryFloor(b.salaryRange) - salaryFloor(a.salaryRange));
    else if (sortBy === 'deadline') result.sort((a, b) => (a.deadline || '~').localeCompare(b.deadline || '~'));
    return result;
  }, [jobs, searchTerm, workMode, easyApplyOnly, strongMatchOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage));
  const paginatedJobs = useMemo(
    () => filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredJobs, currentPage]);

  const strongMatches = useMemo(() => jobs.filter(j => j.matchRate >= 85).length, [jobs]);
  const easyApplyJobs = useMemo(() => jobs.filter(j => j.easyApply).length, [jobs]);

  return (
    <PageLayout searchPlaceholder="Search jobs, companies, skills…">
      <PageHeader
        title="Discover opportunities"
        description="Live postings matched to your skills, preferences and career goal."
        actions={
          <Button variant="outline" onClick={() => navigate('/student/saved-jobs')}
            leftIcon={<span className="material-symbols-outlined text-[19px]">bookmark</span>}>
            Saved ({savedCount})
          </Button>
        }
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Open roles" value={jobs.length} icon="work" hint="in your feed" />
          <StatCard label="Strong matches" value={strongMatches} icon="stars" hint="85%+ alignment" onClick={() => setStrongMatchOnly(true)} />
          <StatCard label="Easy apply" value={easyApplyJobs} icon="bolt" hint="one-click" onClick={() => setEasyApplyOnly(true)} />
          <StatCard label="Saved" value={savedCount} icon="bookmark" hint="review later" onClick={() => navigate('/student/saved-jobs')} />
        </div>

        <div>
          <Toolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search roles, companies, technologies…"
            filters={
              <>
                {(['All', 'Remote', 'Hybrid', 'On-site'] as WorkMode[]).map(m => (
                  <FilterChip key={m} active={workMode === m} onClick={() => setWorkMode(m)}>{m}</FilterChip>
                ))}
                <FilterChip active={easyApplyOnly} onClick={() => setEasyApplyOnly(v => !v)}>Easy apply</FilterChip>
                <FilterChip active={strongMatchOnly} onClick={() => setStrongMatchOnly(v => !v)}>Strong match</FilterChip>
              </>
            }
            actions={
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-10 px-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-label-md font-semibold text-on-surface focus:border-primary/40 focus:ring-0 outline-none cursor-pointer"
                aria-label="Sort jobs"
              >
                {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            }
          />

          {isLoading ? (
            <div className="grid gap-4">{[0, 1, 2].map(i => <CardSkeleton key={i} />)}</div>
          ) : error ? (
            <EmptyState
              icon="cloud_off"
              title="Couldn't load opportunities"
              description="We hit a problem reaching the jobs service. Check your connection and try again."
              actionLabel="Retry"
              onAction={fetchJobsData}
            />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon="search_off"
              title={jobs.length === 0 ? 'No open roles yet' : 'No jobs match your filters'}
              description={jobs.length === 0
                ? 'New postings appear here as employers publish them. Complete your profile so we can match you the moment they do.'
                : 'Try widening your filters or clearing your search to see more roles.'}
              actionLabel={jobs.length === 0 ? 'Complete profile' : 'Clear filters'}
              onAction={jobs.length === 0 ? () => navigate('/student/profile') : resetFilters}
            />
          ) : (
            <>
              <p className="text-label-sm text-on-surface-variant mb-4">
                Showing {paginatedJobs.length} of {filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'}
              </p>
              <div className="grid gap-4">
                {paginatedJobs.map(job => (
                  <JobCard key={job.id} job={job} onApplySuccess={() => showToast('Application submitted.', 'success')} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-8">
                  <Button variant="outline" size="sm" disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>Previous</Button>
                  <span className="text-label-md font-semibold text-on-surface-variant">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Jobs;
