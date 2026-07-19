/**
 * Mobile Employer Analytics (Phase 5 · Module 5) — a premium, real-data
 * recruitment-analytics screen matching the Student Portal quality bar.
 *
 * Every value on this screen is a live PostgreSQL aggregate from
 * `/employer/analytics` (HiringPipelineService.getAnalytics). Nothing is
 * mocked, estimated, or randomly generated. Where the database has no signal
 * (e.g. no completed hires, no recruiter attribution) the UI shows an honest
 * "—" / empty state rather than a fabricated number.
 *
 * Honesty notes carried from the backend:
 *  - The pipeline funnel is the CURRENT status distribution (a snapshot), not a
 *    cumulative reached-this-stage funnel — the app stores an application's
 *    current status only.
 *  - Conversion RATES use persistent Interview/Offer records, so "reached
 *    interview / offer" is cumulative and correct regardless of current status.
 *  - A "hire" == an ACCEPTED offer (there is no HIRED application status).
 *  - Trend indicators are intentionally omitted: there is no historical
 *    snapshot store yet, so any trend arrow would be fabricated.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { HiringPipelineService } from '../../../services';
import type { PipelineAnalytics } from '../../../services';
import {
  Card, Stat, SectionTitle, SkeletonList, EmptyState, ErrorState,
  ScoreRing, Progress, Segmented, Chip, PullToRefresh, Avatar,
} from '../../components';

/* ── Timeframe filter ─────────────────────────────────────────────── */

type Frame = 'all' | '7' | '30' | '90' | '365';
const FRAME_OPTIONS: { value: Frame; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '1y' },
];
const FRAME_LABEL: Record<Frame, string> = {
  all: 'All time', '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days', '365': 'Last year',
};

/* ── Formatting helpers ───────────────────────────────────────────── */

const pct = (v: number | null | undefined): string => (v == null ? '—' : `${Math.round(v)}%`);
const days = (v: number | null | undefined): string => (v == null ? '—' : `${v}d`);

/* ── Lightweight donut (inline SVG, no chart library) ─────────────── */

interface Segment { label: string; value: number; cls: string; }

const Donut: React.FC<{ segments: Segment[]; total: number; size?: number }> = ({ segments, total, size = 148 }) => {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Pipeline distribution">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="stroke-surface-container-high" />
        {total > 0 && segments.filter(s => s.value > 0).map((s, i) => {
          const dash = (s.value / total) * c;
          const el = (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="butt"
              className={s.cls} stroke="currentColor"
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc}
            />
          );
          acc += dash;
          return el;
        })}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-on-surface leading-none">{total}</span>
        <span className="text-[11px] text-on-surface-variant mt-1">candidates</span>
      </div>
    </div>
  );
};

/* ── KPI card (animated) ──────────────────────────────────────────── */

const Kpi: React.FC<{ icon: string; label: string; value: React.ReactNode; tone?: string }> = ({ icon, label, value, tone = 'text-primary' }) => (
  <div className="m-card p-3.5 flex flex-col gap-1.5">
    <span className={`material-symbols-outlined text-[20px] ${tone}`}>{icon}</span>
    <span className="text-2xl font-extrabold text-on-surface leading-none">{value}</span>
    <span className="text-[11px] text-on-surface-variant leading-tight">{label}</span>
  </div>
);

/* ── A labelled conversion ring ───────────────────────────────────── */

const RateRing: React.FC<{ value: number | null; label: string; hint: string }> = ({ value, label, hint }) => (
  <div className="m-card p-3 flex flex-col items-center text-center gap-1">
    {value == null ? (
      <div className="w-[76px] h-[76px] rounded-full border-4 border-surface-container-high flex items-center justify-center">
        <span className="text-lg font-bold text-on-surface-variant">—</span>
      </div>
    ) : (
      <ScoreRing score={value} size={76} />
    )}
    <span className="text-xs font-bold text-on-surface mt-1">{label}</span>
    <span className="text-[10px] text-on-surface-variant leading-tight">{hint}</span>
  </div>
);

/* ── CSV export (client-side serialisation of already-fetched real data) ── */

const buildCsv = (a: PipelineAnalytics, frame: Frame): string => {
  const rows: (string | number)[][] = [];
  const push = (section: string, metric: string, value: string | number | null) =>
    rows.push([section, metric, value == null ? '' : value]);

  push('Meta', 'Timeframe', FRAME_LABEL[frame]);
  push('Meta', 'Generated', new Date().toISOString());

  const js = a.jobStatusCounts;
  push('Jobs', 'Total', js.total); push('Jobs', 'Draft', js.draft); push('Jobs', 'Published', js.published);
  push('Jobs', 'Paused', js.paused); push('Jobs', 'Closed', js.closed); push('Jobs', 'Archived', js.archived);

  const t = a.totals;
  push('Candidates', 'Total applicants', t.totalApplicants); push('Candidates', 'New applicants', t.newApplicants);
  push('Candidates', 'Interviews scheduled', t.interviewsScheduled); push('Candidates', 'Offers sent', t.offersSent);
  push('Candidates', 'Offers accepted', t.offersAccepted); push('Candidates', 'Rejected', t.rejected);
  push('Candidates', 'Hires', t.hires);

  const m = a.metrics;
  push('Metrics', 'Avg time to hire (days)', m.timeToHireDays);
  push('Metrics', 'Fastest hire (days)', m.fastestHireDays);
  push('Metrics', 'Application conversion %', m.applicationConversionRate);
  push('Metrics', 'Interview conversion %', m.interviewConversionRate);
  push('Metrics', 'Offer acceptance %', m.offerAcceptanceRate);
  push('Metrics', 'Hire rate %', m.hireRate);
  push('Metrics', 'Drop-off rate %', m.dropOffRate);
  push('Metrics', 'Avg applicants per job', m.avgApplicantsPerJob);
  push('Metrics', 'Fill rate %', m.fillRate);
  push('Metrics', 'Jobs without applicants', m.jobsWithoutApplicants);
  push('Metrics', 'Jobs closing soon', m.jobsClosingSoon);

  const f = a.funnel;
  ([['Applied', f.applied], ['Reviewing', f.reviewing], ['Shortlisted', f.shortlisted],
    ['Interview', f.interview], ['Offer', f.offer], ['Hired', f.hired],
    ['Rejected', f.rejected], ['Withdrawn', f.withdrawn]] as [string, number][])
    .forEach(([k, v]) => push('Pipeline', k, v));

  a.perJob.forEach(j => rows.push([
    'Job', j.jobTitle,
    `applicants=${j.totalApplications};interviews=${j.interviewCount};offers=${j.offerCount};hires=${j.hireCount};daysOpen=${j.daysOpen};status=${j.status}`,
  ]));

  a.recruiterPerformance.forEach(r => rows.push([
    'Recruiter', r.name,
    `jobs=${r.jobsManaged};interviews=${r.interviewsConducted};offers=${r.offersMade};hires=${r.hires};avgTimeToHire=${r.avgTimeToHireDays ?? ''}`,
  ]));

  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [['Section', 'Metric', 'Value'], ...rows].map(r => r.map(esc).join(',')).join('\n');
};

/* ── Main screen ──────────────────────────────────────────────────── */

const EmployerAnalytics: React.FC = () => {
  const { showToast } = useToast();
  const [frame, setFrame] = useState<Frame>('all');
  const [data, setData] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: Frame) => {
    setError(null);
    try {
      setData(await HiringPipelineService.getAnalytics(f === 'all' ? undefined : { days: Number(f) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setLoading(true); load(frame); }, [frame, load]);

  const changeFrame = (f: Frame) => { if (f !== frame) { setFrame(f); } };

  const exportCsv = () => {
    if (!data) return;
    try {
      const blob = new Blob([buildCsv(data, frame)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CareerBridge-Analytics-${frame === 'all' ? 'all-time' : `${frame}d`}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Analytics exported as CSV', 'success');
    } catch {
      showToast('Could not export CSV', 'error');
    }
  };

  if (loading && !data) return <div className="pb-6"><SkeletonList count={6} /></div>;
  if (error && !data) return <ErrorState message={error || undefined} onRetry={() => { setLoading(true); load(frame); }} />;
  if (!data) return null;

  const { jobStatusCounts: js, totals: t, metrics: m, funnel: f, recruiterPerformance: recruiters, perJob } = data;

  // Pipeline funnel (current distribution). Percentages are of total applicants.
  const funnelStages = [
    { label: 'Applied', value: f.applied, cls: 'text-info', bar: 'primary' as const },
    { label: 'Shortlisted', value: f.shortlisted, cls: 'text-primary', bar: 'primary' as const },
    { label: 'Interview', value: f.interview, cls: 'text-warning', bar: 'warning' as const },
    { label: 'Offer', value: f.offer, cls: 'text-success', bar: 'success' as const },
    { label: 'Hired', value: f.hired, cls: 'text-success', bar: 'success' as const },
    { label: 'Rejected', value: f.rejected, cls: 'text-error', bar: 'error' as const },
  ];
  const funnelTotal = t.totalApplicants;

  // Job performance — real counts. Top = most applicants; attention = published
  // jobs with the fewest applicants (the roles that need a push).
  const rankable = perJob.filter(j => j.totalApplications > 0 || j.status === 'PUBLISHED');
  const topJobs = [...rankable].sort((a, b) => b.totalApplications - a.totalApplications).slice(0, 5);
  const attention = perJob
    .filter(j => j.status === 'PUBLISHED')
    .sort((a, b) => a.totalApplications - b.totalApplications)
    .slice(0, 3)
    .filter(j => !topJobs.some(tj => tj.jobId === j.jobId) || j.totalApplications === 0);
  const maxJobApps = Math.max(1, ...topJobs.map(j => j.totalApplications));

  return (
    <PullToRefresh onRefresh={() => load(frame)}>
      <div className="px-4 pt-4 pb-8">
        {/* ── Aurora hero ── */}
        <section className="m-hero rounded-[28px] px-5 py-5 m-rise m-rise-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] text-white/70 leading-none">Recruitment analytics</p>
              <p className="text-lg font-extrabold leading-tight mt-1">{FRAME_LABEL[frame]}</p>
            </div>
            <span className="material-symbols-outlined text-[26px] text-white/90">monitoring</span>
          </div>

          <div className="mt-4 flex items-center gap-4 rounded-3xl m-glass p-4">
            <div className="shrink-0">
              {m.offerAcceptanceRate == null
                ? <div className="w-16 h-16 rounded-full border-4 border-white/25 flex items-center justify-center text-white font-bold">—</div>
                : <ScoreRing score={m.offerAcceptanceRate} size={64} label="accept" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">{t.hires} hire{t.hires === 1 ? '' : 's'} · {t.offersSent} offer{t.offersSent === 1 ? '' : 's'} sent</p>
              <p className="text-[13px] text-white/75 leading-snug">
                {t.totalApplicants} applicant{t.totalApplicants === 1 ? '' : 's'} · {js.total} job{js.total === 1 ? '' : 's'} ({js.published} active).
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { v: t.totalApplicants, l: 'Applicants' },
              { v: t.interviewsScheduled, l: 'Interviews' },
              { v: t.hires, l: 'Hires' },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl m-glass py-2.5 text-center">
                <p className="text-xl font-extrabold leading-none">{x.v}</p>
                <p className="text-[11px] text-white/70 mt-1">{x.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeframe filter ── */}
        <div className="mt-4 m-rise m-rise-2">
          <Segmented options={FRAME_OPTIONS} value={frame} onChange={changeFrame} />
        </div>

        {/* ── Export ── */}
        <div className="mt-3 flex gap-2 m-rise m-rise-2">
          <button onClick={exportCsv} className="m-press flex-1 h-11 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[19px]">download</span> Export CSV
          </button>
          <button
            disabled
            title="PDF export isn't available yet — the backend has no analytics PDF endpoint."
            className="h-11 px-4 rounded-full border border-on-surface/15 text-on-surface-variant text-sm font-semibold inline-flex items-center justify-center gap-2 opacity-50"
          >
            <span className="material-symbols-outlined text-[19px]">picture_as_pdf</span> PDF
          </button>
        </div>
        {loading && <p className="text-[11px] text-on-surface-variant text-center mt-2">Updating…</p>}

        {/* ── Jobs overview ── */}
        <SectionTitle>Jobs</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 m-rise m-rise-3">
          <Kpi icon="work" label="Total jobs" value={js.total} />
          <Kpi icon="rocket_launch" label="Active" value={js.published} tone="text-success" />
          <Kpi icon="edit_note" label="Draft" value={js.draft} tone="text-on-surface-variant" />
          <Kpi icon="pause_circle" label="Paused" value={js.paused} tone="text-warning" />
          <Kpi icon="lock" label="Closed" value={js.closed} tone="text-on-surface-variant" />
          <Kpi icon="inventory_2" label="Archived" value={js.archived} tone="text-on-surface-variant" />
        </div>

        {/* ── Candidates overview ── */}
        <SectionTitle>Candidates</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 m-rise m-rise-3">
          <Kpi icon="group" label="Applicants" value={t.totalApplicants} />
          <Kpi icon="fiber_new" label="New" value={t.newApplicants} tone="text-info" />
          <Kpi icon="videocam" label="Interviews" value={t.interviewsScheduled} tone="text-warning" />
          <Kpi icon="mail" label="Offers sent" value={t.offersSent} tone="text-primary" />
          <Kpi icon="task_alt" label="Accepted" value={t.offersAccepted} tone="text-success" />
          <Kpi icon="do_not_disturb_on" label="Rejected" value={t.rejected} tone="text-error" />
        </div>

        {/* ── Pipeline distribution ── */}
        <SectionTitle>Pipeline</SectionTitle>
        {funnelTotal === 0 ? (
          <EmptyState icon="filter_alt" title="No candidates in this window" hint="Applications received in the selected timeframe will populate the pipeline." />
        ) : (
          <Card className="m-rise m-rise-4">
            <div className="flex items-center gap-4">
              <Donut total={funnelTotal} segments={funnelStages.filter(s => s.label !== 'Hired')} />
              <div className="flex-1 min-w-0 space-y-1.5">
                {funnelStages.filter(s => s.label !== 'Hired').map(s => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <span className={`material-symbols-outlined text-[10px] ${s.cls}`}>circle</span>
                    <span className="text-on-surface-variant flex-1 truncate">{s.label}</span>
                    <span className="font-bold text-on-surface">{s.value}</span>
                    <span className="text-on-surface-variant w-9 text-right">{funnelTotal ? Math.round((s.value / funnelTotal) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {funnelStages.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-on-surface">{s.label}</span>
                    <span className="text-on-surface-variant">{s.value} · {funnelTotal ? Math.round((s.value / funnelTotal) * 100) : 0}%</span>
                  </div>
                  <Progress value={funnelTotal ? (s.value / funnelTotal) * 100 : 0} tone={s.bar} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3 leading-snug">
              Current stage distribution. "Hired" counts accepted offers and can overlap the offer stage.
            </p>
          </Card>
        )}

        {/* ── Recruitment metrics ── */}
        <SectionTitle>Recruitment metrics</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5 m-rise m-rise-4">
          <RateRing value={m.applicationConversionRate} label="App → Interview" hint="reached interview" />
          <RateRing value={m.interviewConversionRate} label="Interview → Offer" hint="reached offer" />
          <RateRing value={m.offerAcceptanceRate} label="Offer accept" hint="accepted / responded" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-2.5 m-rise m-rise-5">
          <Stat icon="timer" label={`Avg time to hire${m.hireSampleSize ? ` (n=${m.hireSampleSize})` : ''}`} value={days(m.timeToHireDays)} />
          <Stat icon="bolt" label="Fastest hire" value={days(m.fastestHireDays)} />
          <Stat icon="trending_up" label="Hire rate" value={pct(m.hireRate)} />
          <Stat icon="logout" label="Drop-off rate" value={pct(m.dropOffRate)} />
          <Stat icon="groups" label="Avg applicants / job" value={m.avgApplicantsPerJob ?? '—'} />
          <Stat icon="check_circle" label="Fill rate" value={pct(m.fillRate)} />
        </div>
        {(m.jobsWithoutApplicants > 0 || m.jobsClosingSoon > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {m.jobsWithoutApplicants > 0 && (
              <Chip tone="warning">{m.jobsWithoutApplicants} job{m.jobsWithoutApplicants === 1 ? '' : 's'} without applicants</Chip>
            )}
            {m.jobsClosingSoon > 0 && (
              <Chip tone="error">{m.jobsClosingSoon} closing soon</Chip>
            )}
          </div>
        )}

        {/* ── Job performance ── */}
        <SectionTitle>Top performing jobs</SectionTitle>
        {topJobs.length === 0 ? (
          <EmptyState icon="work_off" title="No job activity yet" hint="Published roles with applicants will be ranked here." />
        ) : (
          <div className="space-y-2.5 m-rise m-rise-5">
            {topJobs.map(j => (
              <Card key={j.jobId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{j.jobTitle}</p>
                    {j.status !== 'PUBLISHED' && (
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide mt-0.5">{j.status.toLowerCase()}</p>
                    )}
                  </div>
                  {j.hireCount > 0 && <Chip tone="success">Filled</Chip>}
                </div>
                <div className="mt-2">
                  <Progress value={(j.totalApplications / maxJobApps) * 100} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[11px] text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{j.totalApplications} applicants</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">videocam</span>{j.interviewCount} interviews</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span>{j.offerCount} offers</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">how_to_reg</span>{j.hireCount} hires</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{j.daysOpen}d open</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {attention.length > 0 && (
          <>
            <SectionTitle>Needs attention</SectionTitle>
            <div className="space-y-2.5">
              {attention.map(j => (
                <Card key={j.jobId}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-on-surface flex-1 min-w-0 truncate">{j.jobTitle}</p>
                    <Chip tone={j.totalApplications === 0 ? 'error' : 'warning'}>
                      {j.totalApplications} applicant{j.totalApplications === 1 ? '' : 's'}
                    </Chip>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Open {j.daysOpen}d{j.totalApplications === 0 ? ' · consider promoting or revising this role' : ''}
                  </p>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ── Recruiter performance ── */}
        <SectionTitle>Recruiter performance</SectionTitle>
        {recruiters.length === 0 ? (
          <EmptyState icon="badge" title="No recruiter activity" hint="Once team members own jobs, run interviews, or extend offers, their performance appears here." />
        ) : (
          <div className="space-y-2.5">
            {recruiters
              .slice()
              .sort((a, b) => b.hires - a.hires || b.offersMade - a.offersMade || b.jobsManaged - a.jobsManaged)
              .map(r => (
                <Card key={r.recruiterId}>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{r.name}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {r.jobsManaged} job{r.jobsManaged === 1 ? '' : 's'} · avg hire {days(r.avgTimeToHireDays)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="rounded-xl bg-surface-container/60 py-2">
                      <p className="text-base font-extrabold text-on-surface leading-none">{r.interviewsConducted}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">Interviews</p>
                    </div>
                    <div className="rounded-xl bg-surface-container/60 py-2">
                      <p className="text-base font-extrabold text-on-surface leading-none">{r.offersMade}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">Offers</p>
                    </div>
                    <div className="rounded-xl bg-surface-container/60 py-2">
                      <p className="text-base font-extrabold text-on-surface leading-none">{r.hires}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">Hires</p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default EmployerAnalytics;
