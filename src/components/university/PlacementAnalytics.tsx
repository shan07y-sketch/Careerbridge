import React, { useCallback, useEffect, useState } from 'react';
import { UniversityService, type UniversityAnalytics } from '../../services';
import type { DepartmentInsight } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/Progress';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

const fmtCurrency = (v: number | null) => v == null ? '—' : `$${v.toLocaleString('en-US')}`;

export const PlacementAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<UniversityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<DepartmentInsight | null>(null);
  const [isInsightGenerating, setIsInsightGenerating] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const handleGenerateInsight = useCallback(async () => {
    setIsInsightGenerating(true); setInsightError(null);
    try { setInsight(await UniversityService.generateDepartmentInsight()); }
    catch (err: any) { setInsightError(err?.message || 'Failed to generate department insight.'); }
    finally { setIsInsightGenerating(false); }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setAnalytics(await UniversityService.getAnalytics()); }
    catch (err: any) { setError(err?.message || 'Failed to load placement analytics.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const header = <PageHeader title="Placement analytics" description="Placement performance, student outcomes and hiring trends — computed live from your data." />;
  if (isLoading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !analytics) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load analytics" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  const maxTrend = Math.max(1, ...analytics.hiringTrends.map(t => t.placements));

  return (
    <>
      {header}
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total students" value={analytics.totalStudents.toLocaleString()} icon="school" hint="registered" />
          <StatCard label="Students placed" value={analytics.studentsPlaced.toLocaleString()} icon="workspace_premium" hint="offers accepted" />
          <StatCard label="Placement rate" value={`${analytics.placementPercentage}%`} icon="trending_up" hint="of eligible" />
          <StatCard label="Highest package" value={fmtCurrency(analytics.highestPackage)} icon="payments" hint={`Avg ${fmtCurrency(analytics.averageSalary)}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Section title="Hiring trends" description="Accepted offers by year">
            <Card>
              {analytics.hiringTrends.length === 0 ? (
                <p className="text-label-md text-on-surface-variant">No accepted offers recorded yet.</p>
              ) : (
                <div className="flex items-end gap-4 h-48">
                  {analytics.hiringTrends.map(t => (
                    <div key={t.year} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-label-sm font-semibold text-on-surface mb-1">{t.placements}</span>
                      <div className="w-full bg-primary rounded-t-lg" style={{ height: `${Math.max(4, (t.placements / maxTrend) * 100)}%` }} />
                      <span className="text-label-sm text-on-surface-variant font-semibold mt-2">{t.year}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Section>

          <Section title="Department performance">
            <Card>
              {analytics.departmentBreakdown.length === 0 ? (
                <p className="text-label-md text-on-surface-variant">No placements recorded by department yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.departmentBreakdown.map(d => (
                    <div key={d.departmentId || 'unassigned'}>
                      <div className="flex justify-between text-label-md mb-1.5"><span className="font-semibold text-on-surface">{d.departmentName}</span><span className="text-on-surface-variant">{d.placementPercentage}% ({d.placed}/{d.total})</span></div>
                      <ProgressBar value={d.placementPercentage} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Section>
        </div>

        <Section title="Interview readiness" description="AI mock interview performance across departments — from the same stored reports students see">
          <Card>
            {analytics.interviewReadiness.totalInterviews === 0 ? (
              <p className="text-label-md text-on-surface-variant">No students have completed AI mock interviews yet.</p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-headline-md font-bold text-primary">{analytics.interviewReadiness.totalInterviews}</p>
                    <p className="text-label-sm text-on-surface-variant uppercase font-semibold">Interviews completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-headline-md font-bold text-primary">{analytics.interviewReadiness.averageScore ?? '—'}</p>
                    <p className="text-label-sm text-on-surface-variant uppercase font-semibold">Avg score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-headline-md font-bold text-primary">{analytics.interviewReadiness.averageReadiness ?? '—'}</p>
                    <p className="text-label-sm text-on-surface-variant uppercase font-semibold">Avg readiness</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {analytics.interviewReadiness.byDepartment.map(d => (
                    <div key={d.departmentId || 'unassigned'}>
                      <div className="flex justify-between text-label-md mb-1.5">
                        <span className="font-semibold text-on-surface">{d.departmentName}</span>
                        <span className="text-on-surface-variant">
                          {d.averageReadiness != null ? `${d.averageReadiness}/100 readiness` : 'no readiness data'} · {d.interviewsCompleted} interview{d.interviewsCompleted === 1 ? '' : 's'}
                        </span>
                      </div>
                      <ProgressBar value={d.averageReadiness ?? d.averageScore ?? 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Section>

        <Section title="AI department insight" description="An AI-written analysis of the real numbers above"
          action={<Button size="sm" variant="outline" onClick={handleGenerateInsight} disabled={isInsightGenerating} leftIcon={<span className="material-symbols-outlined text-[18px]">auto_awesome</span>}>{isInsightGenerating ? 'Generating…' : insight ? 'Regenerate' : 'Generate'}</Button>}>
          <Card>
            {insightError ? <p className="text-error font-semibold text-label-md">{insightError}</p>
            : !insight ? <p className="text-label-md text-on-surface-variant">Generate an AI analysis of department placement performance from the real analytics above.</p>
            : (
              <div className="space-y-4">
                <p className="text-body-md text-on-surface-variant">{insight.outlookSummary}</p>
                {insight.insights.length > 0 && (
                  <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Insights</p><ul className="space-y-1">{insight.insights.map((i, idx) => <li key={idx} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">insights</span>{i}</li>)}</ul></div>
                )}
                {insight.recommendations.length > 0 && (
                  <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Recommendations</p><ul className="space-y-1">{insight.recommendations.map((r, idx) => <li key={idx} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>{r}</li>)}</ul></div>
                )}
              </div>
            )}
          </Card>
        </Section>
      </div>
    </>
  );
};

export default PlacementAnalytics;
