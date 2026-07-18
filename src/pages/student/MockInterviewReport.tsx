import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ProgressChart } from '../../components/charts/ProgressChart';
import { AIChart } from '../../components/charts/AIChart';
import { useToast } from '../../contexts/ToastContext';
import { MockInterviewAIService } from '../../services';
import type { MockInterviewSessionDetail, MockInterviewQuestionBreakdown } from '../../services';

const scoreOrDash = (n: number | null | undefined) => (n != null ? Math.round(n) : null);

export const MockInterviewReport: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [session, setSession] = useState<MockInterviewSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const detail = await MockInterviewAIService.getSessionDetail(id);
        setSession(detail);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not load this interview report.', 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      await MockInterviewAIService.downloadReportPdf(id);
      showToast('PDF report downloaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not download the PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleShare = async () => {
    if (!id || !session) return;
    setSharing(true);
    try {
      const result = await MockInterviewAIService.setSharing(id, !session.sharedWithEmployers);
      setSession({ ...session, sharedWithEmployers: result.sharedWithEmployers });
      showToast(
        result.sharedWithEmployers
          ? 'Report shared: employers you applied to can now view it.'
          : 'Report sharing disabled.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update sharing.', 'error');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title="AI interview report" />
        <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
      </PageLayout>
    );
  }

  const report = session?.reports?.[0];

  if (!session || !report) {
    return (
      <PageLayout>
        <PageHeader title="AI interview report" />
        <EmptyState icon="assignment" title="No report available yet"
          description="This interview may still be in progress, or a report wasn't generated. Run a fresh session to get a full AI scorecard."
          actionLabel="Start a mock interview" onAction={() => navigate('/student/mock-interview')} />
      </PageLayout>
    );
  }

  const breakdown: MockInterviewQuestionBreakdown[] = report.questionBreakdown ?? [];
  const isEstimated = report.estimated || report.modelVersion?.endsWith('-estimated');

  const metrics = {
    communication: scoreOrDash(report.communicationScore) ?? 0,
    technical: scoreOrDash(report.technicalScore) ?? 0,
    problemSolving: scoreOrDash(report.problemSolvingScore) ?? 0,
    confidence: scoreOrDash(report.confidenceScore) ?? 0,
    behavioral: scoreOrDash(report.behavioralScore) ?? 0
  };

  const headlineStats: { label: string; value: string }[] = [
    { label: 'Readiness', value: report.interviewReadiness != null ? `${report.interviewReadiness}/100` : '—' },
    { label: 'Job match', value: report.jobMatchPercent != null ? `${report.jobMatchPercent}%` : '—' },
    { label: 'Skill match', value: report.skillMatchPercent != null ? `${report.skillMatchPercent}%` : '—' },
    { label: 'Pace', value: report.speakingSpeedWpm ? `${Math.round(report.speakingSpeedWpm)} wpm` : '—' },
    { label: 'Filler words', value: String(report.fillerWordCount ?? 0) },
    { label: 'Questions', value: String(breakdown.length) }
  ];

  return (
    <PageLayout>
      <PageHeader
        title="AI interview report"
        description={`${session.jobTitle}${session.companyName ? ` · ${session.companyName}` : ''} · ${session.interviewType} · ${session.difficulty} · ${new Date(report.createdAt).toLocaleDateString()}`}
        breadcrumbs={[{ label: 'Mock interview', onClick: () => navigate('/student/mock-interview') }, { label: 'Report' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isEstimated && <Badge tone="warning" icon="info">Estimated – AI unavailable</Badge>}
            <Button
              variant="secondary"
              onClick={handleToggleShare}
              disabled={sharing}
              leftIcon={<span className="material-symbols-outlined text-[19px]">{session.sharedWithEmployers ? 'visibility_off' : 'share'}</span>}
            >
              {session.sharedWithEmployers ? 'Stop sharing' : 'Share with employers'}
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadPdf}
              disabled={downloading}
              leftIcon={<span className="material-symbols-outlined text-[19px]">picture_as_pdf</span>}
            >
              {downloading ? 'Preparing…' : 'Download PDF'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Overview */}
          <Card className="p-8 flex flex-col md:flex-row items-center gap-8 justify-around">
            <ProgressChart percent={Math.round(report.score)} size={130} label="Overall" />
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary font-bold">verified_user</span>
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">AI Performance Summary</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{report.aiSummary}</p>
              <div className="grid grid-cols-3 gap-3">
                {headlineStats.map(s => (
                  <div key={s.label} className="bg-surface-container-low p-2 rounded-lg text-center">
                    <p className="text-[9px] text-outline uppercase font-bold">{s.label}</p>
                    <p className="text-sm font-bold text-primary">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Strengths / weaknesses / missing skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-2">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">thumb_up</span> Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-on-surface-variant leading-relaxed list-disc list-inside">
                {report.strengths.length > 0 ? report.strengths.map((s, i) => <li key={i}>{s}</li>) : <li>None recorded.</li>}
              </ul>
            </Card>
            <Card className="space-y-2">
              <h4 className="font-bold text-xs text-error uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">priority_high</span> Areas to improve
              </h4>
              <ul className="space-y-1.5 text-xs text-on-surface-variant leading-relaxed list-disc list-inside">
                {report.weaknesses.length > 0 ? report.weaknesses.map((s, i) => <li key={i}>{s}</li>) : <li>None recorded.</li>}
              </ul>
            </Card>
          </div>

          {report.missingSkills.length > 0 && (
            <Card className="space-y-2">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Skill gap analysis</h4>
              <div className="flex flex-wrap gap-2">
                {report.missingSkills.map((s, i) => <Badge key={i} tone="warning">{s}</Badge>)}
              </div>
            </Card>
          )}

          {/* Learning roadmap */}
          {report.learningRoadmap.length > 0 && (
            <Card className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">route</span> Learning Roadmap
              </h3>
              <ol className="space-y-3">
                {report.learningRoadmap.map(step => (
                  <li key={step.step} className="flex gap-3">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">{step.step}</span>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{step.title}</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{step.description}</p>
                      {step.resources.length > 0 && (
                        <p className="text-[11px] text-on-surface-variant/80 mt-0.5">Resources: {step.resources.join(' · ')}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {/* Recommendations */}
          {(report.improvementPlan.length > 0 || report.suggestedCourses.length > 0 || report.recommendedProjects.length > 0 || report.recommendedCertifications.length > 0) && (
            <Card className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span> Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {report.improvementPlan.length > 0 && (
                  <div>
                    <h4 className="font-bold text-primary mb-2">Action Items</h4>
                    <ul className="space-y-1.5 text-on-surface-variant leading-relaxed list-disc list-inside">
                      {report.improvementPlan.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {report.suggestedCourses.length > 0 && (
                  <div>
                    <h4 className="font-bold text-primary mb-2">Suggested Courses</h4>
                    <ul className="space-y-1.5 text-on-surface-variant leading-relaxed list-disc list-inside">
                      {report.suggestedCourses.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {report.recommendedProjects.length > 0 && (
                  <div>
                    <h4 className="font-bold text-primary mb-2">Portfolio Projects</h4>
                    <ul className="space-y-1.5 text-on-surface-variant leading-relaxed list-disc list-inside">
                      {report.recommendedProjects.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {report.recommendedCertifications.length > 0 && (
                  <div>
                    <h4 className="font-bold text-primary mb-2">Certifications</h4>
                    <ul className="space-y-1.5 text-on-surface-variant leading-relaxed list-disc list-inside">
                      {report.recommendedCertifications.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {report.careerRecommendations.length > 0 && (
                <div className="border-t border-outline-variant/20 pt-3">
                  <h4 className="font-bold text-primary mb-2 text-xs">Career Guidance</h4>
                  <ul className="space-y-1.5 text-xs text-on-surface-variant leading-relaxed list-disc list-inside">
                    {report.careerRecommendations.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Question-by-question */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-primary dark:text-primary-fixed">Question-by-Question Analysis</h3>
            {breakdown.map((item, idx) => (
              <Card key={item.questionIndex} className="space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2 flex-wrap gap-2">
                  <span className="text-xs font-bold text-primary dark:text-primary-fixed">
                    Question {idx + 1} · {item.questionType}{item.difficulty ? ` · ${item.difficulty}` : ''}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {item.evaluationEstimated && <Badge tone="warning">Estimated</Badge>}
                    {item.wordsPerMinute != null && <Badge tone="neutral">{Math.round(item.wordsPerMinute)} wpm</Badge>}
                    <Badge tone="brand">Score: {item.overallScore}/100</Badge>
                  </div>
                </div>
                <p className="font-bold text-xs text-primary dark:text-primary-fixed leading-snug">{item.questionText}</p>
                {item.answerTranscript && (
                  <p className="text-xs text-on-surface-variant italic leading-relaxed">"{item.answerTranscript}"</p>
                )}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(
                    [
                      ['Technical', item.technicalScore],
                      ['Comms', item.communicationScore],
                      ['Problem', item.problemSolvingScore],
                      ['Relevance', item.relevanceScore],
                      ['Complete', item.completenessScore],
                      ['Grammar', item.grammarScore]
                    ] as [string, number | null][]
                  ).map(([label, value]) => (
                    <div key={label} className="bg-surface-container-low p-2 rounded-lg text-center">
                      <p className="text-[9px] text-outline uppercase font-bold">{label}</p>
                      <p className="text-sm font-bold text-primary">{value ?? '—'}</p>
                    </div>
                  ))}
                </div>
                {(item.strengths.length > 0 || item.weaknesses.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-on-surface-variant pt-2">
                    {item.strengths.length > 0 && (
                      <div className="bg-green-50/50 dark:bg-primary-container/10 p-3 rounded-lg border border-green-200/50">
                        <p className="font-bold text-green-700 mb-1">Key Strengths</p>
                        <p>{item.strengths.join(', ')}</p>
                      </div>
                    )}
                    {item.weaknesses.length > 0 && (
                      <div className="bg-red-50/50 dark:bg-error-container/10 p-3 rounded-lg border border-red-200/50">
                        <p className="font-bold text-error mb-1">Opportunities for Improvement</p>
                        <p>{item.weaknesses.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
                {item.feedback && (
                  <p className="text-xs text-on-surface-variant leading-relaxed pt-1 border-t border-outline-variant/20">{item.feedback}</p>
                )}
                {item.suggestedBetterAnswer && (
                  <div className="bg-primary-container/20 border border-primary/10 p-3 rounded-lg">
                    <p className="text-[10px] text-primary uppercase font-bold mb-1">A stronger answer</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{item.suggestedBetterAnswer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="flex flex-col items-center">
            <h4 className="font-bold text-label-md text-primary uppercase tracking-wider mb-2">Metrics Radar</h4>
            <AIChart metrics={metrics} size={280} />
          </Card>

          <Card className="space-y-3">
            <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Score Breakdown</h4>
            {(
              [
                ['Overall', report.score],
                ['Technical', report.technicalScore],
                ['Communication', report.communicationScore],
                ['Behavioural', report.behavioralScore],
                ['Problem solving', report.problemSolvingScore],
                ['Confidence (est.)', report.confidenceScore],
                ['Grammar', report.grammarScore],
                ['Answer quality', report.answerQualityScore]
              ] as [string, number | null][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant w-32 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${value ?? 0}%` }} />
                </div>
                <span className="text-xs font-bold text-primary w-8 text-right">{value ?? '—'}</span>
              </div>
            ))}
          </Card>

          {report.cameraSummary && report.cameraSummary.length > 0 && (
            <Card className="space-y-2">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Participation events</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Factual events observed during the session — not judgments.
              </p>
              <ul className="space-y-1.5 text-xs text-on-surface-variant">
                {report.cameraSummary.map(c => (
                  <li key={c.event} className="flex justify-between">
                    <span className="capitalize">{c.event.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{c.count}×</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.suggestedQuestions.length > 0 && (
            <Card className="space-y-2">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Practice these next</h4>
              <ul className="space-y-1.5 text-xs text-on-surface-variant leading-relaxed list-disc list-inside">
                {report.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </Card>
          )}

          <Card className="space-y-3">
            <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Next steps</h4>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => navigate('/student/mock-interview')}>Start a new session</Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/student/dashboard')}>Back to dashboard</Button>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default MockInterviewReport;
