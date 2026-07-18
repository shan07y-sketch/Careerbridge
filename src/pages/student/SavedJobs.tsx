import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobService, ApplicationService } from '../../services';
import type { Job, Application } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Button } from '../../components/ui/Button';
import { JobCard } from '../../components/cards/JobCard';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { exportJobsCSV } from '../../utils/exportUtils';

type Category = 'All' | 'Remote' | 'Hybrid' | 'Internship' | 'Full-time';
const CATEGORIES: Category[] = ['All', 'Remote', 'Hybrid', 'Internship', 'Full-time'];

export const SavedJobs: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<Category>('All');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(false);
      const [items, apps] = await Promise.all([
        JobService.getSavedJobs(),
        ApplicationService.getApplications().catch(() => [] as Application[]),
      ]);
      setSavedJobs(items);
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredJobs = useMemo(() => savedJobs.filter(j => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!j.title.toLowerCase().includes(q) && !j.companyName.toLowerCase().includes(q)) return false;
    }
    if (category === 'Remote') return j.workMode === 'Remote';
    if (category === 'Hybrid') return j.workMode === 'Hybrid';
    if (category === 'Internship') return (j.type || '').toLowerCase().includes('intern');
    if (category === 'Full-time') return (j.type || '').toLowerCase().includes('full');
    return true;
  }), [savedJobs, searchTerm, category]);

  const appliedCount = savedJobs.filter(j => applications.some(app => app.jobId === j.id)).length;
  const strongMatches = savedJobs.filter(j => j.matchRate >= 85).length;

  return (
    <PageLayout searchPlaceholder="Search saved jobs…">
      <PageHeader
        title="Saved jobs"
        description="Opportunities you've bookmarked. Apply when you're ready."
        actions={
          <>
            <Button variant="outline" disabled={filteredJobs.length === 0}
              onClick={() => { exportJobsCSV(filteredJobs); showToast('Saved jobs exported to CSV.', 'success'); }}
              leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>
              Export
            </Button>
            <Button variant="primary" onClick={() => navigate('/student/jobs')}
              leftIcon={<span className="material-symbols-outlined text-[19px]">search</span>}>
              Discover more
            </Button>
          </>
        }
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Total saved" value={savedJobs.length} icon="bookmark" hint="ready to review" />
          <StatCard label="Strong matches" value={strongMatches} icon="stars" hint="85%+ alignment" />
          <StatCard label="Already applied" value={appliedCount} icon="task_alt" hint="from your saved list" onClick={() => navigate('/student/applications')} />
        </div>

        <div>
          <Toolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by title or company…"
            filters={CATEGORIES.map(c => (
              <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</FilterChip>
            ))}
          />

          {isLoading ? (
            <div className="grid gap-4">{[0, 1].map(i => <CardSkeleton key={i} />)}</div>
          ) : error ? (
            <EmptyState icon="cloud_off" title="Couldn't load saved jobs"
              description="We hit a problem reaching the jobs service. Please try again."
              actionLabel="Retry" onAction={fetchData} />
          ) : filteredJobs.length === 0 ? (
            <EmptyState icon="bookmark_border"
              title={savedJobs.length === 0 ? 'No saved jobs yet' : 'Nothing matches your filters'}
              description={savedJobs.length === 0
                ? 'Bookmark roles while browsing and they will collect here so you can compare and apply on your own schedule.'
                : 'Try a different category or clear your search.'}
              actionLabel={savedJobs.length === 0 ? 'Browse jobs' : 'Show all'}
              onAction={savedJobs.length === 0 ? () => navigate('/student/jobs') : () => { setCategory('All'); setSearchTerm(''); }} />
          ) : (
            <div className="grid gap-4">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} onApplySuccess={() => { showToast('Application submitted.', 'success'); fetchData(); }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SavedJobs;
