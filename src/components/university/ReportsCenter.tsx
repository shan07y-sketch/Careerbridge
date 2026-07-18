import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type UniversityAnalytics, type UniversityDashboard } from '../../services';
import type { PlacementReport } from '../../types';
import { exportUniversityPlacementReportCSV } from '../../utils/exportUtils';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

export const ReportsCenter: React.FC = () => {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<UniversityAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<UniversityDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<PlacementReport | null>(null);
  const [isAiReportGenerating, setIsAiReportGenerating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [a, d] = await Promise.all([UniversityService.getAnalytics(), UniversityService.getDashboard()]);
      setAnalytics(a); setDashboard(d);
    } catch (err: any) { setError(err?.message || 'Failed to load report data.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleGenerate = () => {
    if (!analytics || !dashboard) return;
    setIsGenerating(true);
    try {
      exportUniversityPlacementReportCSV({
        totalStudents: analytics.totalStudents, studentsPlaced: analytics.studentsPlaced, placementPercentage: analytics.placementPercentage,
        pendingVerifications: dashboard.pendingVerificationsCount, activeDrives: dashboard.upcomingDrives.length,
        averageSalary: analytics.averageSalary, highestPackage: analytics.highestPackage,
        hiringTrends: analytics.hiringTrends, departmentBreakdown: analytics.departmentBreakdown,
      });
      showToast('Placement report downloaded (summary, department breakdown, hiring trends).', 'success');
    } catch (err: any) { showToast(err?.message || 'Failed to generate report.', 'error'); }
    finally { setIsGenerating(false); }
  };

  const handleGenerateAIReport = async () => {
    setIsAiReportGenerating(true);
    try { setAiReport(await UniversityService.generatePlacementReport()); }
    catch (err: any) { showToast(err?.message || 'Failed to generate AI placement report.', 'error'); }
    finally { setIsAiReportGenerating(false); }
  };

  const header = (
    <PageHeader title="Reports" description="Real, data-backed placement reports from your university's live analytics."
      actions={<Button variant="primary" onClick={handleGenerate} disabled={isLoading || isGenerating || !analytics} isLoading={isGenerating} leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>Download report</Button>} />
  );
  if (isLoading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !analytics || !dashboard) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load report data" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  const th = 'text-left px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant';

  return (
    <>
      {header}
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total students" value={analytics.totalStudents.toLocaleString()} icon="school" hint="registered" />
          <StatCard label="Students placed" value={analytics.studentsPlaced.toLocaleString()} icon="workspace_premium" hint="offers accepted" />
          <StatCard label="Placement rate" value={`${analytics.placementPercentage}%`} icon="trending_up" hint="of eligible" />
          <StatCard label="Pending verifications" value={dashboard.pendingVerificationsCount} icon="pending_actions" hint="need review" />
        </div>

        <Section title="By department" description="Included in the downloadable report">
          {analytics.departmentBreakdown.length === 0 ? (
            <Card><p className="text-label-md text-on-surface-variant">No department placement data yet.</p></Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-body-md">
                <thead className="border-b border-outline-variant/60"><tr><th className={th}>Department</th><th className={th}>Placed</th><th className={th}>Total</th><th className={th}>Rate</th></tr></thead>
                <tbody>{analytics.departmentBreakdown.map(d => (
                  <tr key={d.departmentId || 'unassigned'} className="border-t border-outline-variant/60"><td className="px-5 py-3 font-semibold text-on-surface">{d.departmentName}</td><td className="px-5 py-3 text-on-surface">{d.placed}</td><td className="px-5 py-3 text-on-surface">{d.total}</td><td className="px-5 py-3 text-on-surface">{d.placementPercentage}%</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </Section>

        <Section title="AI executive placement report" description="A narrative summary written from the real analytics above"
          action={<Button size="sm" variant="outline" onClick={handleGenerateAIReport} disabled={isAiReportGenerating} leftIcon={<span className="material-symbols-outlined text-[18px]">auto_awesome</span>}>{isAiReportGenerating ? 'Generating…' : aiReport ? 'Regenerate' : 'Generate'}</Button>}>
          <Card>
            {!aiReport ? (
              <p className="text-label-md text-on-surface-variant">Generate an executive summary of university-wide placement performance from the real analytics above.</p>
            ) : (
              <div className="space-y-5">
                <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Executive summary</p><p className="text-body-md text-on-surface-variant">{aiReport.executiveSummary}</p></div>
                {aiReport.keyFindings.length > 0 && <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Key findings</p><ul className="space-y-1">{aiReport.keyFindings.map((f, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">insights</span>{f}</li>)}</ul></div>}
                {aiReport.recommendations.length > 0 && <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Recommendations</p><ul className="space-y-1">{aiReport.recommendations.map((r, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>{r}</li>)}</ul></div>}
              </div>
            )}
          </Card>
        </Section>
      </div>
    </>
  );
};

export default ReportsCenter;
