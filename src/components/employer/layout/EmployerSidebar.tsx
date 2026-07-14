import React from 'react';

interface EmployerSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jobsCount?: number;
  interviewsCount?: string;
  onPostJobClick: () => void;
  onLogoutClick: () => void;
}

export const EmployerSidebar: React.FC<EmployerSidebarProps> = ({
  activeTab,
  setActiveTab,
  jobsCount,
  interviewsCount = '3',
  onPostJobClick,
  onLogoutClick,
}) => {
  const mainItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'jobs', icon: 'work', label: 'Jobs', count: jobsCount },
    { id: 'candidates', icon: 'group', label: 'Candidates' },
    { id: 'interviews', icon: 'calendar_today', label: 'Interviews', badge: interviewsCount },
    { id: 'messaging', icon: 'chat', label: 'Messaging' },
    { id: 'analytics', icon: 'analytics', label: 'Analytics' },
    { id: 'reports', icon: 'description', label: 'Reports' }
  ];

  const orgItems = [
    { id: 'company', icon: 'corporate_fare', label: 'Company' },
    { id: 'recruiters', icon: 'person_search', label: 'Recruiters' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'settings', icon: 'settings', label: 'Settings' }
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-primary/5 flex flex-col py-8 gap-6 z-40 overflow-y-auto">
      <div className="px-6 mb-4">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">CareerBridge</h1>
        <p className="text-xs text-on-surface-variant font-semibold opacity-70 uppercase tracking-widest mt-1">Employer Portal</p>
      </div>
      <nav className="flex-grow px-4 space-y-1">
        {mainItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === item.id
                ? 'text-primary border-r-4 border-primary bg-secondary-container/40 shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            {item.count !== undefined && (
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.count}
              </span>
            )}
          </button>
        ))}

        <div className="pt-4 pb-2 px-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Organization</p>
        </div>

        {orgItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === item.id
                ? 'text-primary border-r-4 border-primary bg-secondary-container/40 shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </button>
        ))}
      </nav>
      <div className="px-4 pb-6 mt-auto">
        <div className="mb-6 space-y-1 text-left">
          <button
            onClick={() => setActiveTab('help')}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant opacity-70 hover:text-primary hover:opacity-100 font-semibold text-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">help</span> Help Center
          </button>
          <button
            onClick={onLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-error opacity-70 hover:opacity-100 font-semibold text-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span> Log Out
          </button>
        </div>
        <button
          onClick={onPostJobClick}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add</span> Post a New Job
        </button>
      </div>
    </aside>
  );
};
export default EmployerSidebar;
