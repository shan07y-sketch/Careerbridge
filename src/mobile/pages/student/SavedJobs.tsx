/**
 * Mobile Saved Jobs — bookmarked roles with one-tap unsave.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../../types';
import { JobService } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, SkeletonList, EmptyState, ErrorState, PullToRefresh, Button, Avatar } from '../../components';

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
    try {
      await JobService.toggleSaveJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      showToast('Removed from saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  return (
    <MobileShell title="Saved jobs" subtitle={`${jobs.length} saved`}>
      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Nothing saved yet"
          hint="Bookmark jobs you like and they'll appear here."
          action={<Button onClick={() => navigate('/student/jobs')}>Browse jobs</Button>}
        />
      ) : (
        <div className="px-4 pt-4">
          <PullToRefresh onRefresh={load}>
            <div className="space-y-2.5">
              {jobs.map(job => (
                <Card key={job.id}>
                  <div className="flex items-center gap-3">
                    <Avatar src={job.companyLogo} name={job.companyName} size={40} />
                    <button className="flex-1 min-w-0 text-left m-press" onClick={() => navigate(`/student/jobs/${job.id}`)}>
                      <p className="text-sm font-bold truncate">{job.title}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {job.companyName}{job.location ? ` · ${job.location}` : ''}
                      </p>
                    </button>
                    <button onClick={() => unsave(job.id)} aria-label={`Remove ${job.title} from saved`} className="m-press w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    </button>
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

export default MobileSavedJobs;
