import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// ── Types ──
interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'employer' | 'university' | 'admin';
  status: 'Active' | 'Pending' | 'Suspended';
  joinedDate: string;
  department?: string;
  placementStatus?: string;
  resumeScore?: number;
  matchScore?: number;
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
  status: 'Success' | 'Failed' | 'Warning';
  ip?: string;
}

interface SupportTicket {
  id: string;
  sender: string;
  subject: string;
  urgency: 'High' | 'Medium' | 'Low';
  status: string;
  sla: string;
  assignedAdmin: string;
}

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Active View based on URL Path
  const currentPath = location.pathname;
  const getActiveView = () => {
    if (currentPath.includes('analytics')) return 'analytics';
    if (currentPath.includes('users')) return 'users';
    if (currentPath.includes('students')) return 'students';
    if (currentPath.includes('employers')) return 'employers';
    if (currentPath.includes('universities')) return 'universities';
    if (currentPath.includes('ai-monitoring')) return 'ai-monitoring';
    if (currentPath.includes('audit-logs')) return 'audit-logs';
    if (currentPath.includes('reports')) return 'reports';
    if (currentPath.includes('feature-flags')) return 'feature-flags';
    if (currentPath.includes('notifications')) return 'notifications';
    if (currentPath.includes('settings')) return 'settings';
    if (currentPath.includes('help-center')) return 'help-center';
    return 'dashboard';
  };
  const activeView = getActiveView();

  // ── Mock Databases ──
  const [users, setUsers] = useState<UserRecord[]>([
    { id: 'usr_1', name: 'Arjun Sharma', email: 'arjun.sharma@delhi.edu', role: 'student', status: 'Active', joinedDate: '2026-06-15', department: 'Computer Science', placementStatus: 'Placed', resumeScore: 82, matchScore: 92 },
    { id: 'usr_2', name: 'Dr. Sarah Jenkins', email: 'dean.careers@placementhub.edu', role: 'university', status: 'Active', joinedDate: '2026-05-10', department: 'Administration' },
    { id: 'usr_3', name: 'Rohan Mehta', email: 'rohan@google.com', role: 'employer', status: 'Active', joinedDate: '2026-06-20', department: 'Engineering Recruitment' },
    { id: 'usr_4', name: 'Techno University', email: 'admin@technouniv.edu', role: 'university', status: 'Pending', joinedDate: '2026-07-01' },
    { id: 'usr_5', name: 'Microsoft Recruiters', email: 'hiring@microsoft.com', role: 'employer', status: 'Pending', joinedDate: '2026-07-02' },
    { id: 'usr_6', name: 'Kunal Sen', email: 'kunal.sen@iit.edu', role: 'student', status: 'Suspended', joinedDate: '2026-04-12', department: 'Information Technology', placementStatus: 'Unplaced', resumeScore: 54, matchScore: 48 },
    { id: 'usr_7', name: 'Aisha Malik', email: 'aisha@netflix.com', role: 'employer', status: 'Active', joinedDate: '2026-06-28' },
    { id: 'usr_8', name: 'Vanguard College', email: 'coordination@vanguard.edu', role: 'university', status: 'Active', joinedDate: '2026-05-15' },
    { id: 'usr_9', name: 'Priya Patel', email: 'priya.patel@nsut.edu', role: 'student', status: 'Active', joinedDate: '2026-07-01', department: 'Electronics', placementStatus: 'Placed', resumeScore: 91, matchScore: 95 }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'aud_1', action: 'User Suspension', actor: 'Dr. Sarah Jenkins', timestamp: '2026-07-03 21:40', details: 'Suspended Kunal Sen (#usr_6) for academic compliance violations.', status: 'Success', ip: '192.168.1.45' },
    { id: 'aud_2', action: 'Database Backup', actor: 'System Daemon', timestamp: '2026-07-03 21:00', details: 'Automated nightly Snapshot backup completed successfully. Size: 412 GB.', status: 'Success', ip: '10.0.4.12' },
    { id: 'aud_3', action: 'API Key Updated', actor: 'Sarah Jenkins', timestamp: '2026-07-03 19:30', details: 'Rotated secret keys for LinkedIn Talent Integrations API.', status: 'Warning', ip: '192.168.1.45' },
    { id: 'aud_4', action: 'University Verification', actor: 'Sarah Jenkins', timestamp: '2026-07-03 18:15', details: 'Approved Delhi College of Technology credentials registry.', status: 'Success', ip: '192.168.1.102' },
    { id: 'aud_5', action: 'Failed Admin Login', actor: 'IP 182.16.2.4', timestamp: '2026-07-03 17:05', details: 'Invalid security handshake token received during login.', status: 'Failed', ip: '182.16.2.4' }
  ]);

  const [tickets, setTickets] = useState<SupportTicket[]>([
    { id: '#PH-2041', sender: 'Dr. Sarah Jenkins', subject: 'Unable to sync Google Calendar', urgency: 'High', status: 'In Progress', sla: '45 mins remaining', assignedAdmin: 'Marcus Wright' },
    { id: '#PH-2038', sender: 'Google Hiring Corp', subject: 'Custom Report Export failing', urgency: 'Medium', status: 'Open', sla: '2 hours remaining', assignedAdmin: 'Aditi Sharma' },
    { id: '#PH-2032', sender: 'IIT Delhi Coordinators', subject: 'Bulk Upload student records failing mapping', urgency: 'High', status: 'Resolved', sla: 'Resolved inside SLA', assignedAdmin: 'Marcus Wright' }
  ]);

  const [flags, setFlags] = useState([
    { name: 'Gemini Auto-Shortlisting V2', enabled: true, tier: 'Beta', updated: '2 hours ago', affectedUsers: '42,000 users', rollbackReady: true },
    { name: 'University Webhooks Client', enabled: false, tier: 'Alpha', updated: '1 day ago', affectedUsers: '0 users (Restricted)', rollbackReady: true },
    { name: 'SSO SAML Integration', enabled: true, tier: 'Production', updated: '3 days ago', affectedUsers: '2,500 enterprise accounts', rollbackReady: true },
    { name: 'Live Video Proctoring', enabled: false, tier: 'Experimental', updated: '5 days ago', affectedUsers: '0 users (Testing)', rollbackReady: false }
  ]);

  // ── State Variables ──
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'employer' | 'university'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'Active' | 'Pending' | 'Suspended'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activeRegion, setActiveRegion] = useState('Global Operations');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'security' | 'sso' | 'database' | 'ai' | 'billing' | 'backups'>('general');
  const [sessionTime, setSessionTime] = useState(900); // 15 mins

  // Background states
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isServiceRestarting, setIsServiceRestarting] = useState(false);

  // Tick down Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => {
        if (prev <= 1) {
          showToast('Admin session expired.', 'error');
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLogout = () => {
    logout();
    showToast('Securely logged out from Administration console.', 'success');
    navigate('/');
  };

  // ── Actions ──
  const handleApprove = (id: string, name: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Active' } : u));
    showToast(`Approved registration credentials for: ${name}`, 'success');
  };

  const handleSuspend = (id: string, name: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Suspended' } : u));
    showToast(`Account suspended: ${name}`, 'error');
  };

  const handleBulkActivate = () => {
    if (selectedUserIds.length === 0) {
      showToast('No users selected.', 'info');
      return;
    }
    setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, status: 'Active' } : u));
    showToast(`Activated ${selectedUserIds.length} users successfully.`, 'success');
    setSelectedUserIds([]);
  };

  const handleBulkSuspend = () => {
    if (selectedUserIds.length === 0) {
      showToast('No users selected.', 'info');
      return;
    }
    setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, status: 'Suspended' } : u));
    showToast(`Suspended ${selectedUserIds.length} users successfully.`, 'error');
    setSelectedUserIds([]);
  };

  const handleToggleSelectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const handleToggleUserSelection = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBackupNow = () => {
    setIsBackupRunning(true);
    showToast('Executing Snapshot backup on secondary databases...', 'info');
    setTimeout(() => {
      setIsBackupRunning(false);
      const newAudit: AuditLog = {
        id: `aud_${Date.now()}`,
        action: 'Manual Backup',
        actor: 'Dr. Sarah Jenkins',
        timestamp: 'Just Now',
        details: 'Manual PostgreSQL and Redis database dump complete.',
        status: 'Success',
        ip: '192.168.1.45'
      };
      setAuditLogs(prev => [newAudit, ...prev]);
      showToast('Database backup successfully generated.', 'success');
    }, 1500);
  };

  const handleRestartServices = () => {
    setIsServiceRestarting(true);
    showToast('Scheduling graceful service recycles across VPC nodes...', 'info');
    setTimeout(() => {
      setIsServiceRestarting(false);
      showToast('Gateways recycled successfully.', 'success');
    }, 1500);
  };

  const handleToggleFlag = (name: string) => {
    setFlags(prev => prev.map(f => f.name === name ? { ...f, enabled: !f.enabled, updated: 'Just now' } : f));
    showToast(`Toggled feature flag "${name}".`, 'success');
  };

  const handleExportData = (type: string) => {
    showToast(`Exporting ${type} dataset as structured CSV...`, 'success');
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f9faf7] text-on-surface antialiased font-sans flex text-left text-xs">
      
      {/* ── Left Navigation Sidebar ───────────────────────────────────── */}
      <aside className="w-64 border-r border-outline-variant/10 bg-white dark:bg-gray-900 shrink-0 h-screen sticky top-0 flex flex-col p-4 z-30">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-outline-variant/10 shrink-0">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary">CB Admin</h1>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Super Control Center</p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-grow space-y-1 overflow-y-auto pr-1">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard', path: '/admin/dashboard' },
            { id: 'analytics', label: 'Platform Analytics', icon: 'query_stats', path: '/admin/analytics' },
            { id: 'users', label: 'Users Registry', icon: 'manage_accounts', path: '/admin/users' },
            { id: 'students', label: 'Students Database', icon: 'school', path: '/admin/students' },
            { id: 'employers', label: 'Employers Directory', icon: 'corporate_fare', path: '/admin/employers' },
            { id: 'universities', label: 'Universities Verifier', icon: 'account_balance', path: '/admin/universities' },
            { id: 'ai-monitoring', label: 'AI Operations & LLM Logs', icon: 'auto_awesome_motion', path: '/admin/ai-monitoring' },
            { id: 'audit-logs', label: 'System Audit Center', icon: 'checklist_rtl', path: '/admin/audit-logs' },
            { id: 'reports', label: 'Placement Reports', icon: 'analytics', path: '/admin/reports' },
            { id: 'feature-flags', label: 'Feature Rollouts & Flags', icon: 'toggle_on', path: '/admin/feature-flags' },
            { id: 'notifications', label: 'Announcements Broadcast', icon: 'campaign', path: '/admin/notifications' },
            { id: 'settings', label: 'Control Settings', icon: 'settings_accessibility', path: '/admin/settings' },
            { id: 'help-center', label: 'Help Center Queue', icon: 'support', path: '/admin/help-center' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-lg text-xs font-bold transition-all border-none cursor-pointer text-left bg-transparent ${
                activeView === item.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Account */}
        <div className="border-t border-outline-variant/10 pt-4 mt-auto space-y-3 shrink-0">
          <div className="bg-[#f3f4f1] p-3 rounded-xl flex items-center gap-3 border border-outline-variant/10">
            <div className="w-10 h-10 rounded-full border border-primary bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-primary truncate">Dr. Sarah Jenkins</p>
              <p className="text-[10px] text-on-surface-variant font-semibold truncate uppercase">Chief Administrator</p>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide flex-grow text-left flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Session: {formatSessionTime(sessionTime)}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-error font-bold hover:underline bg-transparent border-none cursor-pointer text-[11px] p-0 flex items-center gap-0.5 shrink-0"
            >
              <span className="material-symbols-outlined text-xs">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace Body ───────────────────────────────────────── */}
      <main className="flex-grow flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Row */}
        <header className="h-16 px-6 border-b border-outline-variant/10 bg-white sticky top-0 z-20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-md relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#f3f4f1] border-none rounded-full pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search administration registry..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={activeRegion}
                onChange={e => {
                  setActiveRegion(e.target.value);
                  showToast(`Infrastructure Scope: ${e.target.value}`, 'success');
                }}
                className="bg-[#f3f4f1] border border-outline-variant/20 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none cursor-pointer text-primary"
              >
                <option value="Global Operations">🌍 Global Operations</option>
                <option value="Asia-Pacific Cluster">🌏 APAC Cluster</option>
                <option value="Americas Central Server">🌎 Americas Cluster</option>
              </select>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-bold text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>

            <button
              onClick={() => showToast('No pending alerts.', 'info')}
              className="p-2 hover:bg-[#f3f4f1] rounded-full border-none bg-transparent cursor-pointer flex relative"
            >
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error"></span>
            </button>
          </div>
        </header>

        {/* ── Active View Contents ──────────────────────────────────────── */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6 max-w-[1600px] w-full mx-auto">
          
          {/* ──────────────────────────────────────────────────────── */}
          {/* 1. EXECUTIVE DASHBOARD                                   */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeView === 'dashboard' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs Row */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Users Base</p>
                  <h3 className="text-2xl font-black text-primary mt-1">527,000</h3>
                  <div className="mt-2 text-[10px] text-on-surface-variant font-semibold flex items-center gap-3">
                    <span>👨‍🎓 500k Students</span>
                    <span>🏢 25k Employers</span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Campus Drives</p>
                  <h3 className="text-2xl font-black text-primary mt-1">100,000+</h3>
                  <p className="text-[10px] text-green-600 mt-2 font-bold flex items-center">
                    <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>
                    +18% placement season growth
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">AI API Requests</p>
                  <h3 className="text-2xl font-black text-primary mt-1">1.2M / day</h3>
                  <p className="text-[10px] text-on-surface-variant mt-2 font-bold">Avg Response: 142ms</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Monthly Core Revenue</p>
                  <h3 className="text-2xl font-black text-primary mt-1">$12.5M ARR</h3>
                  <p className="text-[10px] text-green-600 mt-2 font-bold flex items-center">
                    <span className="material-symbols-outlined text-xs mr-0.5">verified</span>
                    100% of goal achieved
                  </p>
                </div>
              </div>

              {/* Left Column (8 cols): Interactive Maps & Health charts */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Visual Heatmap / Placement World Map */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Regional Placement Heatmap &amp; Nodes</h3>
                      <p className="text-[10px] text-on-surface-variant">Visual distribution of active campus drives and partner university systems.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg">Realtime Feed</span>
                  </div>
                  
                  {/* Styled SVG Map Simulation */}
                  <div className="h-64 bg-[#f3f4f1] rounded-2xl relative flex items-center justify-center overflow-hidden border border-outline-variant/10">
                    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                    
                    {/* Simulated Heatmap Glow points */}
                    <div className="absolute top-1/4 left-1/3 w-8 h-8 rounded-full bg-primary/20 animate-ping"></div>
                    <div className="absolute top-1/4 left-1/3 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                    <span className="absolute top-1/4 left-1/3 mt-6 text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-outline-variant/20 shadow">Delhi Hub: 420 drives</span>

                    <div className="absolute top-1/2 left-2/3 w-10 h-10 rounded-full bg-primary/20 animate-ping"></div>
                    <div className="absolute top-1/2 left-2/3 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                    <span className="absolute top-1/2 left-2/3 mt-6 text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-outline-variant/20 shadow">APAC South Node</span>

                    <div className="absolute top-2/3 left-1/4 w-8 h-8 rounded-full bg-secondary-container/40 animate-ping"></div>
                    <div className="absolute top-2/3 left-1/4 w-4 h-4 rounded-full bg-secondary shadow-lg"></div>

                    <p className="text-[10px] font-bold text-on-surface-variant relative z-10 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-outline-variant/20">
                      🌍 Visual placement statistics mapped successfully to 3 global hubs.
                    </p>
                  </div>
                </div>

                {/* System Infrastructure Monitoring Grid */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Live Infrastructure Nodes Uptime</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { node: 'Core Router API', state: 'Operational', latency: '12ms' },
                      { node: 'Redis Match Cache', state: 'Operational', latency: '4ms' },
                      { node: 'Gemini LLM Broker', state: 'Operational', latency: '142ms' },
                      { node: 'Notification Queue', state: 'Operational', latency: '22ms' },
                      { node: 'PostgreSQL DB', state: 'Operational', latency: '18ms' },
                      { node: 'Socket Channel', state: 'Operational', latency: '9ms' },
                      { node: 'SES Mail Engine', state: 'Operational', latency: '200ms' },
                      { node: 'Reports Daemon', state: 'Operational', latency: '350ms' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#f3f4f1] p-3 rounded-xl border border-outline-variant/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="font-bold text-primary text-[10px] truncate">{item.node}</span>
                        </div>
                        <p className="text-[9px] text-on-surface-variant">Uptime: 99.9% • Latency: {item.latency}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Platform Deployments */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Recent System Deployments</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-[#f3f4f1] rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-primary">v2.4.2-release - Security Patch</p>
                        <p className="text-[9px] text-on-surface-variant">Triggered by GitHub Action #4892. Target: Production Gateway.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[9px] font-black uppercase rounded">Successful</span>
                    </div>
                    <div className="p-3 bg-[#f3f4f1] rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-primary">v2.4.1-release - Gemini LLM Matcher</p>
                        <p className="text-[9px] text-on-surface-variant">Optimized resume indexing structures.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[9px] font-black uppercase rounded">Successful</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): AI Insight Feed & System Controls */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* AI Central Advice widget */}
                <div className="bg-primary text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-fixed text-primary rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-on-primary">Bridge AI Central Ops</h4>
                        <p className="text-[9px] uppercase tracking-widest text-primary-fixed opacity-70">Infrastructure Analyzer</p>
                      </div>
                    </div>
                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-[11px] leading-relaxed italic">
                      "Primary databases look optimal. Gemini latency values are normal. Report generation backlogs have resolved."
                    </div>
                    <button
                      onClick={() => showToast('Dispatched audit queries...', 'info')}
                      className="w-full bg-white text-primary py-2.5 rounded-xl text-[10px] font-black uppercase border-none cursor-pointer hover:opacity-90"
                    >
                      Audit AI Infrastructure
                    </button>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-fixed opacity-5 blur-3xl rounded-full"></div>
                </div>

                {/* Operations Quick Control panel */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-4">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Systems Node Commands</h4>
                  <button
                    onClick={handleBackupNow}
                    disabled={isBackupRunning}
                    className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl border-none cursor-pointer font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                    <span>{isBackupRunning ? 'Backing up...' : 'Backup Platform Database'}</span>
                  </button>
                  <button
                    onClick={handleRestartServices}
                    disabled={isServiceRestarting}
                    className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-xl border-none cursor-pointer font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    <span>{isServiceRestarting ? 'Recycling...' : 'Restart Load Balancer Nodes'}</span>
                  </button>
                </div>

                {/* Upcoming maintenance calendar */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Operations Calendar</h4>
                  <ul className="space-y-4 list-none p-0 m-0">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                      <div>
                        <p className="font-bold text-primary">AWS Database Migration</p>
                        <p className="text-[9px] text-on-surface-variant">Scheduled: Jul 12, 2026 at 02:00 UTC</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                      <div>
                        <p className="font-bold text-primary">Weekly NAAC Report Audit Sync</p>
                        <p className="text-[9px] text-on-surface-variant">Scheduled: Every Sunday at 18:00 UTC</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* 2. PLATFORM ANALYTICS                                    */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeView === 'analytics' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Daily Active Users (DAU)</p>
                  <h3 className="text-2xl font-black text-primary mt-1">42,500</h3>
                  <p className="text-[9px] text-green-600 font-bold mt-1">▲ 12.4% vs last week</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Monthly Active Users (MAU)</p>
                  <h3 className="text-2xl font-black text-primary mt-1">380,000</h3>
                  <p className="text-[9px] text-on-surface-variant font-medium mt-1">Uptime benchmark matched</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Placement success rate</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">94.8%</h3>
                  <p className="text-[9px] text-green-600 font-bold mt-1">▲ 2.1% season high</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Active Sessions</p>
                  <h3 className="text-2xl font-black text-primary mt-1">12,450</h3>
                  <p className="text-[9px] text-on-surface-variant font-medium mt-1">Zero failures observed</p>
                </div>
              </div>

              {/* Main Analytics Graphs */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Traffic, Signups, and Placement Progress</h3>
                      <p className="text-[10px] text-on-surface-variant">Interactive statistics charting platform growth over the past 30 days.</p>
                    </div>
                    <button
                      onClick={() => handleExportData('Traffic & Placements')}
                      className="bg-[#f3f4f1] text-primary border border-outline-variant/20 px-3.5 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>

                  {/* High Quality SVG Graph Grid */}
                  <div className="h-64 bg-[#f3f4f1] rounded-2xl relative flex items-end justify-between p-6 overflow-hidden border border-outline-variant/10">
                    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="none" />
                      <line x1="0" y1="25%" x2="100%" y2="25%" stroke="currentColor" strokeWidth="0.5" />
                      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="0.5" />
                      <line x1="0" y1="75%" x2="100%" y2="75%" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                    
                    {/* Visual Simulated Columns */}
                    {[22, 35, 45, 52, 60, 68, 80, 94].map((h, i) => (
                      <div key={i} className="flex flex-col items-center w-8 group cursor-pointer relative z-10">
                        <div className="w-full bg-primary rounded-t transition-all group-hover:bg-primary-container" style={{ height: `${h}%` }}></div>
                        <span className="text-[8px] text-outline mt-1 font-bold">W-{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                    <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">API Operations usage</h4>
                    <div className="h-36 bg-[#f3f4f1] rounded-xl flex items-center justify-center font-bold text-outline text-[10px]">
                      [ Gemini API requests: 12.8M this cycle ]
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                    <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Hiring conversion percentages</h4>
                    <div className="h-36 bg-[#f3f4f1] rounded-xl flex items-center justify-center font-bold text-outline text-[10px]">
                      [ Conversion Funnel matching index: 88.4% ]
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): AI forecast card & Incidents */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* AI Predictive Insight */}
                <div className="bg-primary-container text-white p-6 rounded-3xl border border-primary-fixed-dim/20 shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary-fixed">auto_awesome</span>
                    <h4 className="font-bold text-xs text-primary-fixed">Gemini Analytics Forecast</h4>
                  </div>
                  <p className="text-on-primary-container text-[11px] leading-relaxed">
                    Based on recent hiring velocity and company drive commitments, student placements are projected to reach 96.5% by the end of July. AI API token budgets look stable.
                  </p>
                </div>

                {/* Incident Monitoring widget */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Recent Service Warnings</h4>
                  <div className="p-3 bg-error/5 border border-error/20 rounded-xl text-error text-[10px] font-bold flex gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>Reports exporter nodes experienced momentary latency spikes at 21:02. Status resolved.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* 3. USERS REGISTRY                                        */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeView === 'users' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Active Users</p>
                  <h3 className="text-xl font-black text-primary mt-1">{users.length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Students</p>
                  <h3 className="text-xl font-black text-primary mt-1">{users.filter(u => u.role === 'student').length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Employers</p>
                  <h3 className="text-xl font-black text-primary mt-1">{users.filter(u => u.role === 'employer').length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Universities</p>
                  <h3 className="text-xl font-black text-primary mt-1">{users.filter(u => u.role === 'university').length}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">System Admins</p>
                  <h3 className="text-xl font-black text-primary mt-1">1</h3>
                </div>
              </div>

              {/* Main User Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                
                {/* Advanced Filter and Action Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value as any)}
                      className="bg-[#f3f4f1] border border-outline-variant/20 rounded-xl px-3 py-2 font-bold cursor-pointer outline-none"
                    >
                      <option value="all">Clearance: All Roles</option>
                      <option value="student">Student Accounts</option>
                      <option value="employer">Employer Accounts</option>
                      <option value="university">University Accounts</option>
                    </select>

                    <select
                      value={userStatusFilter}
                      onChange={e => setUserStatusFilter(e.target.value as any)}
                      className="bg-[#f3f4f1] border border-outline-variant/20 rounded-xl px-3 py-2 font-bold cursor-pointer outline-none"
                    >
                      <option value="all">State: All Statuses</option>
                      <option value="Active">Active States</option>
                      <option value="Pending">Pending Verifications</option>
                      <option value="Suspended">Suspended states</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkActivate}
                      className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold cursor-pointer border-none text-[11px] hover:opacity-90"
                    >
                      Bulk Verify
                    </button>
                    <button
                      onClick={handleBulkSuspend}
                      className="bg-transparent hover:bg-error-container text-error px-4 py-2 rounded-xl font-bold cursor-pointer border border-error/20 text-[11px]"
                    >
                      Bulk Suspend
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#f3f4f1] text-on-surface-variant text-[10px] uppercase font-bold tracking-wide border-b border-outline-variant/10">
                        <tr>
                          <th className="px-6 py-4 text-center w-12">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.length === users.length}
                              onChange={handleToggleSelectAllUsers}
                              className="w-4 h-4 text-primary accent-primary cursor-pointer rounded"
                            />
                          </th>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Clearance Role</th>
                          <th className="px-6 py-4">Joined Date</th>
                          <th className="px-6 py-4">State</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-[#f3f4f1]/50 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                onChange={() => handleToggleUserSelection(u.id)}
                                className="w-4 h-4 text-primary accent-primary cursor-pointer rounded"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-primary">{u.name}</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[9px] font-black uppercase rounded">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-on-surface-variant font-medium">{u.joinedDate}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                u.status === 'Active' ? 'bg-green-50 text-green-700' :
                                u.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold flex gap-2 justify-end">
                              {u.status === 'Pending' && (
                                <button
                                  onClick={() => handleApprove(u.id, u.name)}
                                  className="px-3 py-1 bg-primary text-on-primary rounded-lg text-[9px] cursor-pointer border-none font-bold"
                                >
                                  Verify
                                </button>
                              )}
                              {u.status === 'Active' && (
                                <button
                                  onClick={() => handleSuspend(u.id, u.name)}
                                  className="px-3 py-1 bg-transparent hover:bg-error-container text-error rounded-lg text-[9px] border border-error/20 cursor-pointer font-bold"
                                >
                                  Suspend
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  <div className="p-4 border-t border-outline-variant/10 flex justify-between items-center text-xs font-bold text-on-surface-variant">
                    <span>Showing 1 to {filteredUsers.length} of {filteredUsers.length} accounts</span>
                    <div className="flex gap-1.5">
                      <button className="px-3 py-1 bg-white border border-outline-variant/20 rounded cursor-pointer">Prev</button>
                      <button className="px-3 py-1 bg-white border border-outline-variant/20 rounded cursor-pointer">Next</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Verification Queue summaries */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Pending Approvals Queue</h4>
                  <div className="space-y-4">
                    {users.filter(u => u.status === 'Pending').map(u => (
                      <div key={u.id} className="p-3 bg-[#f3f4f1] rounded-xl flex justify-between items-center border border-outline-variant/5">
                        <div>
                          <p className="font-bold text-primary">{u.name}</p>
                          <p className="text-[9px] text-on-surface-variant uppercase mt-0.5">{u.role}</p>
                        </div>
                        <button
                          onClick={() => handleApprove(u.id, u.name)}
                          className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[9px] border-none font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role distribution breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Role Distribution</h4>
                  <div className="space-y-3 font-semibold">
                    <div className="flex justify-between items-center">
                      <span>Students Clearance</span>
                      <span className="font-bold">95.1%</span>
                    </div>
                    <div className="w-full bg-[#f3f4f1] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: '95%' }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Verified Employers</span>
                      <span className="font-bold">4.2%</span>
                    </div>
                    <div className="w-full bg-[#f3f4f1] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: '4%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Students Database View ── */}
          {activeView === 'students' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Average Resume Score</p>
                  <h3 className="text-2xl font-black text-primary mt-1">84/100</h3>
                  <p className="text-[9px] text-green-600 font-bold mt-1">▲ 1.4 points season gain</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Onboarded placements rate</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">92.4%</h3>
                  <p className="text-[9px] text-green-600 font-bold mt-1">▲ 3.2% vs target quota</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Average AI Readiness Index</p>
                  <h3 className="text-2xl font-black text-primary mt-1">88.2%</h3>
                  <p className="text-[9px] text-on-surface-variant mt-1 font-medium">95.4% success index</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">At-risk Student profiles</p>
                  <h3 className="text-2xl font-black text-error mt-1">14</h3>
                  <p className="text-[9px] text-error font-bold mt-1">SLA intervention needed</p>
                </div>
              </div>

              {/* Students grid workspace */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden p-6 text-left">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Student profiles database</h3>
                    <button
                      onClick={() => handleExportData('Student Database')}
                      className="bg-[#f3f4f1] text-primary border border-outline-variant/20 px-3.5 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#f3f4f1] text-on-surface-variant text-[10px] uppercase font-bold tracking-wide border-b border-outline-variant/10">
                        <tr>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Department Course</th>
                          <th className="px-6 py-4 text-center">Resume Score</th>
                          <th className="px-6 py-4 text-center">Match index</th>
                          <th className="px-6 py-4">Placement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {users.filter(u => u.role === 'student').map(s => (
                          <tr key={s.id} className="hover:bg-[#f3f4f1]/40">
                            <td className="px-6 py-4 font-bold text-primary">{s.name}</td>
                            <td className="px-6 py-4 text-on-surface-variant">{s.department || 'N/A'}</td>
                            <td className="px-6 py-4 text-center font-black">{s.resumeScore || 0}/100</td>
                            <td className="px-6 py-4 text-center font-black">{s.matchScore || 0}%</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                s.placementStatus === 'Placed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {s.placementStatus || 'Unplaced'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Placement Funnel</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>Delhi Technological University matches</span>
                        <strong className="font-bold">92%</strong>
                      </div>
                      <div className="w-full bg-[#f3f4f1] rounded-full h-1">
                        <div className="bg-primary h-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>IIT Delhi matches</span>
                        <strong className="font-bold">98%</strong>
                      </div>
                      <div className="w-full bg-[#f3f4f1] rounded-full h-1">
                        <div className="bg-primary h-full" style={{ width: '98%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Employers Directory View ── */}
          {activeView === 'employers' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Active Corporate Employers</p>
                  <h3 className="text-2xl font-black text-primary mt-1">25,480</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Pending Verification Approvals</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">45</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Verified Recruiters directory</p>
                  <h3 className="text-2xl font-black text-primary mt-1">112,400</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Auto-eligibility score</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">94.8%</h3>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Corporate Accounts Registry</h3>
                  
                  <div className="space-y-4">
                    {users.filter(u => u.role === 'employer').map(emp => (
                      <div key={emp.id} className="p-4 bg-[#f3f4f1] rounded-xl border border-outline-variant/10 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-primary">{emp.name}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-1">Corporate Access Contact: {emp.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {emp.status === 'Pending' ? (
                            <button
                              onClick={() => handleApprove(emp.id, emp.name)}
                              className="bg-primary text-on-primary px-4 py-1.5 rounded-lg border-none cursor-pointer font-bold"
                            >
                              Verify Account
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 font-bold uppercase rounded text-[9px]">Verified partner</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-primary-container text-white p-6 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary-fixed">auto_awesome</span>
                    <h4 className="font-bold text-xs text-primary-fixed">AI Partner Suggestion</h4>
                  </div>
                  <p className="text-on-primary-container text-[11px] leading-relaxed">
                    Recruiter credentials for Microsoft Hiring Corp looks valid. Match index matches institutional history logs. Recommend direct verification approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Universities Verifier View ── */}
          {activeView === 'universities' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Accredited Partner Universities</p>
                  <h3 className="text-2xl font-black text-primary mt-1">2,140</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Placement success indicator</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">94.8%</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Departments monitored</p>
                  <h3 className="text-2xl font-black text-primary mt-1">45</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Live Drive Calendars</p>
                  <h3 className="text-2xl font-black text-primary mt-1">482</h3>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* SVG Universities Placement Map */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">University Regional Map</h3>
                  <div className="h-48 bg-[#f3f4f1] rounded-2xl relative flex items-center justify-center border border-outline-variant/10">
                    <span className="text-[10px] font-bold text-outline">Map trace points: 2,140 universities mapped.</span>
                  </div>
                </div>

                {/* Universities List */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">University Registry</h3>
                  
                  <div className="space-y-4">
                    {users.filter(u => u.role === 'university').map(univ => (
                      <div key={univ.id} className="p-4 bg-[#f3f4f1] rounded-xl border border-outline-variant/10 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-primary">{univ.name}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Primary Contact: {univ.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {univ.status === 'Pending' ? (
                            <button
                              onClick={() => handleApprove(univ.id, univ.name)}
                              className="bg-primary text-on-primary px-4 py-1.5 rounded-lg border-none cursor-pointer font-bold"
                            >
                              Approve University
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 font-bold uppercase rounded text-[9px]">Verified Institution</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Accreditation Queue</h4>
                  <ul className="space-y-3 list-none p-0 m-0">
                    <li className="flex justify-between items-center text-[11px]">
                      <span>Techno University NAAC checking</span>
                      <strong className="text-amber-600">Pending</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── AI Operations View ── */}
          {activeView === 'ai-monitoring' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Gemini Token Budget Used</p>
                  <h3 className="text-2xl font-black text-primary mt-1">128M / 500M</h3>
                  <p className="text-[9px] text-on-surface-variant mt-1">Resetting in 12 days</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Average LLM Latency</p>
                  <h3 className="text-2xl font-black text-primary mt-1">142ms</h3>
                  <p className="text-[9px] text-green-600 font-bold mt-1">▲ Uptime benchmark stable</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Cache Hit Rate</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">84%</h3>
                  <p className="text-[9px] text-on-surface-variant mt-1">Active indexing rules</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Monthly Gemini Costs</p>
                  <h3 className="text-2xl font-black text-primary mt-1">$412.50</h3>
                  <p className="text-[9px] text-on-surface-variant mt-1">Model: Gemini 1.5 Flash</p>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Visual Usage Sparklines */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Gemini API Requests &amp; Latency timeline</h3>
                  <div className="h-48 bg-[#f3f4f1] rounded-2xl relative flex items-end justify-between p-6 border border-outline-variant/10">
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-outline">API Request traffic visualizer</span>
                    <div className="w-6 bg-primary h-2/5 rounded-t"></div>
                    <div className="w-6 bg-primary h-1/2 rounded-t"></div>
                    <div className="w-6 bg-primary h-3/5 rounded-t"></div>
                    <div className="w-6 bg-primary h-4/5 rounded-t"></div>
                    <div className="w-6 bg-primary h-full rounded-t"></div>
                  </div>
                </div>

                {/* Prompt template list */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Active Prompt Templates</h3>
                  <div className="space-y-3">
                    <div className="p-3.5 bg-[#f3f4f1] rounded-xl flex justify-between items-center border border-outline-variant/5">
                      <div>
                        <p className="font-bold text-primary">Resume parsing &amp; scoring engine (v2.4)</p>
                        <p className="text-[9px] text-on-surface-variant mt-0.5">Parameters: Temperature 0.2, Top-P 0.9. Token efficiency optimized.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[9px] font-black uppercase rounded">Active</span>
                    </div>
                    <div className="p-3.5 bg-[#f3f4f1] rounded-xl flex justify-between items-center border border-outline-variant/5">
                      <div>
                        <p className="font-bold text-primary">Mock interview examiner generator (v1.8)</p>
                        <p className="text-[9px] text-on-surface-variant mt-0.5">Uses Gemini 1.5 Pro. Optimized context structures.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[9px] font-black uppercase rounded">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">AI Infrastructure alerts</h4>
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-[10px] font-bold">
                    Zero model failures or exceptions recorded in the past 48 hours.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Audit Logs View ── */}
          {activeView === 'audit-logs' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total logged actions</p>
                  <h3 className="text-2xl font-black text-primary mt-1">14,245</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Failed handshake logs</p>
                  <h3 className="text-2xl font-black text-error mt-1">4</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Cryptographic index validation</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">Passed</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Database backup verification</p>
                  <h3 className="text-2xl font-black text-primary mt-1">Verified</h3>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                
                {/* Advanced Search and Export */}
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm flex justify-between items-center flex-wrap gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportData('Audit Logs')}
                      className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold cursor-pointer border-none text-[11px]"
                    >
                      Export Audit Trail (CSV)
                    </button>
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Recent Admin Actions</h3>
                  
                  <div className="space-y-4">
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-4 bg-[#f3f4f1] rounded-xl border border-outline-variant/10 flex justify-between items-center">
                        <div className="flex gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            log.status === 'Success' ? 'bg-green-100 text-green-700' :
                            log.status === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            <span className="material-symbols-outlined text-sm">
                              {log.status === 'Success' ? 'check_circle' : log.status === 'Warning' ? 'warning' : 'gpp_bad'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-primary">{log.action}</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">{log.details}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-primary">{log.actor}</p>
                          <p className="text-[9px] text-outline mt-0.5">{log.timestamp} • IP: {log.ip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Security center notices</h4>
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-[10px] font-bold flex gap-2">
                    <span className="material-symbols-outlined text-sm">security</span>
                    <span>Admin login attempted from unauthorized IP range block. Target filtered by gateway.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Reports View ── */}
          {activeView === 'reports' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Reports Compiled (Monthly)</p>
                  <h3 className="text-2xl font-black text-primary mt-1">420 docs</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Scheduled Automated Audits</p>
                  <h3 className="text-2xl font-black text-primary mt-1">12</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Storage Capacity Utilized</p>
                  <h3 className="text-2xl font-black text-primary mt-1">2.4 TB / 10 TB</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Regulatory Compliance Index</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">100% Correct</h3>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Reports Templates */}
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Select report compilation template</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-outline-variant/20 rounded-xl">
                      <h4 className="font-bold text-primary">NAAC Accreditation Placement cycle</h4>
                      <p className="text-[10px] text-on-surface-variant mt-1">Export PDF containing departmental placements metrics, average salaries, and verified lists.</p>
                      <button
                        onClick={() => showToast('Compiling NAAC Audit logs document...', 'success')}
                        className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg border-none cursor-pointer font-bold"
                      >
                        Compile Report
                      </button>
                    </div>

                    <div className="p-4 border border-outline-variant/20 rounded-xl">
                      <h4 className="font-bold text-primary">Company placement conversion indices</h4>
                      <p className="text-[10px] text-on-surface-variant mt-1">Audit active hiring cycles, match ratings, and response times of verified employer accounts.</p>
                      <button
                        onClick={() => showToast('Compiling company analytics sheets...', 'success')}
                        className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg border-none cursor-pointer font-bold"
                      >
                        Compile Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">AI Compilation advice</h4>
                  <div className="p-3 bg-primary-container/20 text-primary rounded-xl border border-primary-fixed-dim/20 text-[10px] font-bold">
                    Recommend running the NAAC Accreditation Placement cycle report weekly for compliance database synchronization.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Feature Flags View ── */}
          {activeView === 'feature-flags' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Active Feature Toggles</p>
                  <h3 className="text-2xl font-black text-primary mt-1">{flags.filter(f => f.enabled).length}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Experimental Rollouts</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">1</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Affected Users (Estimate)</p>
                  <h3 className="text-2xl font-black text-primary mt-1">44,500</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Rollback Node Status</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">Synchronized</h3>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Rollout Toggles &amp; clearance</h3>
                  
                  <div className="space-y-4">
                    {flags.map(f => (
                      <div key={f.name} className="p-4 bg-[#f3f4f1] rounded-xl border border-outline-variant/10 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-primary">{f.name}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-1">Scope: {f.tier} • Active: {f.affectedUsers} • Updated: {f.updated}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              showToast(`Emergency Rollback triggered for flag: ${f.name}`, 'error');
                            }}
                            disabled={!f.rollbackReady}
                            className="bg-transparent text-error border border-error/20 hover:bg-error-container font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer disabled:opacity-50"
                          >
                            Rollback
                          </button>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={f.enabled}
                              onChange={() => handleToggleFlag(f.name)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Rollout guidelines</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Always deploy new features to the APAC Cluster under "Alpha" state prior to broad global release validation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Announcements Broadcast View ── */}
          {activeView === 'notifications' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                <h2 className="text-headline-lg font-bold text-primary mb-2">Broadcast announcements</h2>
                <p className="text-on-surface-variant font-medium text-xs mb-6">Dispatch high priority system-wide push notifications and landing page banners.</p>
                
                <div className="space-y-4 max-w-xl font-bold">
                  <div className="space-y-1">
                    <label className="text-on-surface-variant">Announcement Headline</label>
                    <input
                      className="w-full bg-[#f3f4f1] border border-outline-variant/40 rounded-xl px-4 py-2.5 outline-none text-xs"
                      placeholder="Scheduled platform maintenance on Sunday..."
                      type="text"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-on-surface-variant">Announcement details</label>
                    <textarea
                      className="w-full bg-[#f3f4f1] border border-outline-variant/40 rounded-xl px-4 py-3 outline-none text-xs resize-none"
                      placeholder="Provide description parameters..."
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={() => showToast('System announcement dispatched.', 'success')}
                    className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold border-none cursor-pointer hover:opacity-90"
                  >
                    Broadcast Announcement
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Control Settings View ── */}
          {activeView === 'settings' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-3">
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-4 space-y-1">
                  {[
                    { id: 'general', label: 'General Configuration' },
                    { id: 'security', label: 'Security & Access' },
                    { id: 'sso', label: 'SSO SAML Verification' },
                    { id: 'database', label: 'Database Index rules' },
                    { id: 'ai', label: 'Gemini LLM parameters' },
                    { id: 'billing', label: 'Platform Billing' },
                    { id: 'backups', label: 'Automated Backups policy' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id as any)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-xs border-none cursor-pointer ${
                        activeSettingsTab === tab.id ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-[#f3f4f1]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-9 bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                {activeSettingsTab === 'general' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">General settings</h3>
                    <p className="text-[10px] text-on-surface-variant">Update primary portal parameters.</p>
                  </div>
                )}
                {activeSettingsTab === 'security' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Security settings</h3>
                    <p className="text-[10px] text-on-surface-variant">Manage network access limits.</p>
                  </div>
                )}
                {activeSettingsTab === 'sso' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">SSO Configuration</h3>
                    <p className="text-[10px] text-on-surface-variant">Rotate SAML verification key credentials.</p>
                  </div>
                )}
                {activeSettingsTab === 'database' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Database Indexes</h3>
                    <p className="text-[10px] text-on-surface-variant">Monitor Postgres VACUUM logs.</p>
                  </div>
                )}
                {activeSettingsTab === 'ai' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Gemini parameters</h3>
                    <p className="text-[10px] text-on-surface-variant">Adjust temperature and match thresholds.</p>
                  </div>
                )}
                {activeSettingsTab === 'billing' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Billing &amp; ARR</h3>
                    <p className="text-[10px] text-on-surface-variant">Manage subscription plans.</p>
                  </div>
                )}
                {activeSettingsTab === 'backups' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Backups Policy</h3>
                    <p className="text-[10px] text-on-surface-variant">Configure automated S3 dump targets.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Help Center Queue View ── */}
          {activeView === 'help-center' && (
            <div className="grid grid-cols-12 gap-6">
              {/* KPIs */}
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Open Support Tickets</p>
                  <h3 className="text-2xl font-black text-primary mt-1">2</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Tickets Resolved Today</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">15</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Average SLA Resolution Time</p>
                  <h3 className="text-2xl font-black text-primary mt-1">42 mins</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Live Chat Operators</p>
                  <h3 className="text-2xl font-black text-green-600 mt-1">3 Active</h3>
                </div>
              </div>

              {/* Main Workspace (Col 8) */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6">Open Tickets Queue</h3>
                  
                  <div className="space-y-4">
                    {tickets.map(t => (
                      <div key={t.id} className="p-4 bg-[#f3f4f1] rounded-xl border border-outline-variant/10 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              t.urgency === 'High' ? 'bg-red-100 text-red-700' : 'bg-secondary-container text-on-secondary-container'
                            }`}>{t.urgency} Priority</span>
                            <span className="text-[10px] text-on-surface-variant">SLA: {t.sla}</span>
                          </div>
                          <h4 className="font-bold text-primary mt-2">{t.subject}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Sender: {t.sender} • Assigner: {t.assignedAdmin}</p>
                        </div>

                        <button
                          onClick={() => {
                            setTickets(prev => prev.filter(x => x.id !== t.id));
                            showToast(`Resolved ticket ${t.id}`, 'success');
                          }}
                          className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold border-none cursor-pointer text-[10px] hover:opacity-90"
                        >
                          Resolve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar (Col 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm text-left">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Live Support Chat</h4>
                  <div className="p-4 bg-[#f3f4f1] rounded-xl border border-outline-variant/10 text-center font-bold text-outline text-[10px]">
                    No incoming chat queues. All administrators are offline on chat endpoints.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
