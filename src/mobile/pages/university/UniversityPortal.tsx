/**
 * Mobile University Portal — one shell, key-based views, shared services only.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { UniversityService } from '../../../services';
import type {
  UniversityDashboard, UniversityStudent,
  PartnerCompany, SentBroadcast, UniversityActivity,
} from '../../../services';
import { MobileShell, Card, Stat, Chip, SectionTitle, SkeletonList, EmptyState, ErrorState, Button, Sheet, Avatar, Progress, ScoreRing, PullToRefresh } from '../../components';
import StudentManagement from './StudentManagement';
import PlacementManagement from './PlacementManagement';
import InternshipManagement from './InternshipManagement';
import UniversityAnalytics from './UniversityAnalytics';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', students: 'Students', companies: 'Companies', drives: 'Placements',
  internships: 'Internships', analytics: 'Analytics', reports: 'Reports', messages: 'Messages',
  verification: 'Verification', help: 'Help & Support',
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Compact package formatting (e.g. 727929 → "728k"). */
const pkg = (v: number | null): string => (v == null ? '—' : `${Math.round(v / 1000)}k`);

/** Animated KPI card. */
const Kpi: React.FC<{ icon: string; label: string; value: React.ReactNode; tone?: string }> = ({ icon, label, value, tone = 'text-primary' }) => (
  <div className="m-card p-3.5 flex flex-col gap-1.5">
    <span className={`material-symbols-outlined text-[20px] ${tone}`}>{icon}</span>
    <span className="text-2xl font-extrabold text-on-surface leading-none">{value}</span>
    <span className="text-[11px] text-on-surface-variant leading-tight">{label}</span>
  </div>
);

const ACTIVITY_META: Record<UniversityActivity['type'], { icon: string; tone: string }> = {
  APPLICATION: { icon: 'send', tone: 'text-info' },
  PLACEMENT: { icon: 'workspace_premium', tone: 'text-success' },
  DRIVE: { icon: 'campaign', tone: 'text-primary' },
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

const OverviewView: React.FC<{ onNavigate: (k: string) => void }> = ({ onNavigate }) => {
  const { data, loading, error, reload } = useAsync<UniversityDashboard>(() => UniversityService.getDashboard());
  if (loading) return <div className="pb-6"><SkeletonList count={6} /></div>;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;

  const { university: uni, students: st, placement: pl, internships: intern } = data;

  const quickActions = [
    { icon: 'school', label: 'Students', key: 'students' },
    { icon: 'insights', label: 'Placement', key: 'analytics' },
    { icon: 'campaign', label: 'Drives', key: 'drives' },
    { icon: 'summarize', label: 'Reports', key: 'reports' },
  ];

  return (
    <PullToRefresh onRefresh={reload}>
      {/* ── Aurora hero ── */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-8 rounded-b-[28px]">
        <div className="flex items-center gap-3">
          <Avatar src={uni.logoUrl} name={uni.name} size={44} />
          <div className="min-w-0">
            <p className="text-[13px] text-white/70 leading-none">{greeting()}</p>
            <p className="text-lg font-extrabold leading-tight truncate">{uni.name}</p>
            {uni.location && <p className="text-[12px] text-white/60 truncate">{uni.location}</p>}
          </div>
        </div>

        {/* Placement pulse */}
        <div className="mt-5 flex items-center gap-4 rounded-3xl m-glass p-4">
          <div className="shrink-0"><ScoreRing score={pl.placementPercentage} size={72} label="placed" /></div>
          <div className="min-w-0">
            <p className="text-sm font-bold">Placement rate</p>
            <p className="text-[13px] text-white/75 leading-snug">
              {pl.placed} of {st.total} student{st.total === 1 ? '' : 's'} placed · {intern.internshipPercentage}% did an internship.
            </p>
          </div>
        </div>

        {/* Live stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { v: st.total, l: 'Students' },
            { v: pl.placed, l: 'Placed' },
            { v: data.companiesConnected, l: 'Companies' },
          ].map((x, i) => (
            <div key={i} className="rounded-2xl m-glass py-2.5 text-center">
              <p className="text-xl font-extrabold leading-none">{x.v}</p>
              <p className="text-[11px] text-white/70 mt-1">{x.l}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-4">
        {/* ── Quick actions ── */}
        <div className="grid grid-cols-4 gap-2 mt-4 m-rise m-rise-1">
          {quickActions.map(a => (
            <button
              key={a.key}
              onClick={() => onNavigate(a.key)}
              className="m-press flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-container/60 border border-on-surface/5"
            >
              <span className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-on-primary-container">{a.icon}</span>
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {/* ── Overview KPIs ── */}
        <SectionTitle>Overview</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 m-rise m-rise-2">
          <Kpi icon="groups" label="Total students" value={st.total} />
          <Kpi icon="person" label="Active" value={st.active} tone="text-info" />
          <Kpi icon="workspace_premium" label="Graduated" value={st.graduated} tone="text-success" />
          <Kpi icon="account_tree" label="Departments" value={data.departmentsCount} />
          <Kpi icon="campaign" label="Drives" value={data.drivesCount} tone="text-primary" />
          <Kpi icon="apartment" label="Companies" value={data.companiesConnected} tone="text-info" />
          <Kpi icon="work_history" label="Internships" value={intern.totalApplications} tone="text-warning" />
          <Kpi icon="percent" label="Placement" value={`${pl.placementPercentage}%`} tone="text-success" />
          <Kpi icon="badge" label="Internship %" value={`${intern.internshipPercentage}%`} tone="text-warning" />
        </div>

        {/* ── Placement overview ── */}
        <SectionTitle action={<button onClick={() => onNavigate('analytics')} className="text-xs font-semibold text-primary">Details</button>}>
          Placement overview
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 m-rise m-rise-3">
          <Kpi icon="how_to_reg" label="Placed" value={pl.placed} tone="text-success" />
          <Kpi icon="travel_explore" label="Seeking" value={pl.seeking} tone="text-info" />
          <Kpi icon="pending_actions" label="Pending" value={pl.pending} tone="text-warning" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-2.5 m-rise m-rise-3">
          <Stat icon="trending_up" label="Highest package" value={pkg(pl.highestPackage)} />
          <Stat icon="payments" label="Average package" value={pkg(pl.averagePackage)} />
        </div>
        {pl.trend.length > 0 && (
          <Card className="mt-2.5">
            <p className="text-xs font-bold text-on-surface-variant mb-2">Placement trend</p>
            <div className="space-y-1.5">
              {pl.trend.map(t => {
                const max = Math.max(...pl.trend.map(x => x.placements), 1);
                return (
                  <div key={t.year} className="flex items-center gap-2 text-xs">
                    <span className="text-on-surface-variant w-10 shrink-0">{t.year}</span>
                    <div className="flex-1"><Progress value={(t.placements / max) * 100} tone="success" /></div>
                    <span className="font-bold w-6 text-right">{t.placements}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Internship overview ── */}
        <SectionTitle>Internship overview</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 m-rise m-rise-4">
          <Stat icon="pending_actions" label="Active internships" value={intern.active} />
          <Stat icon="event_upcoming" label="Upcoming" value={intern.upcoming} />
          <Stat icon="apartment" label="Companies offering" value={intern.companiesOffering} />
          <Stat icon="verified" label="Success rate" value={intern.successRate != null ? `${intern.successRate}%` : '—'} />
        </div>
        {!intern.completionTracked && (
          <p className="text-[10px] text-on-surface-variant mt-2 px-1">
            Completed internships aren't tracked — the schema has no internship end date. "Active" = accepted internship offers already started.
          </p>
        )}

        {/* ── Recent activity ── */}
        <SectionTitle>Recent activity</SectionTitle>
        {data.recentActivity.length === 0 ? (
          <Card><p className="text-sm text-on-surface-variant">No recent activity yet.</p></Card>
        ) : (
          <div className="space-y-2 m-rise m-rise-5">
            {data.recentActivity.map((a, i) => {
              const m = ACTIVITY_META[a.type];
              return (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3">
                  <span className={`material-symbols-outlined text-[18px] mt-0.5 ${m.tone}`}>{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-snug">{a.summary}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {new Date(a.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Upcoming drives ── */}
        <SectionTitle action={<button onClick={() => onNavigate('drives')} className="text-xs font-semibold text-primary">See all</button>}>
          Upcoming drives
        </SectionTitle>
        {data.upcomingDrives.length === 0 ? (
          <Card><p className="text-sm text-on-surface-variant">No upcoming campus drives.</p></Card>
        ) : (
          <div className="space-y-2.5">
            {data.upcomingDrives.map(d => (
              <Card key={d.id}>
                <p className="text-sm font-bold">{d.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {new Date(d.scheduledAt).toLocaleDateString()} · {d.location}
                </p>
              </Card>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </PullToRefresh>
  );
};

const StudentsView: React.FC<{ verifyMode?: boolean }> = ({ verifyMode }) => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync<UniversityStudent[]>(() => UniversityService.getStudents());
  if (loading) return <SkeletonList count={6} itemClass="h-16" />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  const rows = verifyMode ? data.filter(s => s.verificationStatus === 'PENDING') : data;
  if (rows.length === 0) return <EmptyState icon={verifyMode ? 'fact_check' : 'school'} title={verifyMode ? 'No pending verifications' : 'No students yet'} />;

  const verify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await UniversityService.verifyStudent(id, status);
      showToast(status === 'VERIFIED' ? 'Student verified' : 'Student rejected');
      await reload();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
  };

  return (
    <div className="px-4 pt-4 space-y-2.5">
      {rows.slice(0, 100).map(s => {
        // firstName/lastName/avatarUrl live on the StudentProfile, not on User
        // (User has only email/role) — reading s.user.firstName rendered
        // "undefined undefined" with placeholder avatars.
        const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.user.email;
        return (
          <Card key={s.id}>
            <div className="flex items-center gap-3">
              <Avatar src={s.avatarUrl} name={name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{name}</p>
                <p className="text-xs text-on-surface-variant truncate">{s.department?.name || s.user.email}</p>
              </div>
              <Chip tone={
                s.verificationStatus === 'VERIFIED' || s.verificationStatus === 'PLACEMENT_ELIGIBLE' ? 'success'
                : s.verificationStatus === 'PLACEMENT_COMPLETED' ? 'info'
                : s.verificationStatus === 'REJECTED' ? 'error' : 'warning'
              }>
                {s.verificationStatus.replace(/_/g, ' ')}
              </Chip>
            </div>
            {verifyMode && (
              <div className="flex gap-2 mt-3">
                <Button full variant="tonal" onClick={() => verify(s.id, 'VERIFIED')}>Verify</Button>
                <Button full variant="outline" onClick={() => verify(s.id, 'REJECTED')}>Reject</Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

const CompaniesView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<PartnerCompany[]>(() => UniversityService.getCompanies());
  if (loading) return <SkeletonList count={5} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  if (data.length === 0) return <EmptyState icon="apartment" title="No partner companies yet" />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(c => (
        <Card key={c.id}>
          <div className="flex items-center gap-3">
            <Avatar src={c.logoUrl} name={c.name} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{c.name}</p>
              <p className="text-xs text-on-surface-variant">{c.industry}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-success">{c.hired}</p>
              <p className="text-[10px] text-on-surface-variant">hired</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const MessagesView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync<SentBroadcast[]>(() => UniversityService.getSentBroadcasts());
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !content.trim()) return;
    setSending(true);
    try {
      const students = await UniversityService.getStudents();
      const ids = students.map(s => s.user.id);
      const res = await UniversityService.sendBroadcast(ids, title.trim(), content.trim());
      showToast(`Broadcast sent to ${res.recipientCount} students`);
      setComposeOpen(false); setTitle(''); setContent('');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Broadcast failed', 'error');
    } finally { setSending(false); }
  };

  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      <Button full icon="campaign" onClick={() => setComposeOpen(true)}>New broadcast to all students</Button>
      {data.length === 0 ? (
        <EmptyState icon="forum" title="No broadcasts sent yet" />
      ) : data.map((b, i) => (
        <Card key={i}>
          <p className="text-sm font-bold">{b.title}</p>
          <p className="text-xs text-on-surface-variant mt-1 line-clamp-3">{b.content}</p>
          <p className="text-[11px] text-on-surface-variant mt-2">
            {new Date(b.sentAt).toLocaleString()} · {b.recipientCount} recipients
          </p>
        </Card>
      ))}
      <Sheet open={composeOpen} onClose={() => setComposeOpen(false)} title="Broadcast message">
        <div className="space-y-3 pb-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" aria-label="Broadcast title" className="w-full h-12 px-4 rounded-xl bg-surface-container text-sm outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Message to all students…" aria-label="Broadcast message" rows={4} className="w-full p-4 rounded-xl bg-surface-container text-sm outline-none resize-none" />
          <Button full disabled={sending || !title.trim() || !content.trim()} onClick={send}>
            {sending ? 'Sending…' : 'Send broadcast'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
};

const HelpView: React.FC = () => {
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async () => {
    setSending(true);
    try {
      await UniversityService.submitSupportRequest(subject.trim(), message.trim());
      showToast('Support request submitted');
      setSubject(''); setMessage('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit', 'error');
    } finally { setSending(false); }
  };
  return (
    <div className="px-4 pt-4 space-y-3">
      <Card>
        <p className="text-sm font-bold mb-3">Contact CareerBridge support</p>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" className="w-full h-12 px-4 rounded-xl bg-surface-container text-sm outline-none mb-3" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue…" aria-label="Message" rows={5} className="w-full p-4 rounded-xl bg-surface-container text-sm outline-none resize-none mb-3" />
        <Button full disabled={sending || !subject.trim() || !message.trim()} onClick={submit}>
          {sending ? 'Submitting…' : 'Submit request'}
        </Button>
      </Card>
    </div>
  );
};

const MobileUniversityPortal: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState('dashboard');

  const render = () => {
    switch (view) {
      case 'students': return <StudentManagement />;
      case 'verification': return <StudentsView verifyMode />;
      case 'companies': return <CompaniesView />;
      case 'drives': return <PlacementManagement />;
      case 'internships': return <InternshipManagement />;
      case 'analytics':
      case 'reports': return <UniversityAnalytics />;
      case 'messages': return <MessagesView />;
      case 'help': return <HelpView />;
      default: return <OverviewView onNavigate={setView} />;
    }
  };

  const isDashboard = view === 'dashboard';
  return (
    <MobileShell
      // Dashboard renders its own full-bleed aurora hero (Phase 3 language),
      // so skip the sticky app bar for it; every other view keeps the header.
      bare={isDashboard}
      title={VIEW_TITLES[view] || 'University'}
      subtitle={isDashboard ? undefined : (user?.name || undefined)}
      role="university"
      activeKey={view}
      onNavigate={setView}
    >
      {render()}
    </MobileShell>
  );
};

export default MobileUniversityPortal;
