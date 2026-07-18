import React, { useEffect, useState } from 'react';
import { AdminService, type AdminGlobalStats } from '../../../services';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Section } from '../../../components/ui/Section';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

export const AdminAnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<AdminGlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => { setLoading(true); setError(null); AdminService.getStats().then(setStats).catch(e => setError(e?.message || 'Failed to load analytics.')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const header = <PageHeader title="Platform analytics" description="Growth and engagement across CareerBridge, computed live from the database." />;
  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !stats) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load analytics" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  const maxRole = Math.max(1, ...stats.usersByRole.map(r => r.count));

  return (
    <>
      {header}
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} icon="group" hint={`+${stats.newUsersToday} today`} />
          <StatCard label="Active today" value={stats.activeUsersToday.toLocaleString()} icon="bolt" hint="signed in" />
          <StatCard label="Jobs published" value={stats.jobsPublished.toLocaleString()} icon="work" hint="live roles" />
          <StatCard label="Applications" value={stats.applicationsCount.toLocaleString()} icon="assignment_ind" hint="all time" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Companies" value={stats.companiesCount.toLocaleString()} icon="apartment" hint="registered" />
          <StatCard label="Universities" value={stats.universitiesCount.toLocaleString()} icon="school" hint="registered" />
          <StatCard label="Suspended" value={stats.suspendedUsers.toLocaleString()} icon="block" hint="restricted" />
          <StatCard label="New today" value={stats.newUsersToday.toLocaleString()} icon="person_add" hint="sign-ups" />
        </div>
        <Section title="User distribution by role">
          <Card>
            {stats.usersByRole.length === 0 ? <p className="text-label-md text-on-surface-variant">No users yet.</p> : (
              <div className="space-y-4">{stats.usersByRole.map(r => (
                <div key={r.role}>
                  <div className="flex justify-between text-label-md mb-1.5"><span className="font-semibold text-on-surface capitalize">{r.role.toLowerCase()}</span><span className="text-on-surface-variant">{r.count.toLocaleString()}</span></div>
                  <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / maxRole) * 100}%` }} /></div>
                </div>
              ))}</div>
            )}
          </Card>
        </Section>
      </div>
    </>
  );
};

export default AdminAnalyticsView;
