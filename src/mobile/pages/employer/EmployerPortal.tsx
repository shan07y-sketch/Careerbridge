/**
 * Mobile Employer Portal — one shell, key-based views (same navigation
 * vocabulary as the desktop portal). Data comes exclusively from the
 * shared employer services.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  EmployerOverviewService, EmployerJobService, HiringPipelineService,
  EmployerRecruiterService, EmployerCompanyService, EmployerMessageService,
} from '../../../services';
import type {
  EmployerDashboardStats, EmployerJob, PipelineApplication, PipelineAnalytics,
  EmployerRecruiter, EmployerCompanyProfile, EmployerInterview,
  EmployerConversation, EmployerConversationMessage,
} from '../../../services';
import { MobileShell, Card, Stat, Chip, SectionTitle, SkeletonList, EmptyState, ErrorState, Button, Avatar } from '../../components';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', jobs: 'Jobs', candidates: 'Candidates', pipeline: 'Talent Pipeline',
  analytics: 'Analytics', reports: 'Reports', recruiters: 'Recruiters', company: 'Company Profile',
  messages: 'Messages', interviews: 'Interviews',
};

/** Generic async view wrapper: loading / error / data. */
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

/* ── Views ─────────────────────────────────────────────────────────── */

const OverviewView: React.FC<{ onNavigate: (k: string) => void }> = ({ onNavigate }) => {
  const { data, loading, error, reload } = useAsync<EmployerDashboardStats>(() => EmployerOverviewService.getDashboard());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="work" label="Active jobs" value={data.activeJobsCount} />
        <Stat icon="group" label="Applications" value={data.totalApplications} />
        <Stat icon="event" label="Upcoming interviews" value={data.upcomingInterviewCount} />
        <Stat icon="handshake" label="Active offers" value={data.activeOfferCount} />
      </div>
      <SectionTitle action={<button onClick={() => onNavigate('jobs')} className="text-xs font-semibold text-primary">Manage</button>}>
        Your job postings
      </SectionTitle>
      {data.jobsList.length === 0 ? (
        <Card><p className="text-sm text-on-surface-variant">No jobs posted yet.</p></Card>
      ) : (
        <div className="space-y-2.5">
          {data.jobsList.slice(0, 5).map(j => (
            <Card key={j.id} onClick={() => onNavigate('jobs')}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold truncate">{j.title}</p>
                <Chip tone={j.status === 'PUBLISHED' ? 'success' : 'neutral'}>{j.status}</Chip>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const JobsView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<EmployerJob[]>(() => EmployerJobService.getJobs());
  if (loading) return <SkeletonList count={5} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  if (data.length === 0) return <EmptyState icon="work_off" title="No job postings" hint="Create jobs from the desktop portal." />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(job => (
        <Card key={job.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug">{job.title}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {job.location} · {job.applications?.length ?? 0} applicants
              </p>
            </div>
            <Chip tone={job.status === 'PUBLISHED' ? 'success' : job.status === 'CLOSED' ? 'error' : 'neutral'}>{job.status}</Chip>
          </div>
        </Card>
      ))}
    </div>
  );
};

const CandidatesView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => HiringPipelineService.getQueue({ limit: 50 }));
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); showToast(msg); await reload(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
  };
  if (loading) return <SkeletonList count={5} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  const apps: PipelineApplication[] = data.applications;
  if (apps.length === 0) return <EmptyState icon="group" title="No applications yet" hint="Candidates who apply to your jobs appear here." />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {apps.map(app => {
        const s = app.studentProfile;
        const name = `${s.firstName} ${s.lastName}`.trim();
        return (
          <Card key={app.id}>
            <div className="flex items-center gap-3">
              <Avatar src={s.avatarUrl} name={name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{name}</p>
                <p className="text-xs text-on-surface-variant truncate">{app.job.title}</p>
              </div>
              <Chip tone={app.status === 'SHORTLISTED' ? 'success' : app.status === 'REJECTED' ? 'error' : 'neutral'}>{app.status}</Chip>
            </div>
            {(app.status === 'APPLIED' || app.status === 'REVIEWING' || app.status === 'SCREENING') && (
              <div className="flex gap-2 mt-3">
                <Button full variant="tonal" onClick={() => act(() => HiringPipelineService.shortlist(app.id), 'Candidate shortlisted')}>Shortlist</Button>
                <Button full variant="outline" onClick={() => act(() => HiringPipelineService.reject(app.id), 'Candidate rejected')}>Reject</Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<PipelineAnalytics>(() => HiringPipelineService.getAnalytics());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="work" label="Active jobs" value={data.activeJobs} />
        <Stat icon="group" label="Total applications" value={data.totalApplications} />
        <Stat icon="timer" label="Time to hire" value={data.timeToHireDays != null ? `${data.timeToHireDays}d` : '—'} />
        <Stat icon="verified" label="Offer acceptance" value={data.offerAcceptanceRate != null ? `${Math.round(data.offerAcceptanceRate)}%` : '—'} />
      </div>
      <SectionTitle>Pipeline stages</SectionTitle>
      <Card>
        <div className="space-y-2">
          {Object.entries(data.statusBreakdown).map(([status, count]) => (
            <div key={status} className="flex justify-between text-sm">
              <span className="text-on-surface-variant">{status}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </Card>
      <SectionTitle>Per job</SectionTitle>
      <div className="space-y-2.5">
        {data.perJob.map(j => (
          <Card key={j.jobId}>
            <p className="text-sm font-bold">{j.jobTitle}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{j.totalApplications} applications</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const RecruitersView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<EmployerRecruiter[]>(() => EmployerRecruiterService.getRecruiters());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(r => {
        const name = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.user.email;
        return (
          <Card key={r.id}>
            <div className="flex items-center gap-3">
              <Avatar name={name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{name}</p>
                <p className="text-xs text-on-surface-variant truncate">{r.title} · {r.user.email}</p>
              </div>
              <span className="text-xs text-on-surface-variant shrink-0">{r._count.jobs} jobs</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const CompanyView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<EmployerCompanyProfile>(() => EmployerCompanyService.getProfile());
  if (loading) return <SkeletonList count={3} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar src={data.logoUrl} name={data.name} size={56} />
          <div className="min-w-0">
            <p className="text-base font-bold flex items-center gap-1">
              {data.name}
              {data.isVerified && <span className="material-symbols-outlined text-[18px] text-info" aria-label="Verified">verified</span>}
            </p>
            <p className="text-xs text-on-surface-variant">{data.industry}{data.headquarters ? ` · ${data.headquarters}` : ''}</p>
          </div>
        </div>
        {data.description && <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{data.description}</p>}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="fact_check" label="Screened this month" value={data.activity.screened} />
        <Stat icon="outgoing_mail" label="Outreach this month" value={data.activity.outreach} />
      </div>
      <p className="text-[11px] text-on-surface-variant text-center pt-2">Edit the full company profile from the desktop portal.</p>
    </div>
  );
};

const InterviewsView: React.FC = () => {
  const { data, loading, error, reload } = useAsync<EmployerInterview[]>(() => EmployerOverviewService.getInterviews());
  if (loading) return <SkeletonList count={4} />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;
  if (data.length === 0) return <EmptyState icon="videocam" title="No interviews scheduled" />;
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {data.map(iv => {
        const s = iv.application.studentProfile;
        return (
          <Card key={iv.id}>
            <p className="text-sm font-bold">{iv.title}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {s.firstName} {s.lastName} · {iv.application.job.title}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs font-semibold">{new Date(iv.scheduledAt).toLocaleString()} · {iv.duration}m</p>
              {iv.locationUrl && <a href={iv.locationUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary">Join</a>}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const MessagesView: React.FC = () => {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync<EmployerConversation[]>(() => EmployerMessageService.getConversations());
  const [active, setActive] = useState<EmployerConversation | null>(null);
  const [messages, setMessages] = useState<EmployerConversationMessage[]>([]);
  const [draft, setDraft] = useState('');

  const open = async (c: EmployerConversation) => {
    setActive(c);
    try { setMessages(await EmployerMessageService.getMessages(c.id)); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not load messages', 'error'); }
  };
  const send = async () => {
    if (!active || !draft.trim()) return;
    try {
      const m = await EmployerMessageService.sendMessage(active.id, draft.trim());
      setMessages(prev => [...prev, m]);
      setDraft('');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Not sent', 'error'); }
  };
  const nameOf = (c: EmployerConversation): string => {
    const student = c.participants.find(p => p.studentProfile)?.studentProfile;
    return student ? `${student.firstName} ${student.lastName}` : 'Conversation';
  };

  if (loading) return <SkeletonList count={5} itemClass="h-16" />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={reload} />;

  if (active) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 88px)' }}>
        <button onClick={() => setActive(null)} className="m-press flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> {nameOf(active)}
        </button>
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {messages.map(m => {
            const mine = !!m.senderRecruiterId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-primary text-on-primary' : 'bg-surface-container'}`}>
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 px-4 py-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message…" aria-label="Type a message" className="flex-1 h-11 px-4 rounded-full bg-surface-container text-sm outline-none" />
          <button onClick={send} disabled={!draft.trim()} aria-label="Send" className="m-press w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) return <EmptyState icon="forum" title="No conversations" hint="Start conversations with candidates from the pipeline." />;
  return (
    <div className="divide-y divide-on-surface/5 pt-2">
      {data.map(c => (
        <button key={c.id} onClick={() => open(c)} className="m-press w-full flex items-center gap-3 px-4 py-3 text-left">
          <Avatar name={nameOf(c)} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{nameOf(c)}</p>
            <p className="text-xs text-on-surface-variant truncate">{c.messages[0]?.content || 'No messages yet'}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

/* ── Shell ─────────────────────────────────────────────────────────── */

const MobileEmployerPortal: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState('dashboard');

  const render = () => {
    switch (view) {
      case 'jobs': return <JobsView />;
      case 'candidates':
      case 'pipeline': return <CandidatesView />;
      case 'analytics':
      case 'reports': return <AnalyticsView />;
      case 'recruiters': return <RecruitersView />;
      case 'company': return <CompanyView />;
      case 'messages': return <MessagesView />;
      case 'interviews': return <InterviewsView />;
      default: return <OverviewView onNavigate={setView} />;
    }
  };

  return (
    <MobileShell
      title={VIEW_TITLES[view] || 'Employer'}
      subtitle={user?.university || undefined}
      role="employer"
      activeKey={view === 'candidates' ? 'candidates' : view}
      onNavigate={setView}
    >
      {render()}
    </MobileShell>
  );
};

export default MobileEmployerPortal;
