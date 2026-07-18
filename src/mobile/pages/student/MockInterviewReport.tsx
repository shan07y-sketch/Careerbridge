/**
 * Mobile Interview Report viewer.
 *
 * Renders ONLY the stored report from PostgreSQL (never regenerates):
 * the same record the dashboard, PDF, employer and university surfaces use.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { MockInterviewAIService } from '../../../services';
import type { MockInterviewSessionDetail, MockInterviewReportResult } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Chip, SectionTitle, ScoreRing, Progress, Expandable, Skeleton, ErrorState, Button } from '../../components';

const SCORE_ROWS: { key: keyof MockInterviewReportResult; label: string }[] = [
  { key: 'technicalScore', label: 'Technical' },
  { key: 'communicationScore', label: 'Communication' },
  { key: 'problemSolvingScore', label: 'Problem solving' },
  { key: 'behavioralScore', label: 'Behavioral' },
  { key: 'confidenceScore', label: 'Confidence' },
  { key: 'grammarScore', label: 'Grammar' },
];

const MobileMockInterviewReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [session, setSession] = useState<MockInterviewSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setSession(await MockInterviewAIService.getSessionDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const report = session?.reports?.[0] ?? null;

  const downloadPdf = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      await MockInterviewAIService.downloadReportPdf(id);
      showToast('PDF downloaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const shareReport = async () => {
    if (!report || !session) return;
    const text = `My CareerBridge mock interview score: ${Math.round(report.score)}/100 (${session.interviewType}, ${session.difficulty}).`;
    try {
      if (await Share.canShare().then(r => r.value).catch(() => false)) {
        await Share.share({ title: 'Interview report', text });
      } else if (navigator.share) {
        await navigator.share({ title: 'Interview report', text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Summary copied to clipboard');
      }
    } catch { /* cancelled */ }
  };

  const toggleEmployerSharing = async () => {
    if (!id || !session) return;
    setSharing(true);
    try {
      const res = await MockInterviewAIService.setSharing(id, !session.sharedWithEmployers);
      setSession({ ...session, sharedWithEmployers: res.sharedWithEmployers });
      showToast(res.sharedWithEmployers ? 'Report shared with employers' : 'Employer sharing turned off');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update sharing', 'error');
    } finally {
      setSharing(false);
    }
  };

  return (
    <MobileShell
      title="Interview report"
      subtitle={session ? `${session.interviewType} · ${session.difficulty}` : undefined}
      back
      actions={
        report ? (
          <button onClick={shareReport} aria-label="Share report" className="m-press w-10 h-10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">share</span>
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="px-4 pt-4 space-y-3"><Skeleton className="h-52" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : error || !session ? (
        <ErrorState message={error || 'Report not found'} onRetry={() => { setLoading(true); load(); }} />
      ) : !report ? (
        <ErrorState message="This session has no stored report yet. Finish the interview to generate one." />
      ) : (
        <div className="px-4 pt-4 space-y-2.5">
          {/* Overall */}
          <Card className="flex flex-col items-center py-6">
            <ScoreRing score={report.score} label="overall" size={132} />
            <p className="text-sm font-bold mt-3">{session.jobTitle || 'Practice interview'}</p>
            <p className="text-xs text-on-surface-variant">
              {new Date(report.createdAt).toLocaleString()}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {report.interviewReadiness != null && <Chip tone="info">Readiness {Math.round(report.interviewReadiness)}%</Chip>}
              {report.estimated && <Chip tone="warning">Estimated — AI unavailable</Chip>}
            </div>
            {report.summary && (
              <p className="text-sm text-on-surface-variant text-center mt-3 leading-relaxed">{report.summary}</p>
            )}
          </Card>

          {/* Score breakdown */}
          <SectionTitle>Score breakdown</SectionTitle>
          <Card>
            <div className="space-y-3.5">
              {SCORE_ROWS.map(({ key, label }) => {
                const v = report[key];
                if (typeof v !== 'number') return null;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{label}</span>
                      <span className="font-bold text-on-surface-variant">{Math.round(v)}/100</span>
                    </div>
                    <Progress value={v} tone={v >= 70 ? 'success' : v >= 45 ? 'warning' : 'error'} />
                  </div>
                );
              })}
            </div>
            {(report.speakingSpeedWpm != null || report.fillerWordCount != null) && (
              <div className="flex gap-4 mt-4 pt-3 border-t border-on-surface/5 text-xs text-on-surface-variant">
                {report.speakingSpeedWpm != null && <span>🎙 {Math.round(report.speakingSpeedWpm)} words/min</span>}
                {report.fillerWordCount != null && <span>“um” × {report.fillerWordCount}</span>}
              </div>
            )}
          </Card>

          {/* Strengths & weaknesses */}
          {report.strengths.length > 0 && (
            <Expandable title="Strengths" subtitle={`${report.strengths.length} highlighted`}>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="material-symbols-outlined text-[18px] text-success shrink-0">thumb_up</span>{s}</li>
                ))}
              </ul>
            </Expandable>
          )}
          {report.weaknesses.length > 0 && (
            <Expandable title="Areas to improve" subtitle={`${report.weaknesses.length} noted`}>
              <ul className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="material-symbols-outlined text-[18px] text-warning shrink-0">priority_high</span>{w}</li>
                ))}
              </ul>
            </Expandable>
          )}
          {report.improvementPlan.length > 0 && (
            <Expandable title="Improvement plan" subtitle={`${report.improvementPlan.length} steps`}>
              <ol className="space-y-2 list-decimal ml-5">
                {report.improvementPlan.map((p, i) => <li key={i} className="text-sm">{p}</li>)}
              </ol>
            </Expandable>
          )}

          {/* Per-question breakdown */}
          {report.questionBreakdown.length > 0 && (
            <>
              <SectionTitle>Question by question</SectionTitle>
              <div className="space-y-2.5">
                {report.questionBreakdown.map(q => (
                  <Expandable
                    key={q.questionIndex}
                    title={`Q${q.questionIndex + 1} · ${Math.round(q.overallScore)}/100`}
                    subtitle={q.questionText}
                  >
                    <div className="space-y-3 text-sm">
                      <p className="font-semibold">{q.questionText}</p>
                      {q.answerTranscript && (
                        <div className="bg-surface-container rounded-xl p-3">
                          <p className="text-[11px] font-bold text-on-surface-variant uppercase mb-1">Your answer</p>
                          <p className="text-sm leading-relaxed">{q.answerTranscript}</p>
                        </div>
                      )}
                      {q.feedback && <p className="text-on-surface-variant leading-relaxed">{q.feedback}</p>}
                      {q.suggestedBetterAnswer && (
                        <div className="bg-success-container/50 rounded-xl p-3">
                          <p className="text-[11px] font-bold text-on-success-container uppercase mb-1">Stronger answer</p>
                          <p className="text-sm leading-relaxed">{q.suggestedBetterAnswer}</p>
                        </div>
                      )}
                    </div>
                  </Expandable>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <Button full icon="download" onClick={downloadPdf} disabled={downloading}>
              {downloading ? 'Preparing PDF…' : 'Download PDF report'}
            </Button>
            <Button full variant={session.sharedWithEmployers ? 'tonal' : 'outline'} icon={session.sharedWithEmployers ? 'visibility' : 'visibility_off'} onClick={toggleEmployerSharing} disabled={sharing}>
              {session.sharedWithEmployers ? 'Shared with employers — tap to unshare' : 'Share with employers'}
            </Button>
          </div>
        </div>
      )}
    </MobileShell>
  );
};

export default MobileMockInterviewReport;
