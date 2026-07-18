import React, { useEffect, useState } from 'react';
import { HiringPipelineService } from '../../services';
import type { PipelineAnalytics } from '../../services';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-surface-container-high',
  REVIEWING: 'bg-info',
  SHORTLISTED: 'bg-primary',
  SCREENING: 'bg-tertiary',
  INTERVIEWING: 'bg-warning',
  OFFERED: 'bg-success',
  REJECTED: 'bg-error',
  WITHDRAWN: 'bg-outline-variant',
};

const FunnelBar = ({ breakdown, total }: { breakdown: Record<string, number>; total: number }) => {
  if (total === 0) return <div className="h-3 w-full rounded-full bg-surface-container-high" />;
  return (
    <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-container-high" role="img" aria-label="Application status funnel">
      {Object.entries(breakdown).map(([status, count]) => (
        <div key={status} className={STATUS_COLORS[status] || 'bg-surface-container'} style={{ width: `${(count / total) * 100}%` }} title={`${status}: ${count}`} />
      ))}
    </div>
  );
};

type SortKey = 'jobTitle' | 'totalApplications';

export const AnalyticsPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('totalApplications');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = () => {
    setLoading(true); setError(null);
    HiringPipelineService.getAnalytics()
      .then(setAnalytics)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const header = <PageHeader title="Analytics" description="Hiring performance across every open role, computed live from your pipeline." />;

  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load analytics" description={error} actionLabel="Retry" onAction={load} /></>;
  if (!analytics) return <>{header}<EmptyState icon="monitoring" title="No analytics yet" description="Post jobs and receive applications to unlock hiring analytics." /></>;

  const perJobSorted = [...(analytics.perJob || [])].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'jobTitle') return a.jobTitle.localeCompare(b.jobTitle) * dir;
    return (a.totalApplications - b.totalApplications) * dir;
  });

  return (
    <>
      {header}
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Active jobs" value={analytics.activeJobs} icon="work" hint="open roles" />
          <StatCard label="Applications" value={analytics.totalApplications} icon="assignment_ind" hint="all roles" />
          <StatCard label="Avg. time to hire" value={analytics.timeToHireDays != null ? `${analytics.timeToHireDays}d` : '—'} icon="timer" hint="applied → hired" />
          <StatCard label="Offer acceptance" value={analytics.offerAcceptanceRate != null ? `${analytics.offerAcceptanceRate}%` : '—'} icon="handshake" hint="accepted / extended" />
        </div>

        <Section title="Company-wide status breakdown" description="Where all your applicants currently sit">
          <Card>
            <FunnelBar breakdown={analytics.statusBreakdown} total={analytics.totalApplications} />
            <div className="flex flex-wrap gap-4 mt-4 text-label-md text-on-surface-variant">
              {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${STATUS_COLORS[status] || 'bg-surface-container'}`} />
                  {status.charAt(0) + status.slice(1).toLowerCase()} ({count})
                </span>
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Per-job performance">
          {perJobSorted.length === 0 ? (
            <Card><p className="text-label-md text-on-surface-variant">No jobs posted yet.</p></Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-body-md">
                <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                  <tr>
                    <th className="text-left px-5 py-3"><button onClick={() => toggleSort('jobTitle')} className="flex items-center gap-1 font-semibold uppercase tracking-wide">Job {sortKey === 'jobTitle' && <span className="material-symbols-outlined text-[14px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</button></th>
                    <th className="text-left px-5 py-3"><button onClick={() => toggleSort('totalApplications')} className="flex items-center gap-1 font-semibold uppercase tracking-wide">Applications {sortKey === 'totalApplications' && <span className="material-symbols-outlined text-[14px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</button></th>
                    <th className="text-left px-5 py-3 w-1/2 font-semibold">Status funnel</th>
                  </tr>
                </thead>
                <tbody>
                  {perJobSorted.map(job => (
                    <tr key={job.jobId} className="border-t border-outline-variant/60">
                      <td className="px-5 py-3 font-semibold text-on-surface">{job.jobTitle}</td>
                      <td className="px-5 py-3 text-on-surface">{job.totalApplications}</td>
                      <td className="px-5 py-3"><FunnelBar breakdown={job.statusBreakdown} total={job.totalApplications} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
};

export default AnalyticsPanel;
