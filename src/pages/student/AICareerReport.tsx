import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressRing } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import { exportCareerReportPDF } from '../../utils/exportUtils';
import { CareerService } from '../../services';
import type { AICareerInsight } from '../../types';

const normalize = (i: AICareerInsight): AICareerInsight => {
  i.readinessPercent = i.readinessPercent ?? (i as any).score ?? 0;
  i.matchedSkills = i.matchedSkills ?? [];
  i.missingSkills = i.missingSkills ?? [];
  i.recommendedProjects = i.recommendedProjects ?? [];
  i.recommendedCourses = i.recommendedCourses ?? [];
  i.recommendedInterviewTopics = i.recommendedInterviewTopics ?? [];
  i.roadmap = Array.isArray(i.roadmap) ? i.roadmap : [];
  return i;
};

export const AICareerReport: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [insight, setInsight] = useState<AICareerInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState('');

  const loadInsight = useCallback(async () => {
    setLoading(true);
    try {
      const latest = await CareerService.getLatestAICareerInsight();
      const normalized = latest ? normalize(latest) : null;
      setInsight(normalized);
      if (normalized?.targetRole) setTargetRole(normalized.targetRole);
    } catch {
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInsight(); }, [loadInsight]);

  const handleGenerate = async () => {
    if (!targetRole.trim()) { showToast('Enter the role you want to grow into to generate your report.', 'info'); return; }
    setGenerating(true);
    try {
      const result = await CareerService.generateAICareerInsight(targetRole.trim());
      setInsight(result ? normalize(result) : null);
      showToast('Career readiness report generated.', 'success');
    } catch {
      showToast('Could not generate your career report. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const readinessPercent = insight?.readinessPercent ?? 0;
  const targetRoleName = insight?.targetRole ?? '';
  const whyThisScore = insight?.whyThisScore ?? '';
  const matchedSkills = insight?.matchedSkills ?? [];
  const missingSkills = insight?.missingSkills ?? [];
  const recommendedProjects = insight?.recommendedProjects ?? [];
  const recommendedCourses = insight?.recommendedCourses ?? [];
  const recommendedInterviewTopics = insight?.recommendedInterviewTopics ?? [];
  const roadmap = insight?.roadmap ?? [];

  let summaryText = insight?.summary || '';
  if (insight) {
    try {
      const parsed = JSON.parse(insight.summary);
      summaryText = parsed?.career_report?.summary || parsed?.summary || summaryText;
    } catch { /* keep raw string */ }
  }

  return (
    <PageLayout searchPlaceholder="Search…">
      <PageHeader
        title="AI career report"
        description="Readiness for the role you want — generated from your real resume analysis and interview practice."
        actions={insight && (
          <div className="flex items-center gap-2">
            {insight.modelVersion?.endsWith('-estimated') && (
              <Badge tone="warning" icon="info">Estimated · AI unavailable</Badge>
            )}
            <Button variant="outline" onClick={() => exportCareerReportPDF(targetRoleName as any)}
              leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>Download</Button>
          </div>
        )}
      />

      <div className="space-y-8">
        <Card>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <label className="flex-1 block">
              <span className="text-label-md font-semibold text-on-surface">Target role</span>
              <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Data Scientist, Frontend Engineer"
                onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 focus:shadow-focus-brand outline-none transition-all" />
            </label>
            <Button variant="primary" onClick={handleGenerate} disabled={generating}
              leftIcon={<span className="material-symbols-outlined text-[19px]">neurology</span>}>
              {generating ? 'Analyzing…' : insight ? 'Refresh report' : 'Generate report'}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
        ) : !insight ? (
          <EmptyState icon="neurology" title="No report yet"
            description="Enter the role you're aiming for and generate your first AI readiness report. It scores your fit, finds skill gaps, and builds a roadmap."
            actionLabel="Generate report" onAction={handleGenerate} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="!p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0"><ProgressRing value={readinessPercent} size={120} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                      <h2 className="text-body-lg font-semibold text-on-surface">Ready for {targetRoleName || 'your target role'}</h2>
                    </div>
                    {summaryText && <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">{summaryText}</p>}
                    {whyThisScore && (
                      <div className="mt-3 p-3 rounded-xl bg-primary-container/50">
                        <p className="text-label-sm font-semibold text-on-primary-container">Why this score</p>
                        <p className="text-label-md text-on-surface-variant mt-0.5">{whyThisScore}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Section title="Skill gap analysis" description="What you have, and where to grow, for this role">
                <Card>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p className="flex items-center gap-2 text-label-md font-semibold text-success mb-3">
                        <span className="material-symbols-outlined text-[19px]">check_circle</span>Matched skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {matchedSkills.length === 0
                          ? <span className="text-label-md text-on-surface-variant">No strong matches identified yet.</span>
                          : matchedSkills.map(s => <Badge key={s} tone="success">{s}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-label-md font-semibold text-warning mb-3">
                        <span className="material-symbols-outlined text-[19px]">trending_up</span>Growth opportunities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {missingSkills.length === 0
                          ? <span className="text-label-md text-on-surface-variant">No major gaps identified.</span>
                          : missingSkills.map(s => <Badge key={s} tone="warning">{s}</Badge>)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Section>

              <Section title="Personalized roadmap" description="Sequenced steps to close the gap">
                {roadmap.length === 0 ? (
                  <Card><p className="text-label-md text-on-surface-variant">No roadmap steps generated yet.</p></Card>
                ) : (
                  <Card>
                    <ol className="relative border-l border-outline-variant/70 ml-3 space-y-6">
                      {roadmap.map((step: { title: string; description: string }, idx: number) => (
                        <li key={`${step.title}-${idx}`} className="pl-6">
                          <span className="absolute -left-3 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-sm font-semibold">{idx + 1}</span>
                          <h4 className="text-body-md font-semibold text-on-surface">{step.title}</h4>
                          <p className="text-label-md text-on-surface-variant mt-1 leading-relaxed">{step.description}</p>
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}
              </Section>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader icon="rocket_launch" title="Recommended projects" />
                  {recommendedProjects.length === 0 ? <p className="text-label-md text-on-surface-variant">None yet.</p> : (
                    <ul className="space-y-2">{recommendedProjects.map((p, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">check</span>{p}</li>)}</ul>
                  )}
                </Card>
                <Card>
                  <CardHeader icon="school" title="Recommended courses" />
                  {recommendedCourses.length === 0 ? <p className="text-label-md text-on-surface-variant">None yet.</p> : (
                    <ul className="space-y-2">{recommendedCourses.map((c, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[18px] text-primary">check</span>{c}</li>)}</ul>
                  )}
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader icon="forum" title="Practice these topics" subtitle="Feed straight into a mock interview" />
                {recommendedInterviewTopics.length === 0 ? (
                  <p className="text-label-md text-on-surface-variant">Complete a mock interview to get topic suggestions.</p>
                ) : (
                  <div className="space-y-2">
                    {recommendedInterviewTopics.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-surface-container text-label-md text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">forum</span>{t}
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/mock-interview')}>Start practice session</Button>
              </Card>

              <Card>
                <CardHeader icon="description" title="Improve your score" subtitle="A current resume sharpens matching" />
                <Button variant="ghost" className="!justify-between w-full" onClick={() => navigate('/student/profile')}>Update your resume<span className="material-symbols-outlined text-[18px]">chevron_right</span></Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AICareerReport;
