/**
 * Mobile University Analytics (Phase 6 · Module 5).
 *
 * A premium analytics surface over EXISTING endpoints only — every number is a
 * real PostgreSQL aggregate, nothing is fabricated:
 *   - GET  /university/analytics              (placement %, packages, hiring
 *          trend, department breakdown, mock-interview readiness)
 *   - GET  /university/internships            (internship analytics)
 *   - GET  /university/companies              (recruiter analytics)
 *   - GET  /university/students               (student skill analytics)
 *   - POST /university/analytics/ai-insight   (real Gemini department insight)
 *
 * CSV export serialises already-fetched real data client-side. PDF export is
 * intentionally NOT offered: the backend has no PDF report endpoint (the AI
 * report returns structured JSON, not a document), so faking one would violate
 * the "only enable PDF if the backend supports it" rule.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { UniversityService } from '../../../services';
import type { UniversityAnalytics as Analytics, UniversityInternship, PartnerCompany, UniversityStudent } from '../../../services';
import type { DepartmentInsight } from '../../../types';
import { exportUniversityPlacementReportCSV } from '../../../utils/exportUtils';
import {
  Card, Chip, Avatar, Button, Segmented, SectionTitle, Progress,
  SkeletonList, EmptyState, ErrorState, PullToRefresh,
} from '../../components';

type Tab = 'placement' | 'departments' | 'skills' | 'recruiters';

const money = (v: number | null | undefined): string =>
  v == null ? '—' : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;

/* ── Tiny CSS bar chart ───────────────────────────────────────────────── */

const BarChart: React.FC<{ data: { label: string; value: number }[]; tone?: string }> = ({ data, tone = 'bg-primary' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[11px] font-bold text-on-surface">{d.value}</span>
          <div className="w-full rounded-t-lg bg-surface-container-high relative flex items-end" style={{ height: '100%' }}>
            <div className={`w-full rounded-t-lg ${tone} transition-all duration-500`} style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="text-[10px] text-on-surface-variant truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI card ─────────────────────────────────────────────────────────── */

const Kpi: React.FC<{ icon: string; label: string; value: React.ReactNode; tone?: string }> = ({ icon, label, value, tone = 'text-primary' }) => (
  <div className="m-card p-3.5 flex flex-col gap-1">
    <span className={`material-symbols-outlined text-[20px] ${tone}`}>{icon}</span>
    <span className="text-2xl font-extrabold text-on-surface leading-none">{value}</span>
    <span className="text-[11px] text-on-surface-variant leading-tight">{label}</span>
  </div>
);

/* ── Screen ───────────────────────────────────────────────────────────── */

const UniversityAnalytics: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('placement');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [internships, setInternships] = useState<UniversityInternship[]>([]);
  const [companies, setCompanies] = useState<PartnerCompany[]>([]);
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<DepartmentInsight | null>(null);
  const [insightBusy, setInsightBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [a, i, c, s] = await Promise.allSettled([
      UniversityService.getAnalytics(),
      UniversityService.getInternships(),
      UniversityService.getCompanies(),
      UniversityService.getStudents(),
    ]);
    if (a.status === 'fulfilled') setAnalytics(a.value); else setError(a.reason instanceof Error ? a.reason.message : 'Could not load analytics.');
    if (i.status === 'fulfilled') setInternships(i.value);
    if (c.status === 'fulfilled') setCompanies(c.value);
    if (s.status === 'fulfilled') setStudents(s.value);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const runInsight = async () => {
    setInsightBusy(true);
    try { setInsight(await UniversityService.generateDepartmentInsight()); showToast('AI insight generated'); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not generate insight', 'error'); }
    finally { setInsightBusy(false); }
  };

  // ── Internship analytics (real, derived from applications) ──
  const internStats = useMemo(() => {
    const accepted = internships.filter(i => i.offer?.status === 'ACCEPTED');
    const companiesOffering = new Set(internships.map(i => i.job.company.id)).size;
    const successRate = internships.length > 0 ? Math.round((accepted.length / internships.length) * 100) : null;
    return { total: internships.length, accepted: accepted.length, companiesOffering, successRate };
  }, [internships]);

  // ── Student skill analytics (aggregate real skills across students) ──
  const topSkills = useMemo(() => {
    const c = new Map<string, number>();
    for (const s of students) {
      const skills: { skill?: { name?: string } }[] = s.skills || [];
      for (const sk of skills) { const n = sk.skill?.name; if (n) c.set(n, (c.get(n) ?? 0) + 1); }
    }
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([label, value]) => ({ label, value }));
  }, [students]);

  const exportCsv = () => {
    if (!analytics) return;
    exportUniversityPlacementReportCSV({
      totalStudents: analytics.totalStudents,
      studentsPlaced: analytics.studentsPlaced,
      placementPercentage: analytics.placementPercentage,
      averageSalary: analytics.averageSalary,
      highestPackage: analytics.highestPackage,
      hiringTrends: analytics.hiringTrends,
      departmentBreakdown: analytics.departmentBreakdown,
    });
    showToast('Analytics exported as CSV');
  };

  if (loading) return <SkeletonList count={6} />;
  if (error || !analytics) return <ErrorState message={error || undefined} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <PullToRefresh onRefresh={load}>
      <div className="px-4 pt-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'placement', label: 'Placement' },
            { value: 'departments', label: 'Depts' },
            { value: 'skills', label: 'Skills' },
            { value: 'recruiters', label: 'Recruiters' },
          ]}
        />
      </div>

      <div className="px-4 pt-3 flex gap-2">
        <Button full variant="tonal" icon="auto_awesome" disabled={insightBusy} onClick={runInsight}>{insightBusy ? 'Analyzing…' : 'AI insight'}</Button>
        <Button full variant="outline" icon="download" onClick={exportCsv}>Export CSV</Button>
      </div>

      {insight && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5 space-y-2">
            <p className="text-sm font-bold flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span> Department outlook</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{insight.outlookSummary}</p>
            {insight.insights.length > 0 && insight.insights.map((x, i) => (
              <p key={i} className="text-xs text-on-surface-variant flex gap-1.5"><span className="material-symbols-outlined text-[15px] text-info mt-0.5">insights</span>{x}</p>
            ))}
            {insight.recommendations.length > 0 && insight.recommendations.map((x, i) => (
              <p key={i} className="text-xs text-on-surface-variant flex gap-1.5"><span className="material-symbols-outlined text-[15px] text-success mt-0.5">check_circle</span>{x}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Placement tab ── */}
      {tab === 'placement' && (
        <div className="px-4 pt-1">
          <SectionTitle>KPIs</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <Kpi icon="percent" label="Placement rate" value={`${analytics.placementPercentage}%`} tone="text-success" />
            <Kpi icon="workspace_premium" label="Placed" value={`${analytics.studentsPlaced}/${analytics.totalStudents}`} tone="text-primary" />
            <Kpi icon="payments" label="Average package" value={money(analytics.averageSalary)} tone="text-info" />
            <Kpi icon="trending_up" label="Highest package" value={money(analytics.highestPackage)} tone="text-warning" />
            <Kpi icon="record_voice_over" label="Mock interviews" value={analytics.interviewReadiness.totalInterviews} tone="text-primary" />
            <Kpi icon="verified" label="Avg readiness" value={analytics.interviewReadiness.averageReadiness != null ? `${analytics.interviewReadiness.averageReadiness}%` : '—'} tone="text-success" />
          </div>

          <SectionTitle>Hiring trend</SectionTitle>
          {analytics.hiringTrends.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">No placements recorded yet.</p></Card>
          ) : (
            <Card><BarChart data={analytics.hiringTrends.map(t => ({ label: t.year, value: t.placements }))} tone="bg-success" /></Card>
          )}

          {/* Internship analytics */}
          <SectionTitle>Internship analytics</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <Kpi icon="work_history" label="Internships" value={internStats.total} tone="text-primary" />
            <Kpi icon="task_alt" label="Accepted" value={internStats.accepted} tone="text-success" />
            <Kpi icon="apartment" label="Companies" value={internStats.companiesOffering} tone="text-info" />
            <Kpi icon="verified" label="Success rate" value={internStats.successRate != null ? `${internStats.successRate}%` : '—'} tone="text-warning" />
          </div>
          <div className="h-4" />
        </div>
      )}

      {/* ── Departments tab ── */}
      {tab === 'departments' && (
        <div className="px-4 pt-1">
          <SectionTitle>Placement by department</SectionTitle>
          {analytics.departmentBreakdown.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">No department data yet.</p></Card>
          ) : (
            <div className="space-y-2.5">
              {[...analytics.departmentBreakdown].sort((a, b) => b.placementPercentage - a.placementPercentage).map(d => (
                <Card key={d.departmentId ?? d.departmentName}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold truncate">{d.departmentName}</span>
                    <span className="font-bold ml-2 shrink-0">{d.placementPercentage}%</span>
                  </div>
                  <Progress value={d.placementPercentage} tone={d.placementPercentage >= 70 ? 'success' : d.placementPercentage >= 40 ? 'warning' : 'error'} />
                  <p className="text-[11px] text-on-surface-variant mt-1">{d.placed} of {d.total} placed</p>
                </Card>
              ))}
            </div>
          )}

          <SectionTitle>Interview readiness by department</SectionTitle>
          {analytics.interviewReadiness.byDepartment.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">No mock interviews completed yet.</p></Card>
          ) : (
            <div className="space-y-2.5">
              {analytics.interviewReadiness.byDepartment.map(d => (
                <Card key={d.departmentId ?? d.departmentName}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{d.departmentName}</span>
                    <Chip tone="info">{d.interviewsCompleted} interview{d.interviewsCompleted === 1 ? '' : 's'}</Chip>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-on-surface-variant">
                    <span>Avg score <span className="font-bold text-on-surface">{d.averageScore ?? '—'}</span></span>
                    <span>Readiness <span className="font-bold text-on-surface">{d.averageReadiness != null ? `${d.averageReadiness}%` : '—'}</span></span>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="h-4" />
        </div>
      )}

      {/* ── Skills tab ── */}
      {tab === 'skills' && (
        <div className="px-4 pt-1">
          <SectionTitle>Top student skills</SectionTitle>
          {topSkills.length === 0 ? (
            <EmptyState icon="psychology" title="No skills recorded" hint="Student skill profiles appear here as they're added." />
          ) : (
            <div className="space-y-2">
              {topSkills.map((s, i) => {
                const max = topSkills[0].value || 1;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs w-28 truncate text-on-surface">{s.label}</span>
                    <div className="flex-1"><Progress value={(s.value / max) * 100} tone="primary" /></div>
                    <span className="text-xs font-bold w-6 text-right">{s.value}</span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-on-surface-variant mt-3 px-1">Counts show how many students list each skill — aggregated live from student profiles.</p>
          <div className="h-4" />
        </div>
      )}

      {/* ── Recruiters tab ── */}
      {tab === 'recruiters' && (
        <div className="px-4 pt-1">
          <SectionTitle>Top recruiters</SectionTitle>
          {companies.length === 0 ? (
            <EmptyState icon="apartment" title="No recruiter activity yet" hint="Companies your students apply to appear here." />
          ) : (
            <div className="space-y-2.5">
              {[...companies].sort((a, b) => b.hired - a.hired || b.applications - a.applications).map(c => (
                <div key={c.id} className="m-card p-3.5 flex items-center gap-3">
                  <Avatar src={c.logoUrl} name={c.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{c.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{c.industry} · {c.openJobs} open role{c.openJobs === 1 ? '' : 's'}</p>
                  </div>
                  <div className="flex gap-3 text-right shrink-0">
                    <div><p className="text-base font-extrabold leading-none">{c.applications}</p><p className="text-[10px] text-on-surface-variant">apps</p></div>
                    <div><p className="text-base font-extrabold text-success leading-none">{c.hired}</p><p className="text-[10px] text-on-surface-variant">hired</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="h-4" />
        </div>
      )}
    </PullToRefresh>
  );
};

export default UniversityAnalytics;
