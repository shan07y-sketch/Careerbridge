/**
 * Mobile University Portal — one shell, key-based views, shared services only.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { UniversityService } from '../../../services';
import type {
  UniversityDashboard, UniversityStudent, UniversityAnalytics,
  PlacementDrive, PartnerCompany, SentBroadcast,
} from '../../../services';
import { MobileShell, Card, Stat, Chip, SectionTitle, SkeletonList, EmptyState, ErrorState, Button, Sheet, Avatar, Progress } from '../../components';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', students: 'Students', companies: 'Companies', drives: 'Campus Drives',
  analytics: 'Placement Analytics', reports: 'Reports', messages: 'Messages',
  verification: 'Verification', help: 'Help & Support',
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
  const { data, loading, error, reload } = useAsync<UniversityDashboard>(() => UniversityService.getDashboard());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="school" label="Total students" value={data.totalStudents} />
        <Stat icon="workspace_premium" label="Students placed" value={data.studentsPlaced} />
        <Stat icon="percent" label="Placement rate" value={`${Math.round(data.placementRate)}%`} />
        <Stat icon="pending_actions" label="Pending verifications" value={data.pendingVerificationsCount} />
      </div>
      <SectionTitle>Upcoming drives</SectionTitle>
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
    </div>
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
        const name = `${s.user.firstName} ${s.user.lastName}`.trim() || s.user.email;
        return (
          <Card key={s.id}>
            <div className="flex items-center gap-3">
              <Avatar src={s.user.avatarUrl} name={name} size={40} />
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

const DrivesView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<PlacementDrive[]>(() => UniversityService.getDrives());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  if (data.length === 0) return <EmptyState icon="campaign" title="No campus drives" hint="Create drives from the desktop portal." />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(d => (
        <Card key={d.id}>
          <p className="text-sm font-bold">{d.title}</p>
          <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{d.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">event</span>
            {new Date(d.scheduledAt).toLocaleDateString()}
            <span className="material-symbols-outlined text-[16px] ml-2">location_on</span>
            {d.location}
          </div>
        </Card>
      ))}
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<UniversityAnalytics>(() => UniversityService.getAnalytics());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="percent" label="Placement rate" value={`${Math.round(data.placementPercentage)}%`} />
        <Stat icon="workspace_premium" label="Placed" value={`${data.studentsPlaced}/${data.totalStudents}`} />
        <Stat icon="payments" label="Average package" value={data.averageSalary != null ? `${Math.round(data.averageSalary / 1000)}k` : '—'} />
        <Stat icon="trending_up" label="Highest package" value={data.highestPackage != null ? `${Math.round(data.highestPackage / 1000)}k` : '—'} />
      </div>

      <SectionTitle>Department breakdown</SectionTitle>
      <div className="space-y-2.5">
        {data.departmentBreakdown.map(d => (
          <Card key={d.departmentId ?? d.departmentName}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold">{d.departmentName}</span>
              <span className="font-bold">{Math.round(d.placementPercentage)}%</span>
            </div>
            <Progress value={d.placementPercentage} tone={d.placementPercentage >= 70 ? 'success' : 'warning'} />
            <p className="text-[11px] text-on-surface-variant mt-1">{d.placed} of {d.total} placed</p>
          </Card>
        ))}
      </div>

      <SectionTitle>Interview readiness</SectionTitle>
      <Card>
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Mock interviews completed</span>
          <span className="font-bold">{data.interviewReadiness.totalInterviews}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-on-surface-variant">Average score</span>
          <span className="font-bold">{data.interviewReadiness.averageScore != null ? Math.round(data.interviewReadiness.averageScore) : '—'}</span>
        </div>
      </Card>
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
      case 'students': return <StudentsView />;
      case 'verification': return <StudentsView verifyMode />;
      case 'companies': return <CompaniesView />;
      case 'drives': return <DrivesView />;
      case 'analytics':
      case 'reports': return <AnalyticsView />;
      case 'messages': return <MessagesView />;
      case 'help': return <HelpView />;
      default: return <OverviewView />;
    }
  };

  return (
    <MobileShell
      title={VIEW_TITLES[view] || 'University'}
      subtitle={user?.name || undefined}
      role="university"
      activeKey={view}
      onNavigate={setView}
    >
      {render()}
    </MobileShell>
  );
};

export default MobileUniversityPortal;
