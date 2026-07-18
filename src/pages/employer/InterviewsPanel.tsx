import React, { useEffect, useMemo, useState } from 'react';
import { EmployerOverviewService } from '../../services';
import type { EmployerInterview } from '../../services';
import { exportInterviewsCSV } from '../../utils/exportUtils';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, statusTone } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const FILTERS = ['All', 'Scheduled', 'Completed', 'Cancelled'] as const;
type Filter = typeof FILTERS[number];
const fullName = (s: EmployerInterview['application']['studentProfile']) => `${s.firstName} ${s.lastName}`.trim();

export const InterviewsPanel: React.FC = () => {
  const { showToast } = useToast();
  const [interviews, setInterviews] = useState<EmployerInterview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('All');

  const load = () => {
    setLoading(true); setError(null);
    EmployerOverviewService.getInterviews()
      .then(setInterviews)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load interviews.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const now = Date.now();
  const upcomingCount = useMemo(() => (interviews || []).filter(i => i.status?.toUpperCase() === 'SCHEDULED' && new Date(i.scheduledAt).getTime() > now).length, [interviews, now]);
  const completedCount = useMemo(() => (interviews || []).filter(i => i.status?.toUpperCase() === 'COMPLETED').length, [interviews]);

  const filtered = useMemo(() => (interviews || []).filter(i => filter === 'All' || i.status?.toUpperCase() === filter.toUpperCase()), [interviews, filter]);

  const handleExport = () => {
    if (!interviews || interviews.length === 0) { showToast('No interviews to export yet.', 'info'); return; }
    exportInterviewsCSV(interviews.map(iv => ({
      id: iv.id, name: fullName(iv.application.studentProfile), role: iv.application.job.title,
      interviewer: iv.scheduledByRecruiter?.title ?? 'Unassigned', date: new Date(iv.scheduledAt).toLocaleDateString(),
      platform: iv.locationUrl ? 'Video call' : 'In-person', status: iv.status,
    })));
    showToast('Interview schedule exported.', 'success');
  };

  return (
    <>
      <PageHeader
        title="Interviews"
        description="Every interview scheduled across your hiring pipeline, live from the database."
        actions={<Button variant="outline" onClick={handleExport} leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>Export</Button>}
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Upcoming" value={upcomingCount} icon="event_upcoming" hint="scheduled ahead" onClick={() => setFilter('Scheduled')} />
          <StatCard label="Completed" value={completedCount} icon="task_alt" hint="wrapped up" onClick={() => setFilter('Completed')} />
          <StatCard label="Total" value={interviews?.length ?? 0} icon="videocam" hint="all time" onClick={() => setFilter('All')} />
        </div>

        <div>
          <Toolbar filters={FILTERS.map(f => <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</FilterChip>)} />

          {loading ? (
            <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
          ) : error ? (
            <EmptyState icon="cloud_off" title="Couldn't load interviews" description={error} actionLabel="Retry" onAction={load} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="event_busy"
              title={(interviews?.length ?? 0) === 0 ? 'No interviews scheduled yet' : 'None in this view'}
              description={(interviews?.length ?? 0) === 0 ? "Schedule an interview from a candidate's card in the talent pipeline." : 'Try a different status filter.'} />
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Candidate</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Scheduled</th>
                    <th className="px-5 py-3 font-semibold">Interviewer</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(iv => (
                    <tr key={iv.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-on-surface">{fullName(iv.application.studentProfile)}</p>
                        <p className="text-label-sm text-on-surface-variant">{iv.application.studentProfile.user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">{iv.application.job.title}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{new Date(iv.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {iv.duration}m</td>
                      <td className="px-5 py-4 text-on-surface-variant">{iv.scheduledByRecruiter?.title ?? 'Unassigned'}</td>
                      <td className="px-5 py-4"><Badge tone={statusTone(iv.status)}>{iv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default InterviewsPanel;
