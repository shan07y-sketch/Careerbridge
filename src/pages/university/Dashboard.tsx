import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StudentManagement } from '../../components/university/StudentManagement';
import { StudentProfile } from '../../components/university/StudentProfile';
import { CampusDrives } from '../../components/university/CampusDrives';
import { CompaniesManagement } from '../../components/university/CompaniesManagement';
import { PlacementAnalytics } from '../../components/university/PlacementAnalytics';
import { MessagingCenter } from '../../components/university/MessagingCenter';
import { ReportsCenter } from '../../components/university/ReportsCenter';
import { NotificationsCenter } from '../../components/university/NotificationsCenter';
import { UniversitySettings } from '../../components/university/UniversitySettings';
import { PostCampusDrive } from '../../components/university/PostCampusDrive';
import { UniversityHelpCenter } from '../../components/university/UniversityHelpCenter';

export const UniversityDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Active Tab state
  const [activeSidebarTab, setActiveSidebarTab] = useState<'dashboard' | 'drives' | 'companies' | 'students' | 'analytics' | 'reports' | 'messages' | 'notifications' | 'settings' | 'post_drive' | 'help'>('dashboard');

  // Selected Student Profile
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Clear student profile selection when tab changes
  React.useEffect(() => {
    setSelectedStudentId(null);
  }, [activeSidebarTab]);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown option
  const [selectedDept, setSelectedDept] = useState('All Departments');

  // State for mock upcoming drives
  const [drives, setDrives] = useState([
    { id: '1', company: 'Google Cloud', logo: 'G', tier: 'Tier 1 Partner', role: 'SDE I', depts: 'Computer Science, IT', registered: '1,240 / 3,000', date: 'Oct 12, 2026', package: '$145k', status: 'Scheduled', statusColor: 'bg-green-100 text-green-700' },
    { id: '2', company: 'JP Morgan Chase', logo: 'JPMC', tier: 'Banking & Finance', role: 'Analyst', depts: 'MBA, Fin Engineering', registered: '450 / 800', date: 'Oct 15, 2026', package: '$95k', status: 'Open', statusColor: 'bg-yellow-100 text-yellow-700' }
  ]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out of University Portal.', 'info');
      navigate('/');
    } catch (err) {
      showToast('Failed to log out.', 'error');
    }
  };

  const handlePostDrive = () => {
    setActiveSidebarTab('post_drive');
    showToast('Opening "Post New Drive" editor...', 'info');
  };

  const handleExport = () => {
    showToast('Preparing Placement Performance Report export...', 'success');
  };

  const handleTriggerAutoCounseling = () => {
    showToast('Auto-counseling campaign triggered for at-risk students.', 'success');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      showToast(`Searching portal for "${searchQuery}"...`, 'info');
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col border-r border-primary/5 bg-surface dark:bg-surface-container-low z-50">
        <div className="flex flex-col h-full py-stack-lg px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <div className="text-left">
                <h1 className="font-headline-md text-sm font-bold text-primary truncate w-36">Global University</h1>
                <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Placement Portal</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 text-left">
            <button
              onClick={() => setActiveSidebarTab('dashboard')}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'dashboard'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeSidebarTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => {
                setActiveSidebarTab('drives');
                showToast('Campus Drives panel loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'drives'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined">event_available</span>
              <span>Campus Drives</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('companies');
                showToast('Partner Companies panel loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'companies'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined">business</span>
              <span>Companies</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('students');
                showToast('Students Registry panel loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'students'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined">school</span>
              <span>Students</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('analytics');
                showToast('Placement Analytics panel loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'analytics'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined">analytics</span>
              <span>Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('reports');
                showToast('Exportable Reports panel loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'reports'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined">description</span>
              <span>Reports</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('messages');
                showToast('Messaging Center loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'messages'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined">forum</span>
              <span>Messages</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('notifications');
                showToast('Notifications Center loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'notifications'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeSidebarTab === 'notifications' ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
              <span>Notifications</span>
            </button>
          </nav>

          <button 
            onClick={handlePostDrive}
            className="mt-8 w-full py-3 px-4 bg-primary text-on-primary rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Post New Drive
          </button>
          
          <div className="mt-auto pt-8 border-t border-outline-variant/30 space-y-1 text-left">
            <button
              onClick={() => {
                setActiveSidebarTab('settings');
                showToast('University Settings loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'settings'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container font-extrabold'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: activeSidebarTab === 'settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('help');
                showToast('University Help Center loaded.', 'info');
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer ${
                activeSidebarTab === 'help'
                  ? 'bg-secondary-container/40 dark:bg-primary-container text-primary dark:text-on-primary-container font-extrabold'
                  : 'text-on-surface-variant hover:bg-secondary-container/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: activeSidebarTab === 'help' ? "'FILL' 1" : "'FILL' 0" }}>help</span>
              <span>Help Center</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-on-surface-variant hover:bg-secondary-container/20 px-4 py-3 flex items-center gap-3 rounded-lg transition-all text-xs font-bold border-none cursor-pointer bg-transparent"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="ml-64 min-h-screen flex flex-col justify-between">
        {/* TopNavBar */}
        <header className="w-full h-16 sticky top-0 z-40 bg-surface-bright shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex justify-between items-center px-margin-desktop border-b border-primary/5">
          <div className="flex items-center gap-6">
            <span className="font-headline-md text-lg font-bold text-primary">CareerBridge</span>
            <form onSubmit={handleSearch} className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Search students, drives, or companies..."
                type="text"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveSidebarTab('notifications');
                showToast('Notifications Center loaded.', 'info');
              }}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button 
              onClick={() => {
                setActiveSidebarTab('settings');
                showToast('University Settings loaded.', 'info');
              }}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary overflow-hidden shrink-0 shadow-sm border border-primary/10">
              <img 
                className="w-full h-full object-cover" 
                alt="University Administrator Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzPaw6-BV4xdJUYxNjfDK3FEeiEfwUsFOmrND3rtYZWia4oLCn71ejD-VoD8FN6CTwklu_7sPtS-QJOXFPOWSgh_ri3smg7EpWX6qvpz5ZD5osfYyhu6wle2rigpHIHGf0mPgPDI7l3Vujat4Ju7WdhyI0RjEnmmNxIY_Dbi0WS8VClm2gc_LKMjnjPf_n7c05GdcSSLNAs7nuW85Qp-9TF_pDAMiYYhwX-c408-WTXfYs8hhD6i12"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-margin-desktop py-stack-lg max-w-container-max mx-auto space-y-stack-lg w-full flex-grow text-left">
          {activeSidebarTab === 'dashboard' ? (
            <>
              {/* Header Section */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-gutter">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">University Dashboard</h2>
              <p className="font-body-md text-sm text-on-surface-variant mt-1 max-w-2xl">
                Monitor placements, campus drives, student readiness, employer engagement, and university performance.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold shrink-0">
              <button 
                onClick={handleExport}
                className="px-4 py-2.5 bg-secondary-container/40 text-primary border border-primary/10 rounded-lg hover:bg-secondary-container transition-all flex items-center gap-2 cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined text-[18px]">ios_share</span>
                Export Report
              </button>
              <button 
                onClick={handlePostDrive}
                className="px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create Campus Drive
              </button>
            </div>
          </section>

          {/* KPI Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Total Students</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">12,504</span>
                <span className="text-green-600 text-xs font-bold flex items-center">+4.2%</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%] rounded-full"></div>
              </div>
            </div>

            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Placement Eligible</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">8,920</span>
                <span className="text-on-surface-variant text-xs font-semibold">71.3% of total</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[71%] rounded-full"></div>
              </div>
            </div>

            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Students Placed</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">8,402</span>
                <span className="text-green-600 text-xs font-bold flex items-center">+12.5%</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[94.2%] rounded-full"></div>
              </div>
            </div>

            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Placement Rate</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">94.2%</span>
                <span className="text-green-600 text-xs font-bold flex items-center">Target met</span>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[100%] rounded-full"></div>
              </div>
            </div>

            {/* Second Row of KPIs */}
            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Active Drives</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg">campaign</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">45</span>
                <span className="text-on-surface-variant text-xs font-semibold">12 closing soon</span>
              </div>
            </div>

            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Partner Companies</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg">handshake</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">152</span>
                <span className="text-green-600 text-xs font-bold">+18 new</span>
              </div>
            </div>

            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Avg Package</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg">payments</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">$85.4k</span>
                <span className="text-green-600 text-xs font-bold flex items-center">+$5.1k</span>
              </div>
            </div>

            <div className="bg-white p-stack-md rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Highest Package</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg">workspace_premium</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] text-primary font-extrabold">$240k</span>
                <span className="text-on-surface-variant text-xs font-semibold">Fintech Role</span>
              </div>
            </div>
          </section>

          {/* Insights Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Placement Funnel (Left Column) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 p-stack-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-primary font-bold text-base">Placement Funnel</h3>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="text-xs font-semibold">Real-time stats</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg relative z-10 text-xs font-semibold">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">1</span>
                      <span>Registered Students</span>
                    </div>
                    <span className="font-bold text-sm">12,504</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-[-16px] flex justify-center text-on-surface-variant z-0">
                    <span className="material-symbols-outlined text-[16px]">south</span>
                    <span className="text-[10px] font-bold ml-1">71.3%</span>
                  </div>
                </div>
                
                <div className="pt-4 space-y-4 text-xs font-semibold">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low/80 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">2</span>
                      <span>Placement Eligible</span>
                    </div>
                    <span className="font-bold text-sm">8,920</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-container-low/60 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">3</span>
                      <span>Applied to Drives</span>
                    </div>
                    <span className="font-bold text-sm">7,140</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-container-low/40 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">4</span>
                      <span>Shortlisted candidates</span>
                    </div>
                    <span className="font-bold text-sm">5,200</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center">5</span>
                      <span className="font-bold">Placed / Selected</span>
                    </div>
                    <span className="font-bold text-primary text-sm">8,402</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights (Right Column) */}
            <div className="bg-primary-container text-white rounded-xl p-stack-lg flex flex-col justify-between overflow-hidden relative shadow-md">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="font-headline-md text-white font-bold text-base">AI Placement Insights</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-2 text-xs font-bold">
                      <span className="text-primary-fixed">Placement Forecast</span>
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">High Confidence</span>
                    </div>
                    <p className="text-xs text-surface-container leading-relaxed">
                      96% expected by May 2026. Suggest focusing on specialized Fintech certifications for remaining 4%.
                    </p>
                  </div>

                  <div className="p-4 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                    <span className="font-label-md text-primary-fixed block mb-2 text-xs font-bold">Skill Gap Analysis</span>
                    <div className="flex flex-wrap gap-2 mb-2 text-[10px]">
                      <span className="px-2 py-0.5 bg-white/10 rounded">Cloud Architecture</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded">Rust/Go</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded">System Design</span>
                    </div>
                    <p className="text-[11px] text-surface-container leading-relaxed">
                      12% gap in Advanced Cloud Security among IT graduates.
                    </p>
                  </div>

                  <div className="p-4 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold">
                      <span className="material-symbols-outlined text-error text-sm">warning</span>
                      <span className="text-primary-fixed">Students at Risk</span>
                    </div>
                    <p className="text-xs text-surface-container leading-relaxed">
                      240 students have &lt; 60% readiness score. Primary factor: Resume Quality.
                    </p>
                    <button 
                      onClick={handleTriggerAutoCounseling}
                      className="mt-3 text-xs text-primary-fixed font-bold hover:underline cursor-pointer bg-transparent border-none text-left"
                    >
                      Trigger Auto-Counseling →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming Campus Drives Table */}
          <section className="bg-white rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 overflow-hidden">
            <div className="p-stack-lg border-b border-primary/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-headline-md text-primary font-bold text-base">Upcoming Campus Drives</h3>
              <div className="flex gap-3 text-xs font-semibold">
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    showToast(`Filtering drives by: ${e.target.value}`, 'info');
                  }}
                  className="bg-surface-container-low border border-primary/10 rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary outline-none"
                >
                  <option>All Departments</option>
                  <option>CS &amp; Engineering</option>
                  <option>Business Management</option>
                </select>
                <button 
                  onClick={() => showToast('Opening all campus drives registry...', 'info')}
                  className="text-primary font-bold underline cursor-pointer bg-transparent border-none"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold">
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Role / Department</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4">Interview Date</th>
                    <th className="px-6 py-4">Package (LPA)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5 text-xs font-semibold">
                  {drives.map((drive) => (
                    <tr key={drive.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border border-outline-variant bg-white flex items-center justify-center font-bold text-primary text-sm shrink-0">
                            {drive.logo}
                          </div>
                          <div>
                            <p className="font-bold text-primary">{drive.company}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">{drive.tier}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary">{drive.role}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">{drive.depts}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{drive.registered}</td>
                      <td className="px-6 py-4 font-bold text-on-surface-variant">{drive.date}</td>
                      <td className="px-6 py-4 font-bold text-primary">{drive.package}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${drive.statusColor}`}>
                          {drive.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => showToast(`Actions for ${drive.company} drive opened.`, 'info')}
                          className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none p-1"
                        >
                          more_vert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Readiness & Department Performance */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Readiness Cards */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 p-stack-lg">
              <h3 className="font-headline-md text-primary font-bold mb-6 text-base">Student Readiness Tracker</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <span className="text-on-surface-variant block mb-1 text-[10px] uppercase font-bold tracking-wider">Resume</span>
                  <span className="font-display text-2xl text-primary font-extrabold">82%</span>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <span className="text-on-surface-variant block mb-1 text-[10px] uppercase font-bold tracking-wider">Skills</span>
                  <span className="font-display text-2xl text-primary font-extrabold">64%</span>
                </div>
                <div className="p-4 bg-primary-container text-on-primary rounded-xl text-center">
                  <span className="opacity-80 block mb-1 text-[10px] uppercase font-bold tracking-wider">AI Score</span>
                  <span className="font-display text-2xl font-extrabold text-white">78.5</span>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <span className="text-on-surface-variant block mb-1 text-[10px] uppercase font-bold tracking-wider">Profile</span>
                  <span className="font-display text-2xl text-primary font-extrabold">91%</span>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <span className="text-on-surface-variant block mb-1 text-[10px] uppercase font-bold tracking-wider">Projects</span>
                  <span className="font-display text-2xl text-primary font-extrabold">55%</span>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <span className="text-on-surface-variant block mb-1 text-[10px] uppercase font-bold tracking-wider">Certifications</span>
                  <span className="font-display text-2xl text-primary font-extrabold">48%</span>
                </div>
              </div>
              <p className="mt-6 text-xs text-on-surface-variant font-bold text-center">Ready for 12 more enterprise-tier companies.</p>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 p-stack-lg">
              <h3 className="font-headline-md text-primary font-bold mb-6 text-base">Department Performance</h3>
              <div className="space-y-6 text-xs font-semibold text-primary">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Computer Science &amp; Engineering</span>
                    <span className="font-bold">98.2%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[98.2%]"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Electronics &amp; Communication</span>
                    <span className="font-bold">88.5%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[88.5%] opacity-80"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>MBA (Finance &amp; Marketing)</span>
                    <span className="font-bold">92.0%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[92%] opacity-60"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Information Technology</span>
                    <span className="font-bold">94.8%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[94.8%] opacity-40"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Calendar & Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 p-stack-lg">
              <h3 className="font-headline-md text-primary font-bold mb-6 text-base">Recent Activity</h3>
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container">
                
                <div className="flex gap-6 relative">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center z-10 shrink-0 border-4 border-white">
                    <span className="material-symbols-outlined text-green-700 text-sm">check</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Placement Completed: Google Cloud</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">142 students received offer letters for SDE roles.</p>
                    <span className="text-[9px] text-outline mt-1 block">2 hours ago</span>
                  </div>
                </div>

                <div className="flex gap-6 relative">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center z-10 shrink-0 border-4 border-white">
                    <span className="material-symbols-outlined text-blue-700 text-sm">mail</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">New Drive Invitation</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Stripe sent an invitation for specialized Fintech recruitment drive.</p>
                    <span className="text-[9px] text-outline mt-1 block">5 hours ago</span>
                  </div>
                </div>

                <div className="flex gap-6 relative">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center z-10 shrink-0 border-4 border-white">
                    <span className="material-symbols-outlined text-purple-700 text-sm">person_check</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Bulk Student Verification</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">1,200 CSE Final Year students verified for eligibility.</p>
                    <span className="text-[9px] text-outline mt-1 block">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 p-stack-lg">
              <div className="flex justify-between items-center mb-6 text-xs font-bold">
                <h3 className="text-primary text-xs uppercase tracking-wider">Placement Calendar</h3>
                <div className="flex gap-2 items-center">
                  <button onClick={() => showToast('Previous month calendar view...', 'info')} className="material-symbols-outlined text-sm bg-transparent border-none cursor-pointer">chevron_left</button>
                  <span>Oct 2026</span>
                  <button onClick={() => showToast('Next month calendar view...', 'info')} className="material-symbols-outlined text-sm bg-transparent border-none cursor-pointer">chevron_right</button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-on-surface-variant uppercase mb-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                <div className="py-2 text-outline">28</div>
                <div className="py-2 text-outline">29</div>
                <div className="py-2 text-outline">30</div>
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer">1</div>
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer">2</div>
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer">3</div>
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer">4</div>
                
                <div className="py-2 bg-primary text-on-primary rounded-lg relative cursor-pointer">
                  12
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-on-primary rounded-full"></span>
                </div>
                
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer relative">13 <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary/40 rounded-full"></span></div>
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer">14</div>
                <div className="py-2 rounded-lg hover:bg-primary/5 cursor-pointer bg-primary/10">15</div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg text-left">
                  <div className="w-1 h-8 bg-green-500 rounded-full shrink-0"></div>
                  <div>
                    <p className="text-xs font-bold text-primary leading-normal">Google SDE Interviews</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">09:00 AM - Lab 402</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg text-left">
                  <div className="w-1 h-8 bg-blue-500 rounded-full shrink-0"></div>
                  <div>
                    <p className="text-xs font-bold text-primary leading-normal">Soft Skills Workshop</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">02:00 PM - Seminar Hall</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
            </>
          ) : activeSidebarTab === 'students' ? (
            selectedStudentId ? (
              <StudentProfile studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />
            ) : (
              <StudentManagement onSelectStudent={setSelectedStudentId} />
            )
          ) : activeSidebarTab === 'drives' ? (
            <CampusDrives onCreateDrive={() => setActiveSidebarTab('post_drive')} />
          ) : activeSidebarTab === 'companies' ? (
            <CompaniesManagement />
          ) : activeSidebarTab === 'analytics' ? (
            <PlacementAnalytics />
          ) : activeSidebarTab === 'messages' ? (
            <MessagingCenter />
          ) : activeSidebarTab === 'reports' ? (
            <ReportsCenter />
          ) : activeSidebarTab === 'notifications' ? (
            <NotificationsCenter />
          ) : activeSidebarTab === 'settings' ? (
            <UniversitySettings />
          ) : activeSidebarTab === 'help' ? (
            <UniversityHelpCenter />
          ) : activeSidebarTab === 'post_drive' ? (
            <PostCampusDrive 
              onCancel={() => setActiveSidebarTab('drives')} 
              onPublish={(newDrive) => {
                // Prepend to Dashboard's upcoming drives
                setDrives(prev => [newDrive, ...prev]);
                setActiveSidebarTab('dashboard');
              }}
            />
          ) : (
            <div className="bg-white rounded-xl p-stack-lg border border-primary/5 text-center min-h-[400px] flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-primary mb-4">construction</span>
              <h3 className="font-headline-md font-bold text-primary font-sans">Workspace under development</h3>
              <p className="text-on-surface-variant text-sm mt-1">The requested panel is currently being integrated.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="w-full py-stack-lg border-t border-outline-variant/30 mt-section-gap">
          <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-container-max mx-auto gap-stack-md">
            <span className="font-label-md text-sm font-black text-primary">CareerBridge</span>
            <p className="font-label-sm text-xs text-secondary font-medium">© 2026 CareerBridge. All rights reserved.</p>
            <div className="flex gap-6 text-xs font-bold text-secondary">
              <a className="hover:text-primary transition-colors" href="/legal/privacy">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="/legal/terms">Compliance</a>
              <a className="hover:text-primary transition-colors" href="mailto:support@careerbridge.ai">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default UniversityDashboard;
