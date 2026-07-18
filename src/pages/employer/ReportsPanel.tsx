import React, { useEffect, useState } from 'react';
import { HiringPipelineService, EmployerRecruiterService, EmployerOverviewService } from '../../services';
import type { PipelineAnalytics, EmployerRecruiter, EmployerInterview } from '../../services';
import { exportHiringFunnelCSV, exportRecruiterPerformanceCSV, exportInterviewsCSV } from '../../utils/exportUtils';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const recruiterDisplayName = (r: EmployerRecruiter) =>
  r.firstName || r.lastName ? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() : r.user.email;

const ExportBtn = ({ onClick }: { onClick: () => void }) => (
  <Button size="sm" variant="outline" onClick={onClick} leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>Export</Button>
);

export const ReportsPanel: React.FC = () => {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [recruiters, setRecruiters] = useState<EmployerRecruiter[] | null>(null);
  const [interviews, setInterviews] = useState<EmployerInterview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([HiringPipelineService.getAnalytics(), EmployerRecruiterService.getRecruiters(), EmployerOverviewService.getInterviews()])
      .then(([a, r, i]) => { setAnalytics(a); setRecruiters(r); setInterviews(i); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load reports.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const header = <PageHeader title="Reports" description="Every figure is computed live from your real hiring data — no separate report system to configure." />;
  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load reports" description={error} actionLabel="Retry" onAction={load} /></>;

  const interviewStatusCounts = (interviews ?? []).reduce<Record<string, number>>((acc, iv) => { acc[iv.status] = (acc[iv.status] ?? 0) + 1; return acc; }, {});
  const th = 'text-left px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant';

  return (
    <>
      {header}
      <div className="space-y-8">
        <Section title="Hiring funnel" description="Applications per job across your pipeline"
          action={<ExportBtn onClick={() => { if (!analytics || analytics.perJob.length === 0) { showToast('No jobs to export yet.', 'info'); return; } exportHiringFunnelCSV(analytics.perJob); showToast('Hiring funnel exported.', 'success'); }} />}>
          {!analytics || analytics.perJob.length === 0 ? (
            <Card><p className="text-label-md text-on-surface-variant">No jobs posted yet.</p></Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-body-md">
                <thead className="border-b border-outline-variant/60"><tr><th className={th}>Job</th><th className={th}>Total applications</th></tr></thead>
                <tbody>{analytics.perJob.map(job => (
                  <tr key={job.jobId} className="border-t border-outline-variant/60"><td className="px-5 py-3 font-semibold text-on-surface">{job.jobTitle}</td><td className="px-5 py-3 text-on-surface">{job.totalApplications}</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </Section>

        <Section title="Recruiter performance" description="Jobs, interviews and offers per recruiter"
          action={<ExportBtn onClick={() => { if (!recruiters || recruiters.length === 0) { showToast('No recruiters to export yet.', 'info'); return; } exportRecruiterPerformanceCSV(recruiters.map(r => ({ name: recruiterDisplayName(r), email: r.user.email, title: r.title, jobs: r._count.jobs, interviews: r._count.scheduledInterviews, offers: r._count.offers }))); showToast('Recruiter performance exported.', 'success'); }} />}>
          {!recruiters || recruiters.length === 0 ? (
            <Card><p className="text-label-md text-on-surface-variant">No recruiters yet.</p></Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-body-md">
                <thead className="border-b border-outline-variant/60"><tr><th className={th}>Recruiter</th><th className={th}>Jobs</th><th className={th}>Interviews</th><th className={th}>Offers</th></tr></thead>
                <tbody>{recruiters.map(r => (
                  <tr key={r.id} className="border-t border-outline-variant/60"><td className="px-5 py-3 font-semibold text-on-surface">{recruiterDisplayName(r)}</td><td className="px-5 py-3 text-on-surface">{r._count.jobs}</td><td className="px-5 py-3 text-on-surface">{r._count.scheduledInterviews}</td><td className="px-5 py-3 text-on-surface">{r._count.offers}</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </Section>

        <Section title="Interview outcomes" description="Interviews grouped by status"
          action={<ExportBtn onClick={() => { if (!interviews || interviews.length === 0) { showToast('No interviews to export yet.', 'info'); return; } exportInterviewsCSV(interviews.map(iv => ({ id: iv.id, name: `${iv.application.studentProfile.firstName} ${iv.application.studentProfile.lastName}`, role: iv.application.job.title, interviewer: iv.scheduledByRecruiter?.title ?? 'Unassigned', date: new Date(iv.scheduledAt).toLocaleDateString(), platform: iv.locationUrl ? 'Video call' : 'In-person', status: iv.status }))); showToast('Interview outcomes exported.', 'success'); }} />}>
          {!interviews || interviews.length === 0 ? (
            <Card><p className="text-label-md text-on-surface-variant">No interviews scheduled yet.</p></Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(interviewStatusCounts).map(([status, count]) => (
                <Card key={status} className="!p-4"><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">{status}</p><p className="text-headline-sm font-semibold text-on-surface mt-1">{count}</p></Card>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
};

export default ReportsPanel;
