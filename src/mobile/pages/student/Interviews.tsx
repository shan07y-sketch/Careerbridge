/**
 * Mobile Interviews hub — premium home for real scheduled interviews and
 * AI mock-interview practice. Combines InterviewService (scheduled interviews)
 * and MockInterviewAIService (practice history + reports). Real API only.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { InterviewService, MockInterviewAIService } from '../../../services';
import type { MockInterviewHistoryEntry } from '../../../services';
import type { Interview } from '../../../types';
import { MobileShell, Card, Chip, SectionTitle, SkeletonList, ErrorState, PullToRefresh, Avatar, ScoreRing } from '../../components';

const fmtWhen = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const MobileInterviews: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [history, setHistory] = useState<MockInterviewHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [iv, h] = await Promise.allSettled([
      InterviewService.getInterviews(),
      MockInterviewAIService.getHistory(),
    ]);
    if (iv.status === 'fulfilled') setInterviews(iv.value);
    if (h.status === 'fulfilled') setHistory(h.value);
    if (iv.status === 'rejected' && h.status === 'rejected') {
      setError(iv.reason instanceof Error ? iv.reason.message : 'Request failed');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <MobileShell title="Interviews"><SkeletonList count={5} /></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Interviews"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  const upcoming = interviews
    .filter(iv => iv.status !== 'completed')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const completedPractice = history
    .filter(h => h.status === 'COMPLETED' && h.reports.length > 0)
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
  const latestReport = completedPractice[0]?.reports[0];
  const readiness = latestReport?.interviewReadiness != null
    ? Math.round(latestReport.interviewReadiness)
    : (user?.readinessScore ?? 0);

  return (
    <MobileShell bare>
      <PullToRefresh onRefresh={load}>
        {/* ---- Aurora hero ---- */}
        <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
          <p className="text-[13px] text-white/70 leading-none">Interviews</p>
          <h1 className="text-2xl font-extrabold leading-tight">Get interview-ready</h1>
          <div className="mt-4 flex items-center gap-4 rounded-3xl m-glass p-4">
            <ScoreRing score={readiness} size={72} label="ready" />
            <div className="min-w-0">
              <p className="text-sm font-bold">Interview readiness</p>
              <p className="text-[13px] text-white/75 leading-snug">
                {readiness >= 75 ? "You're interview-ready — keep sharp with a quick round." :
                 readiness >= 40 ? 'Good momentum. One more mock round will lift this.' :
                 'Run a mock interview to build your readiness score.'}
              </p>
              <button
                onClick={() => navigate('/student/mock-interview')}
                className="mt-2 text-[13px] font-bold text-white underline underline-offset-4 decoration-white/40"
              >
                Practice now →
              </button>
            </div>
          </div>
        </section>

        <div className="px-4">
          {/* ---- Practice CTA ---- */}
          <button
            onClick={() => navigate('/student/mock-interview')}
            className="m-ai-cta m-card-lift w-full mt-4 rounded-3xl p-4 flex items-center gap-3 text-left shadow-lg"
          >
            <span className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">record_voice_over</span>
            </span>
            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm font-extrabold">Start an AI mock interview</p>
              <p className="text-[13px] text-white/85 truncate">Voice-first practice with instant scoring</p>
            </div>
            <span className="material-symbols-outlined relative z-10">chevron_right</span>
          </button>

          {/* ---- Upcoming scheduled interviews ---- */}
          <SectionTitle>Upcoming interviews</SectionTitle>
          {upcoming.length === 0 ? (
            <Card>
              <p className="text-sm text-on-surface-variant">
                No interviews scheduled yet. When an employer invites you, it'll appear here with a join link.
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map(iv => (
                <div
                  key={iv.id}
                  onClick={() => navigate(`/student/interview/${iv.id}`)}
                  className="m-card-lift rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={iv.companyLogo} name={iv.companyName} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold truncate">{iv.jobTitle}</p>
                      <p className="text-xs text-on-surface-variant truncate">{iv.companyName}</p>
                    </div>
                    <Chip tone={iv.status === 'scheduled' ? 'success' : 'warning'}>{iv.status}</Chip>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">event</span>{fmtWhen(iv.dateTime)}
                      </span>
                      <Chip tone="info">{iv.type}</Chip>
                    </div>
                    {iv.roomLink && (
                      <a
                        href={iv.roomLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="m-press text-xs font-bold text-primary inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">videocam</span>Join
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- Recent practice ---- */}
          {completedPractice.length > 0 && (
            <>
              <SectionTitle>Recent practice</SectionTitle>
              <div className="space-y-2.5">
                {completedPractice.slice(0, 6).map(h => {
                  const rep = h.reports[0];
                  return (
                    <button
                      key={h.id}
                      onClick={() => navigate(`/student/interview-report/${rep.mockInterviewId}`)}
                      className="m-card-lift w-full text-left rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 flex items-center gap-4"
                    >
                      <ScoreRing score={Math.round(rep.score)} size={52} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{h.jobTitle || 'Mock interview'}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {h.interviewType} · {h.difficulty} · {new Date(h.completedAt || h.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="h-4" />
        </div>
      </PullToRefresh>
    </MobileShell>
  );
};

export default MobileInterviews;
