import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface NotificationItem {
  id: string;
  category: 'Placement' | 'Campus Drive' | 'AI Insight' | 'Verification' | 'System';
  priority: 'High' | 'Normal';
  timeStr: string;
  title: string;
  content: string;
  deptStr: string;
  read: boolean;
  actionText?: string;
  secondaryActionText?: string;
}

export const NotificationsCenter: React.FC = () => {
  const { showToast } = useToast();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'high' | 'students' | 'recruiters' | 'ai' | 'system'>('all');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  // Notifications Feed Database
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      category: 'Placement',
      priority: 'High',
      timeStr: '2 mins ago',
      title: 'Offer Accepted: Microsoft SDE Role',
      content: 'Student Sarah Jenkins (CSE) has accepted the offer from Microsoft. Document verification is pending for final approval.',
      deptStr: 'Dept: CSE',
      read: false,
      actionText: 'Approve Details',
      secondaryActionText: 'Archive'
    },
    {
      id: '2',
      category: 'Campus Drive',
      priority: 'Normal',
      timeStr: '45 mins ago',
      title: 'New Drive: Amazon Systems Analyst',
      content: 'Amazon recruitment for the Systems Analyst profile is now live. Registrations are open for 2024 passing out batch students.',
      deptStr: 'Dept: All Engineering',
      read: false,
      actionText: 'View Details',
      secondaryActionText: 'Mark Read'
    },
    {
      id: '3',
      category: 'AI Insight',
      priority: 'Normal',
      timeStr: '2 hours ago',
      title: 'Skill Gap Alert: Cloud Architecture',
      content: 'CareerBridge AI has identified a 15% drop in cloud certification readiness compared to target recruitment goals for Google and AWS drives.',
      deptStr: 'Focus: IT / Cloud Computing',
      read: false,
      actionText: 'View Recommendations'
    },
    {
      id: '4',
      category: 'Verification',
      priority: 'Normal',
      timeStr: 'Yesterday',
      title: 'Academic Verification Pending',
      content: '12 students from Mechanical Engineering have uploaded new semester marks that require your verification before they can apply for the Tesla drive.',
      deptStr: 'Count: 12 Students',
      read: true,
      actionText: 'Verify Now'
    },
    {
      id: '5',
      category: 'System',
      priority: 'High',
      timeStr: '2 days ago',
      title: 'Vite Development Server Maintenance',
      content: 'Accreditation database structures sync has been scheduled. No downtime is expected during standard college hours.',
      deptStr: 'Focus: Portal Sync',
      read: true
    }
  ]);

  // Actions
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read.', 'success');
  };

  const handleAction = (item: NotificationItem) => {
    showToast(`Triggered: ${item.actionText} for "${item.title}"`, 'success');
    // Mark as read when action is taken
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
  };

  const handleSecondaryAction = (item: NotificationItem, actionType: string) => {
    if (actionType === 'Archive') {
      setNotifications(prev => prev.filter(n => n.id !== item.id));
      showToast('Notification archived.', 'info');
    } else {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      showToast('Notification marked as read.', 'info');
    }
  };

  const handleBroadcast = () => {
    showToast('Opening notification broadcast form...', 'info');
  };

  // Filters logic
  const filteredFeed = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'high') return n.priority === 'High';
    if (activeFilter === 'students') return n.category === 'Placement' || n.category === 'Verification';
    if (activeFilter === 'ai') return n.category === 'AI Insight';
    if (activeFilter === 'system') return n.category === 'System';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'High').length;

  return (
    <div className="w-full text-left relative">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Notifications Center</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Monitor placement updates, student activities, recruiter communications, and campus alerts.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={() => showToast('Opening notification archives...', 'info')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-colors cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-[18px]">archive</span>
            Archive
          </button>
          
          <button 
            onClick={() => showToast('Exporting notification activity logs...', 'success')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-colors cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark All Read
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-stack-lg text-left">
        {/* KPI Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Total</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-primary">2,140</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            +12%
          </div>
        </div>

        {/* KPI Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Unread</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-on-surface">{unreadCount}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-error font-bold">
            <span className="material-symbols-outlined text-[12px]">notification_important</span>
            Urgent
          </div>
        </div>

        {/* KPI Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">High Priority</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-error">{highPriorityCount}</span>
          </div>
          <div className="w-full bg-red-100 h-1 rounded-full overflow-hidden mt-1.5">
            <div className="bg-error h-full rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* KPI Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Student</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-on-surface">850</span>
          </div>
          <p className="text-[10px] text-outline font-semibold">Since yesterday</p>
        </div>

        {/* KPI Card 5 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Company</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-on-surface">312</span>
          </div>
          <p className="text-[10px] text-outline font-semibold">Verified partners</p>
        </div>

        {/* KPI Card 6 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Drive</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-on-surface">184</span>
          </div>
          <p className="text-[10px] text-primary font-bold">Active</p>
        </div>

        {/* KPI Card 7 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Placement</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-on-surface">542</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            94% rate
          </div>
        </div>

        {/* KPI Card 8 */}
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">System</p>
          <div className="my-1 flex items-baseline">
            <span className="text-2xl font-black text-on-surface">28</span>
          </div>
          <p className="text-[10px] text-outline font-semibold">Maintenance</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-gutter text-xs font-semibold">
        {/* Left Column: Filters & Feed */}
        <div className="flex-1 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-2 rounded-xl border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 font-bold text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors border-none ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-transparent text-on-surface-variant hover:bg-surface-container'}`}
              >
                All
              </button>
              
              <button 
                onClick={() => setActiveFilter('unread')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors border-none ${activeFilter === 'unread' ? 'bg-primary text-white' : 'bg-transparent text-on-surface-variant hover:bg-surface-container'}`}
              >
                Unread ({unreadCount})
              </button>
              
              <button 
                onClick={() => setActiveFilter('high')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors border-none ${activeFilter === 'high' ? 'bg-primary text-white' : 'bg-transparent text-on-surface-variant hover:bg-surface-container'}`}
              >
                High Priority
              </button>

              <button 
                onClick={() => setActiveFilter('students')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors border-none ${activeFilter === 'students' ? 'bg-primary text-white' : 'bg-transparent text-on-surface-variant hover:bg-surface-container'}`}
              >
                Students
              </button>

              <button 
                onClick={() => setActiveFilter('ai')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors border-none flex items-center gap-1 ${activeFilter === 'ai' ? 'bg-primary text-white' : 'bg-transparent text-on-surface-variant hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span> AI
              </button>

              <button 
                onClick={() => setActiveFilter('system')}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors border-none ${activeFilter === 'system' ? 'bg-primary text-white' : 'bg-transparent text-on-surface-variant hover:bg-surface-container'}`}
              >
                System
              </button>
            </div>

            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4 text-xs font-bold">
              <span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
              <select 
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value);
                  showToast(`Showing notifications for: ${e.target.value}`, 'info');
                }}
                className="bg-transparent border-none focus:ring-0 text-on-surface-variant cursor-pointer font-bold outline-none"
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Feed Timeline */}
          <div className="space-y-4 text-left">
            <h3 className="text-[10px] text-outline font-extrabold uppercase tracking-widest px-2">Today, Oct 24</h3>
            
            {filteredFeed.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-outline-variant/10 text-center italic text-on-surface-variant">
                No active notifications found matching this filter query.
              </div>
            ) : (
              filteredFeed.map((item) => (
                <div 
                  key={item.id}
                  className={`bg-white p-5 rounded-2xl border flex gap-4 hover:shadow-md transition-shadow cursor-pointer ${
                    !item.read ? 'border-l-4 border-l-primary border-primary/5' : 'border-outline-variant/20 opacity-80'
                  }`}
                >
                  <div className="shrink-0 font-bold">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.category === 'Placement'
                        ? 'bg-primary-container text-white'
                        : item.category === 'Campus Drive'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : item.category === 'AI Insight'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-[24px]">
                        {item.category === 'Placement' && 'check_circle'}
                        {item.category === 'Campus Drive' && 'apartment'}
                        {item.category === 'AI Insight' && 'auto_awesome'}
                        {item.category === 'Verification' && 'person_search'}
                        {item.category === 'System' && 'settings'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider bg-surface-container text-on-surface-variant">
                          {item.category}
                        </span>
                        
                        {item.priority === 'High' && (
                          <span className="px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black uppercase bg-red-50 text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            High Priority
                          </span>
                        )}
                        
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-outline shrink-0 font-medium font-sans">{item.timeStr}</span>
                    </div>

                    <h4 className="font-bold text-on-surface text-sm leading-snug">{item.title}</h4>
                    <p className="text-on-surface-variant font-medium text-xs mt-1 leading-relaxed">{item.content}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-4 font-bold">
                      {item.actionText && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item);
                          }}
                          className="bg-primary text-on-primary px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity border-none cursor-pointer font-bold text-xs"
                        >
                          {item.actionText}
                        </button>
                      )}

                      {item.secondaryActionText && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSecondaryAction(item, item.secondaryActionText || 'Mark Read');
                          }}
                          className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none font-bold text-xs"
                        >
                          {item.secondaryActionText}
                        </button>
                      )}

                      <span className="text-outline text-[11px] font-bold font-sans">{item.deptStr}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Context Alerts */}
        <div className="w-full lg:w-80 space-y-gutter text-left shrink-0">
          
          {/* CareerBridge Intelligence Panel */}
          <section className="bg-primary-container text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl text-white">bolt</span>
            </div>
            
            <h3 className="font-bold text-secondary-fixed flex items-center gap-2 mb-4 uppercase tracking-wider text-xs">
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              CareerBridge Intelligence
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/10 p-3 rounded-xl text-xs font-semibold">
                <p className="text-primary-fixed font-bold">Placement Forecast</p>
                <p className="text-xl font-black text-white mt-0.5">92% <span className="text-[10px] font-normal text-white/60">Target: 95%</span></p>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
                  <div className="bg-primary-fixed w-[92%] h-full rounded-full"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl text-xs font-semibold">
                <div>
                  <p className="text-primary-fixed font-bold">Students At Risk</p>
                  <p className="text-base font-black text-white mt-0.5">24 <span className="text-[10px] font-normal">Profiles</span></p>
                </div>
                <span className="material-symbols-outlined text-error">error_outline</span>
              </div>
              
              <div className="p-1">
                <p className="text-white/80 italic font-medium leading-relaxed">
                  "Placement drive for ECE students is peaking this week. Recommend final verification for 15 pending profiles."
                </p>
              </div>
            </div>
          </section>

          {/* University Announcements */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-bold text-primary uppercase tracking-wider text-xs mb-4">Announcements</h3>
            
            <div className="space-y-4">
              <div className="border-b border-outline-variant/30 pb-3">
                <span className="text-[9px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-black uppercase">CIRCULAR</span>
                <p className="font-bold text-primary mt-1 text-xs leading-snug">Holiday for Graduation Day</p>
                <p className="text-[10px] text-outline font-medium leading-relaxed mt-0.5">The university will remain closed on Oct 30th for the 25th Convocation...</p>
              </div>
              
              <div className="border-b border-outline-variant/30 pb-3">
                <span className="text-[9px] bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded font-black uppercase">PLACEMENT OFFICE</span>
                <p className="font-bold text-primary mt-1 text-xs leading-snug">Mock Interview Schedule</p>
                <p className="text-[10px] text-outline font-medium leading-relaxed mt-0.5">Detailed schedule for the TCS mock interview series has been shared...</p>
              </div>
            </div>
            
            <button 
              onClick={() => showToast('Opening complete archives of circular notifications...', 'info')}
              className="w-full text-center mt-4 text-primary font-bold hover:underline cursor-pointer bg-transparent border-none text-xs"
            >
              View All Circulars
            </button>
          </section>

          {/* Upcoming Events & Drives */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-bold text-primary uppercase tracking-wider text-xs mb-4">Upcoming Drives</h3>
            
            <div className="space-y-4 font-semibold text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center font-bold text-outline text-[10px] leading-tight text-center font-sans shrink-0">
                  OCT<br/>26
                </div>
                <div>
                  <p className="font-bold text-primary leading-none">Google SDE-1</p>
                  <p className="text-[10px] text-outline font-medium mt-1">Phase 1: Online Assessment</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center font-bold text-outline text-[10px] leading-tight text-center font-sans shrink-0">
                  OCT<br/>28
                </div>
                <div>
                  <p className="font-bold text-primary leading-none">JPMC CFG '24</p>
                  <p className="text-[10px] text-outline font-medium mt-1">Pre-placement Talk at Hall 4</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center font-bold text-outline text-[10px] leading-tight text-center font-sans shrink-0">
                  NOV<br/>02
                </div>
                <div>
                  <p className="font-bold text-primary leading-none">Deloitte USI</p>
                  <p className="text-[10px] text-outline font-medium mt-1">Campus Interview Rounds</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Statistics */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm font-semibold text-xs text-on-surface-variant">
            <h3 className="font-bold text-primary uppercase tracking-wider text-xs mb-4">Quick Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Avg. Time to Read</span>
                <span className="font-bold text-primary">14 mins</span>
              </div>
              <div className="flex justify-between">
                <span>Alert Response Rate</span>
                <span className="font-bold text-primary">82%</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile Push Reach</span>
                <span className="font-bold text-primary">96%</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={handleBroadcast}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-none cursor-pointer group z-50"
      >
        <span className="material-symbols-outlined text-[32px] text-white">add</span>
        <div className="absolute right-16 px-4 py-2 bg-inverse-surface text-inverse-on-surface rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap font-bold text-xs">
          Broadcast Announcement
        </div>
      </button>
    </div>
  );
};

export default NotificationsCenter;
