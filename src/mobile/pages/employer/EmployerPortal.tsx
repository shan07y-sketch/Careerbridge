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
import { MobileShell, Card, Stat, Chip, SectionTitle, SkeletonList, EmptyState, ErrorState, Button, Avatar, ScoreRing, PullToRefresh } from '../../components';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', jobs: 'Jobs', candidates: 'Candidates', pipeline: 'Talent Pipeline',
  analytics: 'Analytics', reports: 'Reports', recruiters: 'Recruiters', company: 'Company Profile',
  messages: 'Messages', interviews: 'Interviews',
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Candidate pipeline-status pill. Tone map covers the real Application status
 * vocabulary seen from the queue/analytics endpoints (APPLIED, INTERVIEWING,
 * SHORTLISTED, OFFERED, REJECTED, WITHDRAWN) plus a few synonyms for safety.
 */
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const tone =
    status === 'SHORTLISTED' || status === 'OFFERED' || status === 'OFFER' || status === 'HIRED' ? 'bg-success/15 text-success' :
    status === 'REJECTED' || status === 'WITHDRAWN' ? 'bg-error/15 text-error' :
    status === 'INTERVIEWING' || status === 'INTERVIEW' || status === 'REVIEWING' || status === 'SCREENING' ? 'bg-info/15 text-info' :
    'bg-on-surface/8 text-on-surface-variant';
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 capitalize ${tone}`}>{status.toLowerCase()}</span>;
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

/**
 * Premium employer home — aurora hero + real-data feed. Every value is a live
 * PostgreSQL aggregate: no placeholders, honest empty states per section.
 * Loads are resilient (allSettled) so one failing panel never blanks the page;
 * only a failed core dashboard call surfaces the error state.
 */
const OverviewView: React.FC<{ onNavigate: (k: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<EmployerDashboardStats | null>(null);
  const [company, setCompany] = useState<EmployerCompanyProfile | null>(null);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [applicants, setApplicants] = useState<PipelineApplication[]>([]);
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [s, c, j, q, iv, an] = await Promise.allSettled([
      EmployerOverviewService.getDashboard(),
      EmployerCompanyService.getProfile(),
      EmployerJobService.getJobs(),
      HiringPipelineService.getQueue({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
      EmployerOverviewService.getInterviews(),
      HiringPipelineService.getAnalytics(),
    ]);
    if (s.status === 'fulfilled') setStats(s.value);
    if (c.status === 'fulfilled') setCompany(c.value);
    if (j.status === 'fulfilled') setJobs(j.value);
    if (q.status === 'fulfilled') setApplicants(q.value.applications);
    if (iv.status === 'fulfilled') setInterviews(iv.value);
    if (an.status === 'fulfilled') setAnalytics(an.value);
    // The dashboard header stats are the one call the page can't render without.
    if (s.status === 'rejected') setError(s.reason instanceof Error ? s.reason.message : 'Request failed');
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-4 pt-4"><SkeletonList count={5} /></div>;
  if (error || !stats) return <ErrorState message={error || undefined} onRetry={() => { setLoading(true); load(); }} />;

  const now = Date.now();
  const upcoming = interviews
    .filter(i => i.status === 'SCHEDULED' && new Date(i.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const activeJobs = jobs.filter(j => j.status === 'PUBLISHED');
  const acceptance = analytics?.offerAcceptanceRate;
  const companyName = company?.name || 'Your company';
  // Guard against a known backend analytics quirk where time-to-hire can come
  // back negative (nonsensical) — treat anything non-positive as "no value"
  // rather than render "-5d". Tracked for the Module 5 analytics pass.
  const ttHire = analytics?.timeToHireDays != null && analytics.timeToHireDays > 0 ? analytics.timeToHireDays : null;

  const quickActions = [
    { icon: 'work', label: 'Jobs', key: 'jobs' },
    { icon: 'groups', label: 'Candidates', key: 'candidates' },
    { icon: 'videocam', label: 'Interviews', key: 'interviews' },
    { icon: 'monitoring', label: 'Analytics', key: 'analytics' },
  ];

  return (
    <PullToRefresh onRefresh={load}>
      {/* ---- Aurora hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-8 rounded-b-[28px]">
        <div className="flex items-center gap-3">
          <Avatar src={company?.logoUrl} name={companyName} size={44} />
          <div className="min-w-0">
            <p className="text-[13px] text-white/70 leading-none">{greeting()}</p>
            <p className="text-lg font-extrabold leading-tight truncate flex items-center gap-1">
              {companyName}
              {company?.isVerified && (
                <span className="material-symbols-outlined text-[18px] text-white/90" aria-label="Verified">verified</span>
              )}
            </p>
          </div>
        </div>

        {/* Live stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { v: stats.activeJobsCount, l: 'Active jobs' },
            { v: stats.totalApplications, l: 'Applications' },
            { v: stats.upcomingInterviewCount, l: 'Interviews' },
          ].map((x, idx) => (
            <div key={idx} className="rounded-2xl m-glass py-2.5 text-center">
              <p className="text-xl font-extrabold leading-none">{x.v}</p>
              <p className="text-[11px] text-white/70 mt-1">{x.l}</p>
            </div>
          ))}
        </div>

        {/* Offer-acceptance pulse — shown only when there is real acceptance data */}
        {acceptance != null && (
          <div className="mt-3 flex items-center gap-4 rounded-3xl m-glass p-4">
            <div className="shrink-0"><ScoreRing score={Math.round(acceptance)} size={64} label="accept" /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold">Offer acceptance</p>
              <p className="text-[13px] text-white/75 leading-snug">
                {stats.activeOfferCount} offer{stats.activeOfferCount === 1 ? '' : 's'} currently extended
                {ttHire != null ? ` · ~${ttHire}d to hire` : ''}.
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="px-4">
        {/* ---- Quick actions ---- */}
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

        {/* ---- Recent applicants ---- */}
        <SectionTitle action={<button onClick={() => onNavigate('candidates')} className="text-xs font-semibold text-primary">See all</button>}>
          Recent applicants
        </SectionTitle>
        {applicants.length === 0 ? (
          <Card><p className="text-sm text-on-surface-variant">No applications yet — candidates will appear here as they apply.</p></Card>
        ) : (
          <div className="space-y-2.5 m-rise m-rise-2">
            {applicants.slice(0, 4).map(app => {
              const s = app.studentProfile;
              const name = `${s.firstName} ${s.lastName}`.trim();
              return (
                <div
                  key={app.id}
                  onClick={() => onNavigate('candidates')}
                  className="m-card-lift flex items-center gap-3 rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3"
                >
                  <Avatar src={s.avatarUrl} name={name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{app.job.title}</p>
                  </div>
                  <StatusPill status={app.status} />
                </div>
              );
            })}
          </div>
        )}

        {/* ---- Active jobs ---- */}
        <SectionTitle action={<button onClick={() => onNavigate('jobs')} className="text-xs font-semibold text-primary">Manage</button>}>
          Active jobs
        </SectionTitle>
        {activeJobs.length === 0 ? (
          <Card><p className="text-sm text-on-surface-variant">No published jobs. Publish a role to start receiving applicants.</p></Card>
        ) : (
          <div className="space-y-2.5 m-rise m-rise-3">
            {activeJobs.slice(0, 4).map(j => {
              const count = j.applications?.length ?? 0;
              return (
                <div
                  key={j.id}
                  onClick={() => onNavigate('jobs')}
                  className="m-card-lift rounded-2xl bg-surface-container/70 border border-on-surface/5 p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold truncate">{j.title}</p>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-success/15 text-success shrink-0">{j.status}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">group</span>
                    {count} applicant{count === 1 ? '' : 's'}{j.location ? ` · ${j.location}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- Upcoming interviews ---- */}
        <SectionTitle action={<button onClick={() => onNavigate('interviews')} className="text-xs font-semibold text-primary">See all</button>}>
          Upcoming interviews
        </SectionTitle>
        {upcoming.length === 0 ? (
          <Card><p className="text-sm text-on-surface-variant">No interviews scheduled.</p></Card>
        ) : (
          <div className="space-y-2.5 m-rise m-rise-4">
            {upcoming.slice(0, 3).map(iv => {
              const s = iv.application.studentProfile;
              return (
                <div
                  key={iv.id}
                  onClick={() => onNavigate('interviews')}
                  className="m-card-lift rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">{s.firstName} {s.lastName}</p>
                    {iv.locationUrl && (
                      <a
                        href={iv.locationUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-bold text-primary shrink-0"
                      >
                        Join
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">{iv.title} · {iv.application.job.title}</p>
                  <p className="text-xs font-semibold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                    {new Date(iv.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {iv.duration}m
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- Pipeline snapshot (real analytics) ---- */}
        {analytics && (
          <>
            <SectionTitle action={<button onClick={() => onNavigate('analytics')} className="text-xs font-semibold text-primary">Details</button>}>
              Pipeline snapshot
            </SectionTitle>
            <div className="m-rise m-rise-5 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <Stat icon="timer" label="Time to hire" value={ttHire != null ? `${ttHire}d` : '—'} />
                <Stat icon="verified" label="Offer acceptance" value={analytics.offerAcceptanceRate != null ? `${Math.round(analytics.offerAcceptanceRate)}%` : '—'} />
              </div>
              {Object.keys(analytics.statusBreakdown).length > 0 && (
                <Card>
                  <p className="text-xs font-bold text-on-surface-variant mb-2">Candidates by stage</p>
                  <div className="space-y-1.5">
                    {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant capitalize">{status.toLowerCase()}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </PullToRefresh>
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

  const isDashboard = view === 'dashboard';
  return (
    <MobileShell
      // Dashboard renders its own full-bleed aurora hero (Phase 3 language),
      // so skip the sticky app bar for it; every other view keeps the header.
      bare={isDashboard}
      title={VIEW_TITLES[view] || 'Employer'}
      subtitle={isDashboard ? undefined : (user?.university || undefined)}
      role="employer"
      activeKey={view === 'candidates' ? 'candidates' : view}
      onNavigate={setView}
    >
      {render()}
    </MobileShell>
  );
};

export default MobileEmployerPortal;
