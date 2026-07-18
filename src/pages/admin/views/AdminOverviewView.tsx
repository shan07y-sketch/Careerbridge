import React, { useEffect, useState } from 'react';
import { AdminService, type AdminGlobalStats } from '../../../services';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Section } from '../../../components/ui/Section';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AttentionCard } from '../../../components/ui/AttentionCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

export const AdminOverviewView: React.FC<{ onNavigate: (k: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminGlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError(null);
    AdminService.getStats().then(setStats).catch(e => setError(e?.message || 'Failed to load platform stats.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const header = <PageHeader title="Command center" description="Platform-wide health and activity across CareerBridge, live from the database." />;
  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !stats) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load platform stats" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  const pending = stats.unverifiedCompanies + stats.unverifiedUniversities + stats.pendingStudentVerifications;

  return (
    <>
      {header}
      <div className="space-y-8">
        {pending > 0 && (
          <AttentionCard icon="verified" tone="brand"
            title={`${pending} verification${pending === 1 ? '' : 's'} awaiting review`}
            description={`${stats.unverifiedCompanies} companies, ${stats.unverifiedUniversities} universities and ${stats.pendingStudentVerifications} students need attention.`}
            actionLabel="Open verification queue" onAction={() => onNavigate('verification')} />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} icon="group" hint={`+${stats.newUsersToday} today`} onClick={() => onNavigate('users')} />
          <StatCard label="Companies" value={stats.companiesCount.toLocaleString()} icon="apartment" hint={`${stats.unverifiedCompanies} unverified`} onClick={() => onNavigate('organizations')} />
          <StatCard label="Universities" value={stats.universitiesCount.toLocaleString()} icon="school" hint={`${stats.unverifiedUniversities} unverified`} onClick={() => onNavigate('organizations')} />
          <StatCard label="Active today" value={stats.activeUsersToday.toLocaleString()} icon="bolt" hint="signed in today" onClick={() => onNavigate('analytics')} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Jobs published" value={stats.jobsPublished.toLocaleString()} icon="work" hint="live roles" />
          <StatCard label="Applications" value={stats.applicationsCount.toLocaleString()} icon="assignment_ind" hint="all time" />
          <StatCard label="Suspended users" value={stats.suspendedUsers.toLocaleString()} icon="block" hint="restricted" onClick={() => onNavigate('users')} />
          <StatCard label="Pending verifications" value={pending.toLocaleString()} icon="pending_actions" hint="need review" onClick={() => onNavigate('verification')} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Mock interviews" value={stats.mockInterviews.completedSessions.toLocaleString()} icon="interpreter_mode" hint={`${stats.mockInterviews.inProgressSessions} in progress · ${stats.mockInterviews.abandonedSessions} abandoned`} />
          <StatCard label="Avg interview score" value={stats.mockInterviews.averageScore != null ? `${stats.mockInterviews.averageScore}/100` : '—'} icon="grade" hint={`readiness ${stats.mockInterviews.averageReadiness ?? '—'}`} />
          <StatCard label="AI-generated reports" value={stats.mockInterviews.aiGeneratedReports.toLocaleString()} icon="auto_awesome" hint={`${stats.mockInterviews.estimatedReports} estimated (fallback)`} />
          <StatCard label="Shared with employers" value={stats.mockInterviews.sharedWithEmployers.toLocaleString()} icon="share" hint="student opt-in" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Section title="Users by role">
              <Card>
                {stats.usersByRole.length === 0 ? <p className="text-label-md text-on-surface-variant">No users yet.</p> : (
                  <ul className="space-y-2">{stats.usersByRole.map(r => (
                    <li key={r.role} className="flex items-center justify-between text-label-md"><span className="text-on-surface capitalize">{r.role.toLowerCase()}</span><Badge tone="brand">{r.count.toLocaleString()}</Badge></li>
                  ))}</ul>
                )}
              </Card>
            </Section>
          </div>
          <Card>
            <CardHeader icon="bolt" title="Quick actions" />
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('verification')}>Verification queue<span className="material-symbols-outlined text-[18px]">fact_check</span></Button>
              <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('users')}>Manage users<span className="material-symbols-outlined text-[18px]">group</span></Button>
              <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('health')}>System health<span className="material-symbols-outlined text-[18px]">health_and_safety</span></Button>
              <Button variant="ghost" className="!justify-between" onClick={() => onNavigate('announcements')}>Announcements<span className="material-symbols-outlined text-[18px]">campaign</span></Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminOverviewView;
