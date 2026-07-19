/**
 * Mobile Student Home — premium, alive career feed.
 * All data comes from the shared services (real APIs); presentation only.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { Job, Application, Notification } from '../../../types';
import { JobService, ApplicationService, NotificationService, MockInterviewAIService } from '../../../services';
import type { MockInterviewHistoryEntry } from '../../../services';
import { MobileShell, Card, SectionTitle, SkeletonList, ErrorState, PullToRefresh, Avatar, ScoreRing } from '../../components';

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [interviews, setInterviews] = useState<MockInterviewHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [j, a, n, i] = await Promise.allSettled([
      JobService.getJobs(),
      ApplicationService.getApplications(),
      NotificationService.getNotifications(),
      MockInterviewAIService.getHistory(),
    ]);
    if (j.status === 'fulfilled') setJobs(j.value);
    if (a.status === 'fulfilled') setApplications(a.value);
    if (n.status === 'fulfilled') setNotifications(n.value);
    if (i.status === 'fulfilled') setInterviews(i.value);
    if (j.status === 'rejected' && a.status === 'rejected') {
      setError(j.reason instanceof Error ? j.reason.message : 'Request failed');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const topJobs = [...jobs].sort((x, y) => (y.matchRate || 0) - (x.matchRate || 0)).slice(0, 6);
  const unread = notifications.filter(n => !n.isRead);
  const completedInterviews = interviews.filter(i => i.status === 'COMPLETED');
  const lastReport = interviews.find(iv => iv.status === 'COMPLETED' && iv.reports.length > 0)?.reports[0];
  const activeApplications = applications.filter(a => a.status !== 'rejected');
  const readiness = lastReport?.interviewReadiness != null
    ? Math.round(lastReport.interviewReadiness)
    : (user?.readinessScore ?? 0);
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  if (loading) {
    return <MobileShell title="Home"><div className="px-4 pt-4"><SkeletonList count={5} /></div></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Home"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  const quickActions = [
    { icon: 'record_voice_over', label: 'Mock interview', to: '/student/mock-interview' },
    { icon: 'neurology', label: 'AI coach', to: '/student/career-report' },
    { icon: 'description', label: 'Resume', to: '/student/profile' },
    { icon: 'bookmark', label: 'Saved', to: '/student/saved' },
  ];

  return (
    <MobileShell bare>
      <PullToRefresh onRefresh={load}>
        {/* ---- Aurora hero ---- */}
        <section className="m-hero m-safe-top px-5 pt-5 pb-8 rounded-b-[28px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={user?.profilePicture || ''} name={user?.name || 'You'} size={44} />
              <div>
                <p className="text-[13px] text-white/70 leading-none">{greeting()},</p>
                <p className="text-lg font-extrabold leading-tight">{firstName}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/notifications')}
              aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}
              className="m-press relative w-11 h-11 rounded-full m-glass flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-white">notifications</span>
              {unread.length > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#ff6b6b] text-[10px] font-bold flex items-center justify-center">
                  {unread.length > 9 ? '9+' : unread.length}
                </span>
              )}
            </button>
          </div>

          {/* Career pulse */}
          <div className="mt-5 flex items-center gap-4 rounded-3xl m-glass p-4">
            <div className="shrink-0">
              <ScoreRing score={readiness} size={72} label="ready" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">Career readiness</p>
              <p className="text-[13px] text-white/75 leading-snug">
                {readiness >= 75 ? "You're interview-ready — keep the momentum." :
                 readiness >= 40 ? 'Solid progress. A mock interview will boost this fast.' :
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

          {/* Live stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { v: activeApplications.length, l: 'Applications' },
              { v: completedInterviews.length, l: 'Interviews' },
              { v: jobs.length, l: 'Matches' },
            ].map((s, idx) => (
              <div key={idx} className="rounded-2xl m-glass py-2.5 text-center">
                <p className="text-xl font-extrabold leading-none">{s.v}</p>
                <p className="text-[11px] text-white/70 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="px-4">
          {/* ---- AI coach CTA ---- */}
          <button
            onClick={() => navigate('/student/career-report')}
            className="m-ai-cta m-card-lift w-full mt-4 rounded-3xl p-4 flex items-center gap-3 text-left shadow-lg m-rise m-rise-1"
          >
            <span className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">auto_awesome</span>
            </span>
            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm font-extrabold">Ask your AI Career Coach</p>
              <p className="text-[13px] text-white/85 truncate">Roadmaps, skill gaps & personalized guidance</p>
            </div>
            <span className="material-symbols-outlined relative z-10">chevron_right</span>
          </button>

          {/* ---- Quick actions ---- */}
          <div className="grid grid-cols-4 gap-2 mt-4 m-rise m-rise-2">
            {quickActions.map(a => (
              <button
                key={a.to}
                onClick={() => navigate(a.to)}
                className="m-press flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-container/60 border border-on-surface/5"
              >
                <span className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-on-primary-container">{a.icon}</span>
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>

          {/* ---- Recommended jobs ---- */}
          <SectionTitle action={<button onClick={() => navigate('/student/jobs')} className="text-xs font-semibold text-primary">See all</button>}>
            Recommended for you
          </SectionTitle>
          {topJobs.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">No matches yet — complete your profile to unlock recommendations.</p></Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x m-rise m-rise-3" style={{ scrollbarWidth: 'none' }}>
              {topJobs.map(job => (
                <div key={job.id} className="snap-start shrink-0 w-[264px]">
                  <div
                    onClick={() => navigate(`/student/jobs/${job.id}`)}
                    className="m-card-lift h-full rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar src={job.companyLogo} name={job.companyName} size={40} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{job.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">{job.companyName}</p>
                      </div>
                    </div>
                    {job.matchRate > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-on-surface-variant">Match</span>
                          <span className="font-extrabold text-primary">{Math.round(job.matchRate)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-on-surface/8 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#3bb98b]" style={{ width: `${Math.min(100, job.matchRate)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      <span className="truncate">{job.location || job.workMode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- Applications ---- */}
          <SectionTitle action={<button onClick={() => navigate('/student/applications')} className="text-xs font-semibold text-primary">See all</button>}>
            Your applications
          </SectionTitle>
          {activeApplications.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">No applications yet — browse jobs to get started.</p></Card>
          ) : (
            <div className="space-y-2.5 m-rise m-rise-4">
              {activeApplications.slice(0, 3).map(app => (
                <div
                  key={app.id}
                  onClick={() => navigate('/student/applications')}
                  className="m-card-lift flex items-center gap-3 rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3"
                >
                  <Avatar src={app.companyLogo} name={app.companyName} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{app.jobTitle}</p>
                    <p className="text-xs text-on-surface-variant truncate">{app.companyName}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    app.status === 'offer' ? 'bg-success/15 text-success' :
                    app.status === 'interviewing' ? 'bg-info/15 text-info' :
                    'bg-on-surface/8 text-on-surface-variant'
                  }`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* ---- Latest interview report ---- */}
          {lastReport && (
            <>
              <SectionTitle>Latest interview report</SectionTitle>
              <div
                onClick={() => navigate(`/student/interview-report/${lastReport.mockInterviewId}`)}
                className="m-card-lift flex items-center gap-4 rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 m-rise m-rise-5"
              >
                <ScoreRing score={Math.round(lastReport.score)} size={56} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Overall score {Math.round(lastReport.score)}/100</p>
                  <p className="text-xs text-on-surface-variant truncate">{lastReport.summary || 'Tap to view your full report'}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </div>
            </>
          )}

          <div className="h-4" />
        </div>
      </PullToRefresh>
    </MobileShell>
  );
};

export default MobileDashboard;
