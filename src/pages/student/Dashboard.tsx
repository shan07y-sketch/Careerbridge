import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Job, Application, Notification, Interview } from '../../types';
import { JobService, ApplicationService, NotificationService, InterviewService, StudentEcosystemService, MockInterviewAIService } from '../../services';
import type { MockInterviewHistoryEntry } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { JobCard } from '../../components/cards/JobCard';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Section, ViewAll } from '../../components/ui/Section';
import { AttentionCard } from '../../components/ui/AttentionCard';
import { ActivityFeed, type ActivityItem } from '../../components/ui/ActivityFeed';
import { TaskList, type TaskItem } from '../../components/ui/TaskList';
import { ProgressRing } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

/** Real profile completion, computed from actual Student fields — no fabricated 85%. */
const computeProfileCompletion = (user: ReturnType<typeof useAuth>['user']): { percent: number; missing: { label: string; icon: string }[] } => {
  if (!user) return { percent: 0, missing: [] };
  const checks: { label: string; icon: string; done: boolean }[] = [
    { label: 'Upload your resume', icon: 'upload_file', done: !!user.resumeUrl },
    { label: 'Link portfolio or GitHub', icon: 'link', done: !!user.portfolioUrl },
    { label: 'Set your career goal', icon: 'flag', done: !!user.careerGoal },
    { label: 'Add your skills', icon: 'psychology', done: (user.skills?.length ?? 0) > 0 },
    { label: 'Set preferred location', icon: 'location_on', done: !!user.preferredLocation },
  ];
  const done = checks.filter(c => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter(c => !c.done) };
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const timeAgo = (iso?: string): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [upcomingInterview, setUpcomingInterview] = useState<Interview | null>(null);
  const [mockHistory, setMockHistory] = useState<MockInterviewHistoryEntry[]>([]);

  useEffect(() => {
    // Merge ecosystem recommendation scores into the job cards so "AI Match"
    // reflects the real ranking rather than a placeholder.
    Promise.all([
      JobService.getJobs(),
      StudentEcosystemService.getRecommendations().catch(() => null)
    ])
      .then(([jobs, recs]) => {
        const scores = new Map<string, number>(
          (recs?.recommendedJobs ?? []).map((r: { id: string; score: number }) => [r.id, r.score])
        );
        const ranked = jobs
          .map(j => (scores.has(j.id) ? { ...j, matchRate: scores.get(j.id)! } : j))
          .sort((a, b) => (b.matchRate ?? 0) - (a.matchRate ?? 0));
        setRecommendedJobs(ranked.slice(0, 3));
      })
      .catch(err => console.error('Failed to load jobs', err))
      .finally(() => setIsLoadingJobs(false));

    ApplicationService.getApplications().then(setApplications).catch(() => setApplications([]));
    NotificationService.getNotifications().then(list => setRecentNotifications(list.slice(0, 4))).catch(() => setRecentNotifications([]));
    MockInterviewAIService.getHistory()
      .then(list => setMockHistory(list.filter(h => h.status === 'COMPLETED' && h.reports[0])))
      .catch(() => setMockHistory([]));
    InterviewService.getInterviews().then(list => {
      const upcoming = list
        .filter(i => i.status === 'scheduled' && new Date(i.dateTime).getTime() > Date.now())
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setUpcomingInterview(upcoming[0] ?? null);
    }).catch(() => setUpcomingInterview(null));
  }, []);

  const profile = computeProfileCompletion(user);
  const readiness = user?.readinessScore ?? 0;

  const activeApps = applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length;
  const interviewingApps = applications.filter(a => a.status === 'interviewing').length;
  const offers = applications.filter(a => a.status === 'offer').length;

  // Countdown to next interview
  const [countdown, setCountdown] = useState<{ hours: number; mins: number } | null>(null);
  useEffect(() => {
    if (!upcomingInterview) { setCountdown(null); return; }
    const update = () => {
      const diffMs = new Date(upcomingInterview.dateTime).getTime() - Date.now();
      if (diffMs <= 0) { setCountdown({ hours: 0, mins: 0 }); return; }
      setCountdown({ hours: Math.floor(diffMs / 3600000), mins: Math.floor((diffMs % 3600000) / 60000) });
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [upcomingInterview]);

  // Recent activity — real applications + notifications, merged and sorted
  const activity: ActivityItem[] = useMemo(() => {
    const appItems: ActivityItem[] = applications.slice(0, 4).map(a => ({
      id: `app-${a.id}`,
      icon: a.status === 'offer' ? 'celebration' : a.status === 'interviewing' ? 'videocam' : a.status === 'rejected' ? 'do_not_disturb_on' : 'send',
      title: <>You applied to <span className="font-semibold">{a.jobTitle}</span> at {a.companyName}</>,
      meta: `${a.status.charAt(0).toUpperCase() + a.status.slice(1)} · ${timeAgo(a.dateApplied)}`,
      tone: a.status === 'offer' ? 'success' : a.status === 'rejected' ? 'error' : a.status === 'interviewing' ? 'info' : 'brand',
      onClick: () => navigate('/student/applications'),
    }));
    const notifItems: ActivityItem[] = recentNotifications.slice(0, 3).map(n => ({
      id: `notif-${n.id}`,
      icon: n.type === 'interview' ? 'event' : n.type === 'message' ? 'forum' : n.type === 'resume' ? 'description' : 'notifications',
      title: n.title,
      meta: n.time,
      tone: 'neutral',
      onClick: n.action?.link ? () => navigate(n.action!.link) : () => navigate('/student/notifications'),
    }));
    return [...appItems, ...notifItems].slice(0, 5);
  }, [applications, recentNotifications, navigate]);

  // Next steps — real profile gaps
  const tasks: TaskItem[] = profile.missing.map((m, i) => ({
    id: `task-${i}`,
    label: m.label,
    icon: m.icon,
    actionLabel: 'Do it',
    onAction: () => navigate('/student/profile'),
  }));

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <PageLayout searchPlaceholder="Search jobs, companies, skills…">
      {/* ── TOP: title, context, primary actions ─────────────────────── */}
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here's what's happening with your job search today."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/student/career-report')} leftIcon={<span className="material-symbols-outlined text-[19px]">neurology</span>}>
              Career report
            </Button>
            <Button variant="primary" onClick={() => navigate('/student/jobs')} leftIcon={<span className="material-symbols-outlined text-[19px]">work</span>}>
              Browse jobs
            </Button>
          </>
        }
      />

      <div className="space-y-8">
        {/* ── MIDDLE: focal attention banner ───────────────────────────── */}
        {upcomingInterview && countdown ? (
          <AttentionCard
            icon="videocam"
            tone="brand"
            title={`Interview in ${countdown.hours}h ${countdown.mins}m — ${upcomingInterview.jobTitle}`}
            description={`${upcomingInterview.type} interview with ${upcomingInterview.companyName}. Review your prep before you join.`}
            actionLabel="Prepare now"
            onAction={() => navigate('/student/mock-interview')}
          />
        ) : profile.percent < 100 ? (
          <AttentionCard
            icon="rocket_launch"
            tone="brand"
            title={`Your profile is ${profile.percent}% complete`}
            description="A complete profile gets up to 3× more recruiter views. You're almost there."
            actionLabel="Finish profile"
            onAction={() => navigate('/student/profile')}
          />
        ) : null}

        {/* ── MIDDLE: KPIs with context ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Active applications" value={activeApps} icon="send" hint={`${applications.length} total`} onClick={() => navigate('/student/applications')} />
          <StatCard label="Interviewing" value={interviewingApps} icon="videocam" hint="in progress" onClick={() => navigate('/student/applications')} />
          <StatCard label="Offers" value={offers} icon="handshake" hint={offers > 0 ? 'Congratulations!' : 'keep going'} onClick={() => navigate('/student/applications')} />
          <StatCard label="Career readiness" value={`${readiness}%`} icon="trending_up" hint="build to improve" onClick={() => navigate('/student/career-report')} />
        </div>

        {/* ── MIDDLE/BOTTOM: two-column working area ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary column: recommendations + activity */}
          <div className="lg:col-span-2 space-y-8">
            <Section
              title="Recommended for you"
              description="Roles matched to your skills and preferences"
              action={<ViewAll onClick={() => navigate('/student/jobs')} />}
            >
              {isLoadingJobs ? (
                <div className="grid gap-4">{[0, 1].map(i => <CardSkeleton key={i} />)}</div>
              ) : recommendedJobs.length ? (
                <div className="grid gap-4">
                  {recommendedJobs.map(job => (
                    <JobCard key={job.id} job={job} onApplySuccess={() => showToast('Application submitted.', 'success')} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="work_off"
                  title="No recommendations yet"
                  description="Add your skills and a career goal so we can match you to the right roles from live postings."
                  actionLabel="Complete profile"
                  onAction={() => navigate('/student/profile')}
                />
              )}
            </Section>

            <Section title="Recent activity" description="What's changed across your job search">
              <Card>
                <ActivityFeed items={activity} emptyLabel="Your applications and updates will appear here." />
              </Card>
            </Section>
          </div>

          {/* Secondary column: readiness, next steps, interview */}
          <div className="space-y-8">
            <Card>
              <div className="flex items-center gap-4">
                <ProgressRing value={readiness} size={72} />
                <div className="min-w-0">
                  <h3 className="text-body-md font-semibold text-on-surface">Career readiness</h3>
                  <p className="text-label-sm text-on-surface-variant mt-0.5">Based on your resume, skills and interview practice.</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/career-report')}>View full report</Button>
            </Card>

            {tasks.length > 0 && (
              <Section title="Next steps" description={`${tasks.length} to strengthen your profile`}>
                <TaskList tasks={tasks} />
              </Section>
            )}

            <Card>
              <CardHeader icon="interpreter_mode" title="AI mock interviews" />
              {mockHistory.length === 0 ? (
                <p className="text-label-sm text-on-surface-variant">Practice with the AI interviewer and get a full scored report with a learning roadmap.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-headline-md font-bold text-primary">{mockHistory[0].reports[0].score}<span className="text-label-sm text-on-surface-variant">/100</span></span>
                    <span className="text-label-sm text-on-surface-variant">latest · {mockHistory[0].jobTitle}</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    {mockHistory.length} completed
                    {mockHistory[0].reports[0].interviewReadiness != null ? ` · readiness ${mockHistory[0].reports[0].interviewReadiness}/100` : ''}
                    {` · best ${Math.max(...mockHistory.map(h => h.reports[0].score))}/100`}
                  </p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="primary" className="flex-1" onClick={() => navigate('/student/mock-interview')}>
                  {mockHistory.length === 0 ? 'Start practicing' : 'New session'}
                </Button>
                {mockHistory.length > 0 && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/student/interview-report/${mockHistory[0].id}`)}>Last report</Button>
                )}
              </div>
            </Card>

            {upcomingInterview && (
              <Card>
                <CardHeader icon="event" title="Upcoming interview" />
                <div className="flex items-center gap-3">
                  <img src={upcomingInterview.companyLogo} alt="" className="w-11 h-11 rounded-xl object-contain bg-surface-container p-1.5" />
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-on-surface truncate">{upcomingInterview.jobTitle}</p>
                    <p className="text-label-sm text-on-surface-variant truncate">{upcomingInterview.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge tone="info" icon="schedule">
                    {new Date(upcomingInterview.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                  <Button size="sm" variant="primary" onClick={() => navigate(`/student/interview/${upcomingInterview.id}`)}>Details</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
