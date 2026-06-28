import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { EmptyState } from '../../components/ui/EmptyState';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();

  // Active filter state
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // Local states for custom interactions
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  // Pending Tasks states
  const [tasks, setTasks] = useState([
    { id: 'task_1', title: 'Update project links', due: 'Due Today', detail: 'Est. time: 15m • Google', completed: false },
    { id: 'task_2', title: 'Review Mock Feedback', due: 'Due Tomorrow', detail: 'Est. time: 45m • CareerBridge AI', completed: false },
    { id: 'task_3', title: 'OpenAI Assessment', due: 'This Week', detail: 'Est. time: 20m • OpenAI', completed: false }
  ]);

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleMarkAll = () => {
    markAllAsRead();
  };

  const handleArchive = (id: string) => {
    setArchivedIds(prev => [...prev, id]);
  };

  const handleToggleStar = (id: string) => {
    setStarredIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleComplete = (id: string) => {
    setCompletedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filter Pipeline
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => {
        // Handle filter selection
        if (activeFilter === 'Archived') {
          return archivedIds.includes(n.id);
        }
        // Otherwise ignore archived
        if (archivedIds.includes(n.id)) return false;

        if (activeFilter === 'All') return true;
        if (activeFilter === 'Unread') return !n.isRead;
        if (activeFilter === 'Important') return starredIds.includes(n.id) || n.isImportant;
        if (activeFilter === 'Completed') return completedIds.includes(n.id) || n.isCompleted;
        if (activeFilter === 'Applications') return n.type === 'resume';
        if (activeFilter === 'Interviews') return n.type === 'interview';
        if (activeFilter === 'AI') return n.type === 'ai';
        if (activeFilter === 'Network') return n.type === 'network';
        if (activeFilter === 'Recruiters') return n.category === 'network';
        if (activeFilter === 'Mentors') return n.category === 'interview';
        return true;
      });
  }, [notifications, activeFilter, archivedIds, starredIds, completedIds]);

  // Grouped by timeline headers
  const todayNotifications = useMemo(() => {
    return filteredNotifications.filter(n => n.time.includes('ago') || n.time.includes('Today'));
  }, [filteredNotifications]);

  const yesterdayNotifications = useMemo(() => {
    return filteredNotifications.filter(n => n.time.includes('Yesterday'));
  }, [filteredNotifications]);

  const earlierNotifications = useMemo(() => {
    return filteredNotifications.filter(n => !n.time.includes('ago') && !n.time.includes('Today') && !n.time.includes('Yesterday'));
  }, [filteredNotifications]);

  const filters = [
    'All', 'Applications', 'Interviews', 'Jobs', 'AI', 'Network', 'Unread', 'Important', 'Completed', 'Archived', 'Recruiters', 'Mentors'
  ];

  // Dynamic counts
  const totalUnread = notifications.filter(n => !n.isRead && !archivedIds.includes(n.id)).length;
  const totalApps = notifications.filter(n => n.type === 'resume' && !archivedIds.includes(n.id)).length;
  const totalInterviews = notifications.filter(n => n.type === 'interview' && !archivedIds.includes(n.id)).length;
  const totalAI = notifications.filter(n => n.type === 'ai' && !archivedIds.includes(n.id)).length;
  const totalMessages = notifications.filter(n => n.type === 'message' && !archivedIds.includes(n.id)).length;

  const incompleteTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <PageLayout fullWidth>
      <main className="px-margin-desktop py-12 text-left bg-[#f9faf7] min-h-screen">
        <div className="max-w-container-max mx-auto space-y-stack-lg">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter">
            <div>
              <h2 className="text-headline-lg font-headline-lg text-primary tracking-tight">Notifications</h2>
              <p className="text-body-md text-on-surface-variant max-w-2xl mt-2">
                Stay updated with your applications, interviews, AI recommendations and networking activity.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleMarkAll}
                className="flex items-center gap-2 px-4 py-2 text-label-md font-label-md text-primary hover:bg-surface-container-low rounded-lg transition-colors border border-primary/10 cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Mark All Read
              </button>
              <button 
                onClick={() => navigate('/student/settings')}
                className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors border border-primary/10 cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>

          {/* Summary Chips */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-stack-md">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center rounded-lg text-primary">
                  <span className="material-symbols-outlined text-sm">mark_email_unread</span>
                </div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Unread</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-headline-md font-bold text-primary">{totalUnread}</p>
                <span className="text-[10px] text-error font-bold flex items-center gap-0.5">
                  ↑ +2 <span className="material-symbols-outlined text-[10px]">trending_up</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary-container/30 flex items-center justify-center rounded-lg text-secondary">
                  <span className="material-symbols-outlined text-sm">assignment</span>
                </div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Apps</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-headline-md font-bold text-primary">{totalApps}</p>
                <span className="text-[10px] text-primary-container font-bold flex items-center gap-0.5">
                  ↑ +1 <span className="material-symbols-outlined text-[10px]">trending_up</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-tertiary-fixed/30 flex items-center justify-center rounded-lg text-tertiary-fixed-dim">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                </div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Interviews</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-headline-md font-bold text-primary">{totalInterviews}</p>
                <span className="text-[10px] text-on-surface-variant/60">0 change</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-fixed/30 flex items-center justify-center rounded-lg text-on-primary-fixed-variant">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">AI Insights</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-headline-md font-bold text-primary">{totalAI}</p>
                <span className="text-[10px] text-primary-container font-bold flex items-center gap-0.5">
                  ↑ +3 <span className="material-symbols-outlined text-[10px]">trending_up</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center rounded-lg text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Messages</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-headline-md font-bold text-primary">{totalMessages}</p>
                <span className="text-[10px] text-primary-container font-bold flex items-center gap-0.5">
                  ↑ +1 <span className="material-symbols-outlined text-[10px]">trending_up</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bento Layout Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Center Column: Notifications List */}
            <div className="col-span-12 lg:col-span-8 space-y-stack-lg">
              
              {/* Filters list */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                {filters.map((filterName) => {
                  const isActive = activeFilter === filterName;
                  return (
                    <button
                      key={filterName}
                      onClick={() => setActiveFilter(filterName)}
                      className={`px-5 py-2 rounded-full text-label-md font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white border-transparent'
                          : 'bg-white text-on-surface-variant hover:bg-surface-container-low border-primary/5'
                      }`}
                    >
                      {filterName}
                    </button>
                  );
                })}
              </div>

              {/* Listings by group */}
              {filteredNotifications.length === 0 ? (
                <EmptyState 
                  icon="notifications_off"
                  title="No notifications"
                  description="No matches found for your current filter."
                />
              ) : (
                <div className="space-y-8">
                  {/* Today Group */}
                  {todayNotifications.length > 0 && (
                    <div>
                      <h3 className="text-label-md font-bold text-primary/40 uppercase tracking-widest mb-stack-md flex items-center">
                        Today
                        <span className="ml-4 h-px flex-1 bg-primary/5" />
                      </h3>
                      <div className="space-y-stack-sm">
                        {todayNotifications.map(n => renderNotificationItem(n))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday Group */}
                  {yesterdayNotifications.length > 0 && (
                    <div>
                      <h3 className="text-label-md font-bold text-primary/40 uppercase tracking-widest mb-stack-md flex items-center">
                        Yesterday
                        <span className="ml-4 h-px flex-1 bg-primary/5" />
                      </h3>
                      <div className="space-y-stack-sm">
                        {yesterdayNotifications.map(n => renderNotificationItem(n))}
                      </div>
                    </div>
                  )}

                  {/* Earlier Group */}
                  {earlierNotifications.length > 0 && (
                    <div>
                      <h3 className="text-label-md font-bold text-primary/40 uppercase tracking-widest mb-stack-md flex items-center">
                        Earlier
                        <span className="ml-4 h-px flex-1 bg-primary/5" />
                      </h3>
                      <div className="space-y-stack-sm">
                        {earlierNotifications.map(n => renderNotificationItem(n))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar Column */}
            <div className="col-span-12 lg:col-span-4 space-y-gutter">
              
              {/* Today's AI Wins */}
              <div className="bg-primary-container p-6 rounded-2xl text-white relative overflow-hidden shadow-xl">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed/10 rounded-full blur-3xl" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-fixed">auto_awesome</span>
                    <h4 className="text-label-md font-bold uppercase tracking-widest text-primary-fixed">Today's AI Wins</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
                      <div className="flex justify-between items-start">
                        <p className="text-headline-md font-bold text-white">+6%</p>
                        <span className="text-[10px] bg-primary-fixed text-primary px-1.5 py-0.5 rounded font-bold uppercase">Resume</span>
                      </div>
                      <p className="text-label-sm text-primary-fixed/80 mt-1">Strength Score Change</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
                      <div className="flex justify-between items-start">
                        <p className="text-headline-md font-bold text-white">82%</p>
                        <span className="text-[10px] bg-primary-fixed text-primary px-1.5 py-0.5 rounded font-bold uppercase">Readiness</span>
                      </div>
                      <p className="text-label-sm text-primary-fixed/80 mt-1">Career Readiness Score</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
                      <div className="flex items-center justify-between">
                        <p className="text-headline-md font-bold text-white">3 New</p>
                        <span className="material-symbols-outlined text-primary-fixed text-sm">trending_up</span>
                      </div>
                      <p className="text-label-sm text-primary-fixed/80 mt-1">High-Probability Job Matches</p>
                    </div>

                    <div className="bg-primary/30 p-4 rounded-xl border border-primary-fixed/20">
                      <p className="text-label-sm font-bold text-primary-fixed mb-1">Learning Recommendation</p>
                      <p className="text-xs text-white/90 mb-2">Complete 'System Design for AI' to boost match rate.</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary-fixed">Est. Improvement:</span>
                        <span className="text-[10px] font-bold text-white">+12%</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/student/career-insights')}
                    className="w-full py-3 bg-primary-fixed text-primary font-bold rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    Explore Insights
                  </button>
                </div>
              </div>

              {/* Upcoming Interviews */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <h4 className="text-label-md font-bold text-primary uppercase tracking-widest mb-6">Upcoming Interviews</h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-surface-container-low dark:bg-surface-container rounded-xl border border-primary/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-primary/5 font-bold text-primary text-xs shrink-0">
                          NV
                        </div>
                        <div>
                          <p className="text-body-md font-bold text-primary dark:text-primary-fixed-dim">NVIDIA</p>
                          <p className="text-xs text-on-surface-variant">Technical Interview</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-error animate-pulse">Starts in 15m</p>
                        <p className="text-xs text-on-surface-variant">10:00 AM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">Readiness:</span>
                        <span className="text-xs font-bold text-primary-container">92%</span>
                      </div>
                      <Link className="text-xs text-primary hover:underline font-bold" to="/student/interview/int_1">Prep Checklist</Link>
                    </div>
                    <button 
                      onClick={() => navigate('/student/interview/int_1')}
                      className="w-full py-2 bg-primary text-white rounded-lg text-label-md font-bold cursor-pointer"
                    >
                      Join Meeting
                    </button>
                  </div>

                  <div className="p-4 bg-surface-container-low dark:bg-surface-container rounded-xl border border-primary/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-primary/5 font-bold text-primary text-xs shrink-0">
                          DM
                        </div>
                        <div>
                          <p className="text-body-md font-bold text-primary dark:text-primary-fixed-dim">DeepMind</p>
                          <p className="text-xs text-on-surface-variant">Cultural Fit Round</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant">Oct 17</p>
                        <p className="text-xs text-on-surface-variant">2:30 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">Readiness:</span>
                        <span className="text-xs font-bold text-secondary">78%</span>
                      </div>
                      <Link className="text-xs text-primary hover:underline font-bold" to="/student/interview/int_1">Prep Checklist</Link>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/student/dashboard')}
                  className="w-full mt-8 py-2 text-label-md font-bold text-primary hover:underline flex items-center justify-center gap-2 cursor-pointer bg-transparent border-none"
                >
                  View Calendar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* Pending Tasks */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-label-md font-bold text-primary uppercase tracking-widest">Pending Tasks</h4>
                  <span className="w-6 h-6 bg-error/10 text-error text-xs flex items-center justify-center rounded-full font-bold">
                    {incompleteTasksCount}
                  </span>
                </div>

                <ul className="space-y-4">
                  {tasks.map(task => (
                    <li key={task.id} className="flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-5 h-5 border-2 rounded-md mt-0.5 transition-colors shrink-0 flex items-center justify-center cursor-pointer ${
                            task.completed ? 'bg-primary border-primary text-white' : 'border-primary/20 hover:border-primary'
                          }`}
                        >
                          {task.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <span className={`text-body-md text-on-surface truncate ${task.completed ? 'line-through opacity-50' : ''}`}>
                              {task.title}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase shrink-0 ${
                              task.due === 'Due Today' ? 'bg-error/10 text-error' :
                              task.due === 'Due Tomorrow' ? 'bg-secondary-container/40 text-secondary' :
                              'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {task.due}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant/60">{task.detail}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Career Event */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 overflow-hidden group">
                <div className="h-32 -mx-6 -mt-6 mb-4 relative overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAay2bI53s3YVtZTX184CV-znKidv9pfhuGCy95XbXL21YSzenkJExrStcZSjmpoOWnpfGibROsIPEcpkEB2xlVKJFKLxAYdRtOgTK7c-Qy8YITBw_OiiCafWxmc_4v7l3mdOZogJLZgDfkXJ4KY6piBugELiL76E9WyrIRONJzqVugmFpYCErDiHBJUi9XOAc8zGQh9YqixYuFz95mZ_TjKeJ2pvPNyMhd11-Z__Gyjjh_E6yVwvbC5T3Jb6-6AbGH70ffH52sIm0" 
                    alt="Silicon Valley Career Fair"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-primary-container text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Upcoming Event</span>
                </div>
                <h5 className="text-body-md font-bold text-primary">Silicon Valley Career Fair</h5>
                <p className="text-label-sm text-on-surface-variant mt-1">Oct 25 • San Jose / Virtual</p>
                
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-error">12 Seats Left</span>
                    <span className="text-on-surface-variant">Deadline: Oct 20</span>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] text-on-surface-variant">Speakers:</span>
                    <div className="flex -space-x-2">
                      <div className="w-5 h-5 rounded-full bg-primary-fixed border border-white" />
                      <div className="w-5 h-5 rounded-full bg-secondary-fixed border border-white" />
                      <div className="w-5 h-5 rounded-full bg-tertiary-fixed border border-white" />
                    </div>
                    <span className="text-[10px] text-on-surface-variant ml-1">+4 more</span>
                  </div>
                </div>

                <button 
                  onClick={() => showToast('Registered for Silicon Valley Career Fair!', 'success')}
                  className="w-full mt-4 py-2 bg-primary text-white text-label-md font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer"
                >
                  Register Now
                </button>
              </div>

            </div>

          </div>

          {/* Footer controls section */}
          <div className="mt-12 pt-8 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/student/settings')}
                className="text-label-sm text-on-surface-variant hover:text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-sm">notifications_active</span> Notification Preferences
              </button>
              <button 
                onClick={() => showToast('Exporting notification history activity...', 'info')}
                className="text-label-sm text-on-surface-variant hover:text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-sm">download</span> Export Activity History
              </button>
            </div>
            
            <button 
              onClick={() => showToast('Google calendar synchronization completed!', 'success')}
              className="px-4 py-2 bg-surface-container-low text-primary text-label-sm font-bold rounded-lg border border-primary/10 flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">sync</span> Sync Calendar
            </button>
          </div>

        </div>
      </main>
    </PageLayout>
  );

  // Helper renderer for notification items
  function renderNotificationItem(n: any) {
    const isStarred = starredIds.includes(n.id) || n.isImportant;
    const isCompleted = completedIds.includes(n.id) || n.isCompleted;

    const typeConfig = {
      interview: { icon: 'calendar_today', bg: 'bg-error-container/20 text-error', border: 'border-l-error' },
      ai: { icon: 'auto_awesome', bg: 'bg-primary-fixed/20 text-on-primary-fixed-variant', border: 'border-l-primary' },
      resume: { icon: 'analytics', bg: 'bg-secondary-container/40 text-secondary', border: 'border-l-secondary' },
      network: { icon: 'person_add', bg: 'bg-tertiary-fixed/30 text-tertiary-fixed-dim', border: 'border-l-outline-variant' },
      message: { icon: 'chat', bg: 'bg-surface-container-high text-on-surface-variant', border: 'border-l-primary' }
    }[n.type as 'interview' | 'ai' | 'resume' | 'network' | 'message'] || { icon: 'auto_awesome', bg: 'bg-primary-fixed/20 text-on-primary-fixed-variant', border: 'border-l-primary' };

    return (
      <div
        key={n.id}
        onClick={async () => {
          if (!n.isRead) await markAsRead(n.id);
        }}
        className="notification-item bg-white p-5 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex gap-4 group cursor-pointer relative overflow-hidden"
      >
        {/* Left Side Status indicators */}
        {!n.isRead && <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeConfig.border.replace('border-l-', 'bg-')}`} />}
        
        {/* Category Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {typeConfig.icon}
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-body-md font-bold text-primary truncate">
                {n.title}
              </h4>
              {isStarred && (
                <span className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded uppercase">
                  Priority
                </span>
              )}
            </div>
            <span className="text-label-sm text-on-surface-variant/60 shrink-0">{n.time}</span>
          </div>

          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {n.content}
          </p>

          {/* Action buttons zone */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {n.action && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(n.id);
                    navigate(n.action.link);
                  }}
                  className="px-4 py-2 bg-primary text-white text-label-md font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  {n.action.label}
                </button>
              )}
              
              {n.type === 'interview' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('Rescheduling request sent to recruiter.', 'info');
                  }}
                  className="px-4 py-2 bg-surface-container-low text-primary text-label-md font-bold rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer border-none"
                >
                  Reschedule
                </button>
              )}

              {n.type === 'network' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('Connection ignore settings updated.', 'info');
                  }}
                  className="px-4 py-2 text-on-surface-variant text-label-md font-bold hover:underline cursor-pointer bg-transparent border-none"
                >
                  Ignore
                </button>
              )}

              {!n.isRead && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await markAsRead(n.id);
                  }}
                  className="px-4 py-2 text-on-surface-variant text-label-md font-bold hover:underline cursor-pointer bg-transparent border-none"
                >
                  Mark Read
                </button>
              )}
            </div>

            {/* Quick Action Stars / Archives slide-in hover controls */}
            <div className="flex items-center gap-1 opacity-0 translate-x-[10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStar(n.id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
                  isStarred ? 'text-orange-500' : 'text-on-surface-variant/50'
                }`}
                title="Star alert"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isStarred ? "'FILL' 1" : undefined }}>
                  star
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleComplete(n.id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
                  isCompleted ? 'text-green-600' : 'text-on-surface-variant/50'
                }`}
                title="Mark complete"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : undefined }}>
                  check_circle
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive(n.id);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/50 hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                title="Archive alert"
              >
                <span className="material-symbols-outlined text-[18px]">
                  archive
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }
};

export default Notifications;
