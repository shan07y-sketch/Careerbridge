/**
 * Mobile Student Dashboard — minimal card overview.
 * All data comes from the shared services; presentation only.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { Job, Application, Notification } from '../../../types';
import { JobService, ApplicationService, NotificationService, MockInterviewAIService } from '../../../services';
import type { MockInterviewHistoryEntry } from '../../../services';
import { MobileShell, Card, Stat, SectionTitle, Chip, SkeletonList, ErrorState, PullToRefresh, Avatar } from '../../components';

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
  const lastReport = interviews.find(iv => iv.status === 'COMPLETED' && iv.reports.length > 0)?.reports[0];
  const activeApplications = applications.filter(a => a.status !== 'rejected');

  if (loading) {
    return (
      <MobileShell title="Dashboard">
        <SkeletonList count={5} />
      </MobileShell>
    );
  }

  if (error) {
    return (
      <MobileShell title="Dashboard">
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      </MobileShell>
    );
  }

  return (
    <MobileShell
      title={`${greeting()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
      subtitle={user?.university || 'CareerBridge'}
      actions={
        <button
          onClick={() => navigate('/student/notifications')}
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}
          className="m-press relative w-10 h-10 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unread.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
          )}
        </button>
      }
    >
      <PullToRefresh onRefresh={load}>
        <div className="px-4 pt-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Stat icon="assignment_turned_in" label="Applications" value={activeApplications.length} />
            <Stat icon="record_voice_over" label="Interviews done" value={interviews.filter(i => i.status === 'COMPLETED').length} />
            <Stat icon="speed" label="Readiness" value={lastReport?.interviewReadiness != null ? `${Math.round(lastReport.interviewReadiness)}%` : (user?.readinessScore ? `${user.readinessScore}%` : '—')} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 overflow-x-auto pt-4 -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
            <Chip onClick={() => navigate('/student/mock-interview')}>
              <span className="material-symbols-outlined text-[16px]">record_voice_over</span> Practice interview
            </Chip>
            <Chip onClick={() => navigate('/student/profile')}>
              <span className="material-symbols-outlined text-[16px]">description</span> Resume
            </Chip>
            <Chip onClick={() => navigate('/student/career-report')}>
              <span className="material-symbols-outlined text-[16px]">neurology</span> Career coach
            </Chip>
            <Chip onClick={() => navigate('/student/saved')}>
              <span className="material-symbols-outlined text-[16px]">bookmark</span> Saved
            </Chip>
          </div>

          {/* Recommended jobs */}
          <SectionTitle
            action={<button onClick={() => navigate('/student/jobs')} className="text-xs font-semibold text-primary">See all</button>}
          >
            Recommended for you
          </SectionTitle>
          {topJobs.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">No jobs available yet. Check back soon.</p></Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
              {topJobs.map(job => (
                <div key={job.id} className="snap-start shrink-0 w-[260px]">
                  <Card onClick={() => navigate(`/student/jobs/${job.id}`)} className="h-full">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar src={job.companyLogo} name={job.companyName} size={36} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{job.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">{job.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span>{job.location || job.workMode}</span>
                      {job.matchRate > 0 && (
                        <span className="ml-auto font-bold text-success">{Math.round(job.matchRate)}% match</span>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Active applications */}
          <SectionTitle
            action={<button onClick={() => navigate('/student/applications')} className="text-xs font-semibold text-primary">See all</button>}
          >
            Your applications
          </SectionTitle>
          {activeApplications.length === 0 ? (
            <Card><p className="text-sm text-on-surface-variant">You haven't applied anywhere yet — browse jobs to get started.</p></Card>
          ) : (
            <div className="space-y-2.5">
              {activeApplications.slice(0, 3).map(app => (
                <Card key={app.id} onClick={() => navigate('/student/applications')}>
                  <div className="flex items-center gap-3">
                    <Avatar src={app.companyLogo} name={app.companyName} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{app.jobTitle}</p>
                      <p className="text-xs text-on-surface-variant truncate">{app.companyName}</p>
                    </div>
                    <Chip tone={app.status === 'offer' ? 'success' : app.status === 'interviewing' ? 'info' : 'neutral'}>
                      {app.status}
                    </Chip>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Latest interview report */}
          {lastReport && (
            <>
              <SectionTitle>Latest interview report</SectionTitle>
              <Card onClick={() => navigate(`/student/interview-report/${lastReport.mockInterviewId}`)}>
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="text-base font-extrabold text-on-primary-container">{Math.round(lastReport.score)}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">Overall score {Math.round(lastReport.score)}/100</p>
                    <p className="text-xs text-on-surface-variant truncate">{lastReport.summary || 'Tap to view your full report'}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </div>
              </Card>
            </>
          )}
        </div>
      </PullToRefresh>
    </MobileShell>
  );
};

export default MobileDashboard;
