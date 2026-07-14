import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

export const EmployerNotifications: React.FC = () => {
  const { showToast } = useToast();

  // State for search/filter in Activity Center
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 24 Hours');

  // Interactive state for notifications items
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      priority: 'high',
      type: 'recruitment',
      title: 'Offer Accepted',
      time: '10:42 AM',
      content: (
        <>
          <span className="font-bold text-on-surface underline decoration-primary/20 cursor-pointer">Sarah Jenkins</span> has formally accepted the offer for the <span className="font-bold text-on-surface underline decoration-primary/20 cursor-pointer">Lead UI Developer</span> role.
        </>
      ),
      unread: true,
      categoryLabel: 'Recruitment',
      actions: [
        { label: 'View Contract', toast: 'Opening contract viewer...' },
        { label: 'Notify IT Team', toast: 'IT team notification sent.' }
      ]
    },
    {
      id: 'n2',
      priority: 'med',
      type: 'ai',
      title: 'AI Candidate Matching',
      time: '09:15 AM',
      content: (
        <>
          CareerBridge AI detected 3 new candidates matching the high-priority <span className="font-bold text-on-surface cursor-pointer">Staff Product Designer</span> requisition with &gt;95% confidence score.
        </>
      ),
      unread: true,
      categoryLabel: 'AI Insight',
      actions: [
        { label: 'Review Matches', toast: 'Loading matched candidates...' },
        { label: 'Adjust Parameters', toast: 'Opening parameter editor...' }
      ]
    },
    {
      id: 'n3',
      priority: 'low',
      type: 'interview',
      title: 'Interview Rescheduled',
      time: '08:00 AM',
      content: (
        <>
          <span className="font-bold text-on-surface">Mark Thompson</span> has rescheduled the Stage 2 Technical Interview for <span className="font-bold text-on-surface">Tomorrow at 2:00 PM</span>.
        </>
      ),
      unread: false,
      categoryLabel: 'Interview',
      actions: [
        { label: 'Update Calendar', toast: 'Calendar updated successfully.' },
        { label: 'Send Confirmation', toast: 'Confirmation email queued.' }
      ]
    },
    {
      id: 'n4',
      priority: 'med',
      type: 'message',
      title: 'New Direct Message',
      time: 'Yesterday, 4:50 PM',
      content: (
        <span className="italic">
          "Hi Eleanor, I've sent over the requested portfolio links for the Frontend Architect role. Looking forward to your thoughts!"
        </span>
      ),
      unread: true,
      categoryLabel: 'Message',
      actions: [
        { label: 'Quick Reply', toast: 'Opening quick reply drawer...' },
        { label: 'Open Inbox', toast: 'Navigating to messaging inbox...' }
      ]
    }
  ]);

  // Channel toggles state
  const [preferences, setPreferences] = useState({
    recruitmentAlerts: true,
    interviewReminders: true,
    aiInsights: false
  });

  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(`${key === 'recruitmentAlerts' ? 'Recruitment alerts' : key === 'interviewReminders' ? 'Interview reminders' : 'AI matching insights'} toggled ${updated[key] ? 'ON' : 'OFF'}.`, 'info');
      return updated;
    });
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification dismissed.', 'info');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast('All notifications marked as read.', 'success');
  };

  const handleArchiveAll = () => {
    setNotifications([]);
    showToast('All notifications archived.', 'success');
  };

  // Filter items
  const filteredNotifications = notifications.filter(n => {
    // Search filter
    if (filterText) {
      const text = n.title.toLowerCase() + n.categoryLabel.toLowerCase();
      if (!text.includes(filterText.toLowerCase())) return false;
    }
    // Category filter
    if (selectedCategory !== 'All Categories') {
      if (selectedCategory.toLowerCase() === 'system') return false; // mockup doesn't have system items
      if (n.categoryLabel.toLowerCase() !== selectedCategory.toLowerCase() && 
          !(selectedCategory === 'AI Insights' && n.categoryLabel === 'AI Insight')) {
        return false;
      }
    }
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <div className="p-stack-lg max-w-[1400px] mx-auto w-full text-left animate-slide-up">
      {/* Page Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-lg">
        <div className="space-y-1">
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Activity Center</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Stay informed with real-time updates across recruitment, interviews, hiring activities, and system events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleArchiveAll}
            className="flex items-center px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container transition-all cursor-pointer font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[20px] mr-2">archive</span>
            Archive All
          </button>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container transition-all cursor-pointer font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[20px] mr-2">done_all</span>
            Mark All Read
          </button>
          <button
            onClick={() => showToast('Opening notification preferences...', 'info')}
            className="flex items-center px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md hover:brightness-110 shadow-sm transition-all cursor-pointer font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[20px] mr-2">settings</span>
            Preferences
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-stack-md mb-stack-lg">
        {/* KPI 1 */}
        <div className="bg-surface p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col justify-between h-28">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total</span>
            <h3 className="text-headline-md font-bold text-primary mt-1">1,284</h3>
          </div>
          <div className="flex items-center mt-2 text-primary gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-[10px] font-bold">+12% vs LW</span>
          </div>
        </div>
        {/* KPI 2 */}
        <div className="bg-surface p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col justify-between h-28">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Unread</span>
            <h3 className="text-headline-md font-bold text-error mt-1">{unreadCount}</h3>
          </div>
          <div className="w-full h-2 mt-2">
            <div className="h-1 bg-error/20 w-full rounded-full overflow-hidden">
              <div 
                className="h-full bg-error rounded-full transition-all duration-500" 
                style={{ width: `${notifications.length ? (unreadCount / notifications.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
        {/* KPI 3 */}
        <div className="bg-surface p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col justify-between h-28">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">High Priority</span>
            <h3 className="text-headline-md font-bold text-primary mt-1">{String(highPriorityCount).padStart(2, '0')}</h3>
          </div>
          <span className="text-[10px] py-0.5 px-2 bg-error-container text-on-error-container rounded-full w-fit mt-2 font-bold">Needs Attention</span>
        </div>
        {/* KPI 4 */}
        <div className="bg-surface p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col justify-between h-28">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Interviews</span>
            <h3 className="text-headline-md font-bold text-primary mt-1">15</h3>
          </div>
          <div className="flex items-center mt-2 text-on-tertiary-container gap-1">
            <span className="material-symbols-outlined text-sm text-[#384b42]">event</span>
            <span className="text-[10px] font-bold text-[#384b42]">Today</span>
          </div>
        </div>
        {/* KPI 5 */}
        <div className="bg-surface p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col justify-between h-28">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recruitment</span>
            <h3 className="text-headline-md font-bold text-primary mt-1">86</h3>
          </div>
          <div className="flex items-center mt-2 text-primary gap-1">
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span className="text-[10px] font-bold">3 New Offers</span>
          </div>
        </div>
        {/* KPI 6 */}
        <div className="bg-surface p-4 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col justify-between h-28">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">System</span>
            <h3 className="text-headline-md font-bold text-primary mt-1">02</h3>
          </div>
          <span className="text-[10px] py-0.5 px-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-full w-fit mt-2 font-bold">Status Normal</span>
        </div>
      </div>

      {/* Main Interactive Area */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Filters and Feed (Left/Middle Column) */}
        <div className="col-span-12 lg:col-span-8 space-y-stack-md">
          {/* Search & Filters */}
          <div className="bg-surface p-stack-sm rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">filter_list</span>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2 text-label-md focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                placeholder="Filter by candidate, role or keyword..."
                type="text"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-surface-container-low border-none rounded-lg text-label-md py-2 px-4 focus:ring-1 focus:ring-primary text-on-surface font-semibold outline-none"
              >
                <option>All Categories</option>
                <option>Recruitment</option>
                <option>Interviews</option>
                <option>AI Insights</option>
                <option>System</option>
              </select>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-surface-container-low border-none rounded-lg text-label-md py-2 px-4 focus:ring-1 focus:ring-primary text-on-surface font-semibold outline-none"
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
              <button 
                onClick={() => showToast('Opening advanced settings menu...', 'info')}
                className="bg-surface-container-low hover:bg-surface-container-high p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          </div>

          {/* Notification Feed */}
          <div className="space-y-stack-sm">
            {/* Timeline Section: Today */}
            <div className="flex items-center gap-4 py-2">
              <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1 rounded-full text-xs">Today</span>
              <div className="h-px bg-outline-variant/30 flex-1"></div>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="bg-surface p-12 text-center border border-primary/5 rounded-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-55">notifications_off</span>
                <p className="font-bold text-sm">No notifications match your filters.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`feed-item priority-${n.priority} bg-surface p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex gap-4 relative group transition-all duration-300 ease-out hover:-translate-y-0.5`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    n.type === 'recruitment' ? 'bg-primary-container text-primary-fixed' :
                    n.type === 'ai' ? 'bg-secondary-container text-on-secondary-container' :
                    n.type === 'interview' ? 'bg-[#d2e8db] text-[#0c1f18]' :
                    'bg-primary/5 text-primary'
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {n.type === 'recruitment' ? 'check_circle' :
                       n.type === 'ai' ? 'auto_awesome' :
                       n.type === 'interview' ? 'calendar_today' :
                       'chat_bubble'}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-label-md text-label-md text-primary font-bold">{n.title}</h4>
                      <span className="text-xs text-on-surface-variant">{n.time}</span>
                    </div>
                    <p className="text-body-md text-on-surface-variant text-sm">
                      {n.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                        n.type === 'recruitment' ? 'bg-primary-fixed/30 text-primary' :
                        n.type === 'ai' ? 'bg-secondary-fixed/40 text-on-secondary-container' :
                        n.type === 'interview' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[14px] mr-1">
                          {n.type === 'recruitment' ? 'bolt' :
                           n.type === 'ai' ? 'psychology' :
                           n.type === 'interview' ? 'schedule' :
                           'mail'}
                        </span>
                        {n.categoryLabel}
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {n.actions.map((act, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-outline-variant">|</span>}
                            <button
                              onClick={() => showToast(act.toast, 'success')}
                              className="text-xs font-bold text-primary hover:underline cursor-pointer bg-transparent border-none"
                            >
                              {act.label}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissNotification(n.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 hover:text-error text-on-surface-variant transition-all cursor-pointer bg-transparent border-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panels (Right Column) */}
        <div className="col-span-12 lg:col-span-4 space-y-stack-md">
          {/* AI Notification Assistant */}
          <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl shadow-xl border border-primary-fixed/20 overflow-hidden relative group">
            {/* Abstract Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-all duration-700"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-headline-md text-[20px] font-bold text-white">AI Assistant</h3>
            </div>
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed/70 mb-3">Daily Summary</p>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                  <p className="text-sm leading-relaxed text-white/90">Today's activity peaked at 10 AM. Most notifications related to the <span className="text-primary-fixed font-bold">Project Manager</span> opening.</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-fixed w-[65%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-white/70">65% Processed</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed/70 mb-3">Suggested Priorities</p>
                <ul className="space-y-3">
                  <li 
                    onClick={() => showToast('Opening contract review panel...', 'info')}
                    className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary-fixed mt-0.5">priority_high</span>
                    <div>
                      <p className="text-sm font-bold text-white">Sarah Jenkins Contract</p>
                      <p className="text-[11px] text-white/60">Final signature pending HR review</p>
                      <div className="flex items-center mt-1 text-[10px] text-primary-fixed font-bold">
                        <span className="material-symbols-outlined text-[14px] mr-1">insights</span> 98% Critical
                      </div>
                    </div>
                  </li>
                  <li 
                    onClick={() => showToast('Opening candidate details view...', 'info')}
                    className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary-fixed mt-0.5">mail</span>
                    <div>
                      <p className="text-sm font-bold text-white">Unanswered VP Candidate</p>
                      <p className="text-[11px] text-white/60">Awaiting interview availability</p>
                      <div className="flex items-center mt-1 text-[10px] text-primary-fixed font-bold">
                        <span className="material-symbols-outlined text-[14px] mr-1">insights</span> 84% Urgent
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => showToast('Generating full activity insights report...', 'success')}
                className="w-full py-3 bg-primary-fixed text-primary font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
              >
                Generate Full Report <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Quick Preferences Card */}
          <div className="bg-surface p-6 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-label-md text-label-md text-primary font-bold">Notification Channels</h3>
              <button 
                onClick={() => showToast('Opening notification channel manager...', 'info')}
                className="text-primary text-xs font-bold hover:underline cursor-pointer bg-transparent border-none"
              >
                Manage All
              </button>
            </div>
            <div className="space-y-4">
              {/* Toggle Item 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <span className="text-sm text-on-surface">Recruitment Alerts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={preferences.recruitmentAlerts}
                    onChange={() => handleTogglePreference('recruitmentAlerts')}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {/* Toggle Item 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </div>
                  <span className="text-sm text-on-surface">Interview Reminders</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={preferences.interviewReminders}
                    onChange={() => handleTogglePreference('interviewReminders')}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {/* Toggle Item 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <span className="text-sm text-on-surface">AI Matching Insights</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={preferences.aiInsights}
                    onChange={() => handleTogglePreference('aiInsights')}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-primary/5 flex items-center justify-between text-on-surface-variant text-xs">
              <span>Quiet Hours: <span className="font-bold text-on-surface">8PM - 8AM</span></span>
              <button 
                onClick={() => showToast('Editing quiet hours schedule...', 'info')}
                className="material-symbols-outlined text-[18px] hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              >
                edit
              </button>
            </div>
          </div>

          {/* Upcoming Events Widget */}
          <div className="bg-surface p-6 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
            <h3 className="font-label-md text-label-md text-primary font-bold mb-4">Urgent Today</h3>
            <div className="space-y-4">
              <div 
                onClick={() => showToast('Sarah Jenkins Meeting details loaded.', 'info')}
                className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent hover:border-primary/10"
              >
                <div className="flex flex-col items-center justify-center bg-primary/5 w-12 h-12 rounded-lg text-primary shrink-0">
                  <span className="text-xs font-bold">14:00</span>
                  <span className="text-[10px] opacity-70">PM</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Sarah Jenkins Meeting</p>
                  <p className="text-xs text-on-surface-variant">Onboarding Kickoff</p>
                </div>
              </div>
              <div 
                onClick={() => showToast('Recruitment Sync details loaded.', 'info')}
                className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent hover:border-primary/10"
              >
                <div className="flex flex-col items-center justify-center bg-primary/5 w-12 h-12 rounded-lg text-primary shrink-0">
                  <span className="text-xs font-bold">16:30</span>
                  <span className="text-[10px] opacity-70">PM</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Recruitment Sync</p>
                  <p className="text-xs text-on-surface-variant">Weekly Pipeline Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer controls section */}
      <div className="mt-12 pt-8 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 text-xs text-on-surface-variant">
          <button
            onClick={() => showToast('Opening notification preferences...', 'info')}
            className="hover:text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none font-semibold"
          >
            <span className="material-symbols-outlined text-sm">notifications_active</span> Notification Preferences
          </button>
          <button
            onClick={() => showToast('Exporting activity history...', 'info')}
            className="hover:text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none font-semibold"
          >
            <span className="material-symbols-outlined text-sm">download</span> Export Activity History
          </button>
        </div>

        <button
          onClick={() => showToast('Syncing with Google Calendar...', 'success')}
          className="px-4 py-2 bg-surface-container-low text-primary text-label-sm font-bold rounded-lg border border-primary/10 flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer text-xs"
        >
          <span className="material-symbols-outlined text-sm">sync</span> Sync Calendar
        </button>
      </div>
    </div>
  );
};

export default EmployerNotifications;
