import React, { useCallback, useEffect, useState } from 'react';
import { UniversityService, UniversityEcosystemService, type UniversityDashboard } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Section, ViewAll } from '../ui/Section';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AttentionCard } from '../ui/AttentionCard';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

interface Props { onNavigate?: (tab: string) => void; }
const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' });

export const UniversityOverviewPanel: React.FC<Props> = ({ onNavigate }) => {
  const [dashboard, setDashboard] = useState<UniversityDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eco, setEco] = useState<{ recruiters: any[]; openJobsTotal: number; employerTotal: number; employerActivity: any[]; hiringTrends: any[]; companies: any[]; internships: any[]; campusDrives: any[]; students: any[] } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setDashboard(await UniversityService.getDashboard()); }
    catch (err: any) { setError(err?.message || 'Failed to load dashboard.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { UniversityEcosystemService.getOverview().then(setEco).catch(() => setEco(null)); }, []);

  const header = <PageHeader title="University overview" description="Real-time placement operations across your university and the wider CareerBridge ecosystem." />;

  if (isLoading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !dashboard) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load your dashboard" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  return (
    <>
      {header}
      <div className="space-y-8">
        {dashboard.pendingVerificationsCount > 0 && (
          <AttentionCard icon="verified" tone="brand"
            title={`${dashboard.pendingVerificationsCount} student${dashboard.pendingVerificationsCount === 1 ? '' : 's'} awaiting verification`}
            description="Verify students so they appear to recruiters and can join campus drives."
            actionLabel="Review verifications" onAction={() => onNavigate?.('verification')} />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total students" value={dashboard.totalStudents.toLocaleString()} icon="school" hint="registered" onClick={() => onNavigate?.('students')} />
          <StatCard label="Students placed" value={dashboard.studentsPlaced.toLocaleString()} icon="workspace_premium" hint="secured offers" onClick={() => onNavigate?.('analytics')} />
          <StatCard label="Placement rate" value={`${dashboard.placementRate}%`} icon="trending_up" hint="of eligible" onClick={() => onNavigate?.('analytics')} />
          <StatCard label="Pending verifications" value={dashboard.pendingVerificationsCount} icon="pending_actions" hint="need review" onClick={() => onNavigate?.('verification')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Section title="Upcoming campus drives" action={<ViewAll onClick={() => onNavigate?.('drives')} />}>
              {dashboard.upcomingDrives.length === 0 ? (
                <EmptyState icon="event_available" title="No drives scheduled"
                  description="Schedule a campus drive to connect eligible students with hiring employers and recruiters."
                  actionLabel="Schedule a drive" onAction={() => onNavigate?.('drives')} />
              ) : (
                <Card className="!p-0 overflow-hidden">
                  <ul className="divide-y divide-outline-variant/60">
                    {dashboard.upcomingDrives.map(d => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-4">
                        <div className="min-w-0"><p className="text-body-md font-semibold text-on-surface truncate">{d.title}</p><p className="text-label-sm text-on-surface-variant truncate">{d.location}</p></div>
                        <Badge tone="info" icon="event">{fmt(d.scheduledAt)}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Section>

            {eco && (
              <Section title="Employer activity" description={`${eco.openJobsTotal} open roles across the platform`} action={<ViewAll label="View companies" onClick={() => onNavigate?.('companies')} />}>
                {eco.employerActivity.length > 0 ? (
                  <Card className="!p-0 overflow-hidden">
                    <ul className="divide-y divide-outline-variant/60">
                      {eco.employerActivity.slice(0, 8).map(a => (
                        <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                          <div className="min-w-0"><p className="text-body-md font-medium text-on-surface truncate">{a.title}</p><p className="text-label-sm text-on-surface-variant truncate">{[a.companyName, a.category].filter(Boolean).join(' · ')}</p></div>
                          <span className="text-label-sm text-on-surface-variant shrink-0">{fmt(a.postedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : <Card><p className="text-label-md text-on-surface-variant">No recent employer postings.</p></Card>}
              </Section>
            )}

            {eco && (
              <Section title="Registered employers" description={`${eco.employerTotal} companies on the platform`} action={<ViewAll onClick={() => onNavigate?.('companies')} />}>
                {eco.companies.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {eco.companies.slice(0, 6).map(c => (
                      <Card key={c.id} className="!p-4 flex items-center gap-3">
                        {c.logo ? <img src={c.logo} alt="" className="w-10 h-10 rounded-xl object-contain bg-surface-container p-1 shrink-0" /> : <span className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0">{(c.name || '?').substring(0, 2).toUpperCase()}</span>}
                        <div className="min-w-0"><p className="text-body-md font-semibold text-on-surface truncate">{c.name}</p><p className="text-label-sm text-on-surface-variant truncate">{c.industry} · {c.openJobsCount} open roles</p></div>
                      </Card>
                    ))}
                  </div>
                ) : <Card><p className="text-label-md text-on-surface-variant">No employers registered yet.</p></Card>}
              </Section>
            )}
          </div>

          <div className="space-y-8">
            {eco && (
              <Card>
                <CardHeader icon="insights" title="Hiring demand by field" />
                {eco.hiringTrends.length > 0 ? (
                  <ul className="space-y-2">{eco.hiringTrends.map(t => (
                    <li key={t.category} className="flex items-center justify-between text-label-md"><span className="text-on-surface truncate">{t.category || 'Uncategorized'}</span><Badge tone="brand">{t.openRoles}</Badge></li>
                  ))}</ul>
                ) : <p className="text-label-md text-on-surface-variant">No demand data yet.</p>}
              </Card>
            )}
            {eco && (
              <Card>
                <CardHeader icon="badge" title="Active recruiters" />
                {eco.recruiters.length > 0 ? (
                  <ul className="space-y-2">{eco.recruiters.slice(0, 6).map(r => (
                    <li key={r.id} className="text-label-md text-on-surface"><span className="font-semibold">{r.name}</span><span className="text-on-surface-variant"> · {r.companyName}</span></li>
                  ))}</ul>
                ) : <p className="text-label-md text-on-surface-variant">No recruiters yet.</p>}
              </Card>
            )}
            {eco && (
              <Card>
                <CardHeader icon="school" title="Open internships" />
                {eco.internships.length > 0 ? (
                  <ul className="space-y-3">{eco.internships.slice(0, 6).map(j => (
                    <li key={j.id} className="min-w-0"><p className="text-label-md font-semibold text-on-surface truncate">{j.title}</p><p className="text-label-sm text-on-surface-variant truncate">{j.companyName} · {j.location}</p></li>
                  ))}</ul>
                ) : <p className="text-label-md text-on-surface-variant">No internships posted yet.</p>}
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UniversityOverviewPanel;
