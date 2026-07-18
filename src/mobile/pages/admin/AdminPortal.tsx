/**
 * Mobile Admin Portal — one shell, key-based views over the real /admin API.
 * Read-heavy monitoring plus the highest-value moderation actions.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { AdminService } from '../../../services';
import type {
  AdminGlobalStats, AdminSystemMonitoring, AdminUserRow, AdminCompanyRow,
  AdminUniversityRow, AdminAuditLogRow, AdminFeatureFlag, AdminSupportTicket,
  AdminSession, AdminAnnouncement,
} from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Stat, Chip, SectionTitle, SkeletonList, EmptyState, ErrorState, Button } from '../../components';

const VIEW_TITLES: Record<string, string> = {
  overview: 'Overview', users: 'Users', organizations: 'Organizations', verification: 'Verification Queue',
  analytics: 'Analytics', moderation: 'Moderation', support: 'Support Tickets', health: 'System Health',
  sessions: 'Sessions & Devices', audit: 'Audit Logs', flags: 'Feature Flags', announcements: 'Announcements',
};

function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Request failed'); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, loading, error, reload: run };
}

const OverviewView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<AdminGlobalStats>(() => AdminService.getStats());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="group" label="Total users" value={data.totalUsers.toLocaleString()} />
        <Stat icon="apartment" label="Companies" value={data.companiesCount} />
        <Stat icon="school" label="Universities" value={data.universitiesCount} />
        <Stat icon="work" label="Jobs published" value={data.jobsPublished.toLocaleString()} />
        <Stat icon="assignment_turned_in" label="Applications" value={data.applicationsCount.toLocaleString()} />
        <Stat icon="person_add" label="New today" value={data.newUsersToday} />
      </div>
      <SectionTitle>Mock interview AI</SectionTitle>
      <Card>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-on-surface-variant">Sessions</span><span className="font-bold">{data.mockInterviews.totalSessions.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Completed</span><span className="font-bold">{data.mockInterviews.completedSessions.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Average score</span><span className="font-bold">{data.mockInterviews.averageScore != null ? Math.round(data.mockInterviews.averageScore) : '—'}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">AI reports vs estimated</span><span className="font-bold">{data.mockInterviews.aiGeneratedReports} / {data.mockInterviews.estimatedReports}</span></div>
        </div>
      </Card>
      <SectionTitle>Users by role</SectionTitle>
      <Card>
        <div className="space-y-2 text-sm">
          {data.usersByRole.map(r => (
            <div key={r.role} className="flex justify-between">
              <span className="text-on-surface-variant capitalize">{r.role.toLowerCase()}</span>
              <span className="font-bold">{r.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const UsersView: React.FC = () => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useAsync(() => AdminService.getUsers(1, 30, search || undefined), [search]);
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); showToast(msg); await reload(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
  };
  return (
    <div className="px-4 pt-3 space-y-2.5">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by email…"
        aria-label="Search users"
        className="w-full h-11 px-4 rounded-full bg-surface-container text-sm outline-none"
      />
      {loading ? <SkeletonList count={6} itemClass="h-16" /> :
       error || !data ? <ErrorState message={error || undefined} onRetry={reload} /> :
       (data.users as AdminUserRow[]).map(u => (
        <Card key={u.id}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{u.email}</p>
              <p className="text-xs text-on-surface-variant capitalize">{u.role.toLowerCase()} · joined {new Date(u.createdAt).toLocaleDateString()}</p>
            </div>
            <Chip tone={u.isDeleted ? 'error' : u.isVerified ? 'success' : 'warning'}>
              {u.isDeleted ? 'Suspended' : u.isVerified ? 'Verified' : 'Unverified'}
            </Chip>
          </div>
          <div className="flex gap-2 mt-3">
            {u.isDeleted ? (
              <Button full variant="tonal" onClick={() => act(() => AdminService.activateUser(u.id), 'User reactivated')}>Activate</Button>
            ) : (
              <>
                {!u.isVerified && <Button full variant="tonal" onClick={() => act(() => AdminService.verifyUser(u.id), 'User verified')}>Verify</Button>}
                <Button full variant="danger" onClick={() => act(() => AdminService.suspendUser(u.id), 'User suspended')}>Suspend</Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const OrganizationsView: React.FC<{ verifyMode?: boolean }> = ({ verifyMode }) => {
  const { showToast } = useToast();
  const companies = useAsync(() => AdminService.getCompanies(1, 30));
  const universities = useAsync(() => AdminService.getUniversities(1, 30));
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); showToast(msg); await Promise.all([companies.reload(), universities.reload()]); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
  };
  if (companies.loading || universities.loading) return <SkeletonList count={6} />;
  if (companies.error && universities.error) return <ErrorState message={companies.error || undefined} onRetry={companies.reload} />;

  const co = ((companies.data?.companies ?? []) as AdminCompanyRow[]).filter(c => !verifyMode || !c.isVerified);
  const un = ((universities.data?.universities ?? []) as AdminUniversityRow[]).filter(u => !verifyMode || !u.isVerified);

  return (
    <div className="px-4 pt-4">
      <SectionTitle>Companies {verifyMode ? 'awaiting verification' : ''}</SectionTitle>
      {co.length === 0 ? <Card><p className="text-sm text-on-surface-variant">Nothing here.</p></Card> : (
        <div className="space-y-2.5">
          {co.map(c => (
            <Card key={c.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">{c.industry} · {c._count.jobs} jobs</p>
                </div>
                <Chip tone={c.isVerified ? 'success' : 'warning'}>{c.isVerified ? 'Verified' : 'Pending'}</Chip>
              </div>
              {!c.isVerified && (
                <div className="mt-3">
                  <Button full variant="tonal" onClick={() => act(() => AdminService.verifyCompany(c.id, true), 'Company verified')}>Verify company</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <SectionTitle>Universities {verifyMode ? 'awaiting verification' : ''}</SectionTitle>
      {un.length === 0 ? <Card><p className="text-sm text-on-surface-variant">Nothing here.</p></Card> : (
        <div className="space-y-2.5">
          {un.map(u => (
            <Card key={u.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{u.name}</p>
                  <p className="text-xs text-on-surface-variant">{u.location} · {u._count.students} students</p>
                </div>
                <Chip tone={u.isVerified ? 'success' : 'warning'}>{u.isVerified ? 'Verified' : 'Pending'}</Chip>
              </div>
              {!u.isVerified && (
                <div className="mt-3">
                  <Button full variant="tonal" onClick={() => act(() => AdminService.verifyUniversity(u.id, true), 'University verified')}>Verify university</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const HealthView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<AdminSystemMonitoring>(() => AdminService.getMonitoring());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  const up = Math.floor(data.processUptimeSeconds / 3600);
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="database" label={`Database (${data.databaseStatus})`} value={`${data.databaseLatencyMs}ms`} />
        <Stat icon="schedule" label="Uptime" value={`${up}h`} />
        <Stat icon="memory" label="Heap used" value={`${Math.round(data.memory.heapUsedMb)}MB`} />
        <Stat icon="bug_report" label="Errors (24h)" value={data.recentErrorLogsLast24h} />
        <Stat icon="neurology" label="AI cache hit rate" value={`${Math.round(data.aiCacheHitRatePercent)}%`} />
        <Stat icon="speed" label="AI avg latency" value={`${Math.round(data.aiAvgLatencyMs)}ms`} />
      </div>
      <Card className="mt-3">
        <p className="text-xs text-on-surface-variant">
          Node {data.nodeVersion} · {data.platform} · {data.cpuCount} CPUs ·
          {' '}{Math.round(data.memory.systemFreeMb / 1024)}GB free of {Math.round(data.memory.systemTotalMb / 1024)}GB
        </p>
      </Card>
    </div>
  );
};

const SupportView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => AdminService.getSupportTickets(1, 30));
  const update = async (id: string, status: string) => {
    try { await AdminService.updateSupportTicket(id, { status }); showToast(`Ticket ${status.toLowerCase().replace('_', ' ')}`); await reload(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Update failed', 'error'); }
  };
  if (loading) return <SkeletonList count={5} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  const tickets = data.tickets as AdminSupportTicket[];
  if (tickets.length === 0) return <EmptyState icon="confirmation_number" title="No support tickets" />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {tickets.map(t => (
        <Card key={t.id}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold">{t.subject}</p>
            <Chip tone={t.status === 'OPEN' ? 'warning' : t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'success' : 'info'}>{t.status}</Chip>
          </div>
          <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{t.message}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">{t.requesterEmail} · {new Date(t.createdAt).toLocaleDateString()}</p>
          {t.status === 'OPEN' && (
            <div className="flex gap-2 mt-3">
              <Button full variant="tonal" onClick={() => update(t.id, 'IN_PROGRESS')}>Take</Button>
              <Button full variant="outline" onClick={() => update(t.id, 'RESOLVED')}>Resolve</Button>
            </div>
          )}
          {t.status === 'IN_PROGRESS' && (
            <div className="mt-3"><Button full variant="tonal" onClick={() => update(t.id, 'RESOLVED')}>Mark resolved</Button></div>
          )}
        </Card>
      ))}
    </div>
  );
};

const SessionsView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => AdminService.getActiveSessions(1, 30));
  if (loading) return <SkeletonList count={5} itemClass="h-16" />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  const sessions = data.sessions as AdminSession[];
  if (sessions.length === 0) return <EmptyState icon="devices" title="No active sessions" />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {sessions.map(s => (
        <Card key={s.id}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{s.user.email}</p>
              <p className="text-xs text-on-surface-variant capitalize">
                {s.user.role.toLowerCase()} · expires {new Date(s.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={async () => {
                try { await AdminService.revokeSession(s.id); showToast('Session revoked'); await reload(); }
                catch (err) { showToast(err instanceof Error ? err.message : 'Failed', 'error'); }
              }}
              className="m-press h-9 px-4 rounded-full bg-error-container text-on-error-container text-xs font-bold"
            >
              Revoke
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

const AuditView: React.FC = () => {
  const { data, loading, error, reload } = useAsync(() => AdminService.getAuditLogs(1, 40));
  if (loading) return <SkeletonList count={8} itemClass="h-12" />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  const logs = data.logs as AdminAuditLogRow[];
  return (
    <div className="px-4 pt-4 space-y-2">
      {logs.map(l => (
        <div key={l.id} className="m-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold truncate">{l.action}</p>
            <span className="text-[10px] text-on-surface-variant shrink-0">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{l.user?.email || 'system'}{l.ipAddress ? ` · ${l.ipAddress}` : ''}</p>
        </div>
      ))}
    </div>
  );
};

const FlagsView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync<AdminFeatureFlag[]>(() => AdminService.getFeatureFlags());
  if (loading) return <SkeletonList count={5} itemClass="h-14" />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(f => (
        <Card key={f.key}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{f.key}</p>
              {f.description && <p className="text-xs text-on-surface-variant">{f.description}</p>}
            </div>
            <button
              role="switch"
              aria-checked={f.value}
              aria-label={`Toggle ${f.key}`}
              onClick={async () => {
                try { await AdminService.updateFeatureFlag(f.key, !f.value); showToast(`${f.key} ${!f.value ? 'enabled' : 'disabled'}`); await reload(); }
                catch (err) { showToast(err instanceof Error ? err.message : 'Failed', 'error'); }
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${f.value ? 'bg-primary' : 'bg-surface-container-highest'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${f.value ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

const AnnouncementsView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync<AdminAnnouncement[]>(() => AdminService.getAnnouncements());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  if (data.length === 0) return <EmptyState icon="notifications_active" title="No announcements" hint="Create announcements from the desktop portal." />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(a => (
        <Card key={a.id}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold">{a.title}</p>
            <Chip tone={a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'info'}>{a.severity}</Chip>
          </div>
          <p className="text-xs text-on-surface-variant mt-1 line-clamp-3">{a.content}</p>
          <div className="mt-3">
            <Button
              full
              variant={a.isActive ? 'outline' : 'tonal'}
              onClick={async () => {
                try { await AdminService.setAnnouncementActive(a.id, !a.isActive); showToast(a.isActive ? 'Announcement deactivated' : 'Announcement activated'); await reload(); }
                catch (err) { showToast(err instanceof Error ? err.message : 'Failed', 'error'); }
              }}
            >
              {a.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

const MobileAdminPortal: React.FC = () => {
  const [view, setView] = useState('overview');

  const render = () => {
    switch (view) {
      case 'users': return <UsersView />;
      case 'organizations': return <OrganizationsView />;
      case 'verification': return <OrganizationsView verifyMode />;
      case 'analytics': return <OverviewView />;
      case 'moderation': return <SupportView />;
      case 'support': return <SupportView />;
      case 'health': return <HealthView />;
      case 'sessions': return <SessionsView />;
      case 'audit': return <AuditView />;
      case 'flags': return <FlagsView />;
      case 'announcements': return <AnnouncementsView />;
      default: return <OverviewView />;
    }
  };

  return (
    <MobileShell
      title={VIEW_TITLES[view] || 'Admin'}
      subtitle="Platform administration"
      role="admin"
      activeKey={view}
      onNavigate={setView}
    >
      {render()}
    </MobileShell>
  );
};

export default MobileAdminPortal;
