import React, { useEffect, useState, useMemo } from 'react';
import { EmployerOverviewService, EmployerTalentService } from '../../services';
import type { EmployerDashboardStats, EmployerInterview } from '../../services';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Section, ViewAll } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, statusTone } from '../../components/ui/Badge';
import { AttentionCard } from '../../components/ui/AttentionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

interface Props { onNavigate: (tab: string) => void; onPostJob: () => void; }

const fullName = (s: any): string => [s?.firstName, s?.lastName].filter(Boolean).join(' ') || s?.name || 'Candidate';

export const DashboardOverviewPanel: React.FC<Props> = ({ onNavigate, onPostJob }) => {
  const [stats, setStats] = useState<EmployerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [talent, setTalent] = useState<{ students: any[]; total: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    EmployerOverviewService.getDashboard()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
    EmployerOverviewService.getInterviews().then(setInterviews).catch(() => setInterviews([]));
    EmployerTalentService.getTalentPool({ pageSize: 5 }).then(setTalent).catch(() => setTalent(null));
  }, []);

  const upcoming = useMemo(() => interviews
    .filter(i => i.status?.toUpperCase() === 'SCHEDULED' && new Date(i.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()), [interviews]);

  if (loading) {
    return (
      <>
        <PageHeader title="Hiring overview" description="Real-time activity across your organization." />
        <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
      </>
    );
  }
  if (error || !stats) {
    return (
      <>
        <PageHeader title="Hiring overview" />
        <EmptyState icon="cloud_off" title="Couldn't load your dashboard"
          description={error || 'Please try again in a moment.'} actionLabel="Retry" onAction={() => window.location.reload()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Hiring overview"
        description="Real-time numbers across your organization's hiring activity."
        actions={
          <>
            <Button variant="outline" onClick={() => onNavigate('candidates')} leftIcon={<span className="material-symbols-outlined text-[19px]">groups</span>}>Discover candidates</Button>
            <Button variant="primary" onClick={onPostJob} leftIcon={<span className="material-symbols-outlined text-[19px]">add</span>}>Post a job</Button>
          </>
        }
      />

      <div className="space-y-8">
        {stats.activeJobsCount === 0 ? (
          <AttentionCard icon="work" tone="brand" title="Post your first job"
            description="Publish a role to start receiving applications and building your talent pipeline."
            actionLabel="Create a job" onAction={onPostJob} />
        ) : upcoming.length > 0 ? (
          <AttentionCard icon="videocam" tone="brand"
            title={`${upcoming.length} upcoming interview${upcoming.length === 1 ? '' : 's'}`}
            description="Review candidate profiles and prep your questions before each call."
            actionLabel="View interviews" onAction={() => onNavigate('interviews')} />
        ) : stats.totalApplications > 0 ? (
          <AttentionCard icon="assignment_ind" tone="brand"
            title={`${stats.totalApplications} application${stats.totalApplications === 1 ? '' : 's'} to review`}
            description="Triage candidates in bulk and move the strongest into your pipeline."
            actionLabel="Review candidates" onAction={() => onNavigate('candidates')} />
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard label="Active jobs" value={stats.activeJobsCount} icon="work" hint="published" onClick={() => onNavigate('jobs')} />
          <StatCard label="Applications" value={stats.totalApplications} icon="assignment_ind" hint="all roles" onClick={() => onNavigate('candidates')} />
          <StatCard label="Interviews" value={stats.upcomingInterviewCount} icon="videocam" hint="upcoming" onClick={() => onNavigate('interviews')} />
          <StatCard label="Active offers" value={stats.activeOfferCount} icon="handshake" hint="extended" onClick={() => onNavigate('pipeline')} />
          <StatCard label="Recruiters" value={stats.recruiterCount} icon="badge" hint="on your team" onClick={() => onNavigate('recruiters')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Section title="Recent job postings" action={<ViewAll onClick={() => onNavigate('jobs')} />}>
              {stats.jobsList.length === 0 ? (
                <EmptyState icon="work_off" title="No jobs posted yet"
                  description="Create your first job to start receiving applications from matched candidates."
                  actionLabel="Post a job" onAction={onPostJob} />
              ) : (
                <Card className="!p-0 overflow-hidden">
                  <ul className="divide-y divide-outline-variant/60">
                    {stats.jobsList.map(job => (
                      <li key={job.id} className="flex items-center justify-between gap-3 px-5 py-4">
                        <button onClick={() => onNavigate('jobs')} className="text-body-md font-medium text-on-surface hover:text-primary transition-colors text-left truncate">{job.title}</button>
                        <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Section>

            <Section title="Upcoming interviews" action={upcoming.length > 0 ? <ViewAll onClick={() => onNavigate('interviews')} /> : undefined}>
              {upcoming.length === 0 ? (
                <Card><p className="text-label-md text-on-surface-variant">No interviews scheduled. Move a candidate to the interview stage from your pipeline.</p></Card>
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 4).map(iv => {
                    const s = iv.application.studentProfile;
                    return (
                      <Card key={iv.id} className="!p-4">
                        <div className="flex items-center gap-3">
                          {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            : <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0">{(s.firstName || '?')[0]}</span>}
                          <div className="min-w-0 flex-grow">
                            <p className="text-body-md font-semibold text-on-surface truncate">{fullName(s)}</p>
                            <p className="text-label-sm text-on-surface-variant truncate">{iv.title} · {iv.application.job.title}</p>
                          </div>
                          <Badge tone="info" icon="schedule">{new Date(iv.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader icon="diversity_3" title="Talent pool" subtitle={talent ? `${talent.total} students discoverable` : 'Students on the platform'} />
              {!talent || talent.students.length === 0 ? (
                <p className="text-label-md text-on-surface-variant">Candidate profiles will appear here as students join and complete their profiles.</p>
              ) : (
                <div className="space-y-1">
                  {talent.students.slice(0, 5).map((s, i) => (
                    <button key={s.id || i} onClick={() => onNavigate('candidates')} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-surface-container transition-colors text-left">
                      {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        : <span className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-semibold shrink-0">{fullName(s)[0]}</span>}
                      <div className="min-w-0 flex-grow">
                        <p className="text-label-md font-medium text-on-surface truncate">{fullName(s)}</p>
                        <p className="text-label-sm text-on-surface-variant truncate">{s.headline || s.university || s.degree || 'Student'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate('candidates')}>Discover candidates</Button>
            </Card>

            <Card>
              <CardHeader icon="bolt" title="Quick actions" />
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="!justify-between" onClick={onPostJob}>Post a new job<span className="material-symbols-outlined text-[18px]">add</span></Button>
                <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('pipeline')}>Open talent pipeline<span className="material-symbols-outlined text-[18px]">account_tree</span></Button>
                <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('recruiters')}>Manage recruiters<span className="material-symbols-outlined text-[18px]">badge</span></Button>
                <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('company')}>Edit company profile<span className="material-symbols-outlined text-[18px]">apartment</span></Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardOverviewPanel;
