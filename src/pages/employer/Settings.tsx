import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

// Interface types
interface Recruiter {
  id: string;
  name: string;
  email: string;
  initials: string;
  department: string;
  role: string;
  permissions: string;
  assignedJobs: number;
  candidates: number;
  interviews: number;
  status: 'Active' | 'Suspended' | 'Deactivated' | 'Pending';
  lastLogin: string;
}

interface ActivityLog {
  id: string;
  event: string;
  user: string;
  time: string;
  type: 'recruiter' | 'security' | 'integration' | 'ai' | 'billing' | 'system';
  severity: 'low' | 'medium' | 'high';
}

interface Department {
  name: string;
  manager: string;
  headcount: number;
  budget: string;
}

interface OfficeLocation {
  city: string;
  country: string;
  address: string;
  timezone: string;
}

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  status: 'Connected' | 'Disconnected' | 'Pending';
  lastSync: string;
}

export const EmployerSettings: React.FC = () => {
  const { showToast } = useToast();

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'general' | 'organization' | 'recruitment' | 'recruiters' | 'permissions' | 'security' | 'notifications' | 'ai' | 'integrations' | 'billing' | 'branding' | 'compliance' | 'advanced'>('general');

  // Modals / Drawers State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [auditLogDrawerOpen, setAuditLogDrawerOpen] = useState(false);
  const [searchLogsQuery, setSearchLogsQuery] = useState('');
  const [activeRecruiterId, setActiveRecruiterId] = useState<string | null>(null);
  const [searchRecruiterQuery, setSearchRecruiterQuery] = useState('');
  const [recruiterFilterRole, setRecruiterFilterRole] = useState('All');

  // --- GENERAL STATE ---
  const [companyName, setCompanyName] = useState('Global Tech Solutions Inc.');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [companySize, setCompanySize] = useState('5,000+ Employees');
  const [website, setWebsite] = useState('https://globaltechsolutions.io');
  const [hq, setHq] = useState('San Francisco, CA');
  const [timezone, setTimezone] = useState('UTC-08:00 (Pacific Time)');
  const [language, setLanguage] = useState('English (US)');
  const [currency, setCurrency] = useState('USD ($)');
  const [businessHours, setBusinessHours] = useState('09:00 - 18:00 (Mon-Fri)');
  const [description, setDescription] = useState('Global Tech Solutions is a market leader in delivering scalable enterprise cloud architectures and digital transformation consultancy services worldwide.');
  const [mission, setMission] = useState('To accelerate human innovation via robust enterprise engineering platforms.');
  const [vision, setVision] = useState('To power the underlying tech infrastructure of the global top 500 enterprises.');
  const [socialLinks, setSocialLinks] = useState({
    linkedin: 'https://linkedin.com/company/globaltech',
    twitter: 'https://twitter.com/globaltech',
    github: 'https://github.com/global-tech'
  });

  // --- SECURITY STATE ---
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');
  const [passwordMinLength, setPasswordMinLength] = useState(12);
  const [passwordExpiration, setPasswordExpiration] = useState(90);

  // --- AI CONFIG STATE ---
  const [resumeConfidence, setResumeConfidence] = useState(85);
  const [aiMatchingEnabled, setAiMatchingEnabled] = useState(true);
  const [biasShieldEnabled, setBiasShieldEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [promptVersion, setPromptVersion] = useState('v2.4-enterprise');

  // --- BRANDING STATE ---
  const [primaryColor, setPrimaryColor] = useState('#001f16');
  const [secondaryColor, setSecondaryColor] = useState('#655e4c');
  const [accentColor, setAccentColor] = useState('#3a6757');

  // --- COMPLIANCE STATE ---
  const [gdprConsent, setGdprConsent] = useState(true);
  const [ccpaConsent, setCcpaConsent] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);

  // --- ADVANCED STATE ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState('All systems nominal. API Gateway latency: 45ms. Database pool health: 100%.');

  // --- RECRUITERS MOCK DATA (20 members) ---
  const [recruiters, setRecruiters] = useState<Recruiter[]>([
    { id: '1', name: 'Alex Sterling', email: 'a.sterling@gt-solutions.io', initials: 'AS', department: 'HR Leadership', role: 'Super Admin', permissions: 'Full Access', assignedJobs: 14, candidates: 248, interviews: 89, status: 'Active', lastLogin: '10 mins ago' },
    { id: '2', name: 'Marcus Wong', email: 'm.wong@gt-solutions.io', initials: 'MW', department: 'Engineering', role: 'Recruiter', permissions: 'Dept Only', assignedJobs: 8, candidates: 120, interviews: 45, status: 'Active', lastLogin: '2 hours ago' },
    { id: '3', name: 'Sarah Jenkins', email: 's.jenkins@gt-solutions.io', initials: 'SJ', department: 'Product Management', role: 'HR Manager', permissions: 'Dept Only', assignedJobs: 5, candidates: 84, interviews: 32, status: 'Active', lastLogin: 'Yesterday' },
    { id: '4', name: 'James Chen', email: 'j.chen@gt-solutions.io', initials: 'JC', department: 'Engineering', role: 'Interviewer', permissions: 'Read Only', assignedJobs: 0, candidates: 45, interviews: 56, status: 'Active', lastLogin: '3 days ago' },
    { id: '5', name: 'Elena Rostova', email: 'e.rostova@gt-solutions.io', initials: 'ER', department: 'Sales & Marketing', role: 'Recruiter', permissions: 'Full Access', assignedJobs: 11, candidates: 195, interviews: 64, status: 'Active', lastLogin: '5 mins ago' },
    { id: '6', name: 'Michael Brown', email: 'm.brown@gt-solutions.io', initials: 'MB', department: 'Finance', role: 'Hiring Manager', permissions: 'Read Only', assignedJobs: 2, candidates: 18, interviews: 12, status: 'Active', lastLogin: '1 week ago' },
    { id: '7', name: 'Priya Nair', email: 'p.nair@gt-solutions.io', initials: 'PN', department: 'Engineering', role: 'Recruiter', permissions: 'Dept Only', assignedJobs: 7, candidates: 140, interviews: 58, status: 'Active', lastLogin: '4 hours ago' },
    { id: '8', name: 'David Kim', email: 'd.kim@gt-solutions.io', initials: 'DK', department: 'Operations', role: 'Hiring Manager', permissions: 'Dept Only', assignedJobs: 4, candidates: 50, interviews: 22, status: 'Active', lastLogin: '2 days ago' },
    { id: '9', name: 'Claire Dubois', email: 'c.dubois@gt-solutions.io', initials: 'CD', department: 'Legal', role: 'Read-only User', permissions: 'Read Only', assignedJobs: 0, candidates: 5, interviews: 0, status: 'Active', lastLogin: 'Yesterday' },
    { id: '10', name: 'Robert Taylor', email: 'r.taylor@gt-solutions.io', initials: 'RT', department: 'Customer Success', role: 'Hiring Manager', permissions: 'Dept Only', assignedJobs: 3, candidates: 34, interviews: 19, status: 'Active', lastLogin: '5 days ago' },
    { id: '11', name: 'Zoe Vance', email: 'z.vance@gt-solutions.io', initials: 'ZV', department: 'Design', role: 'Interviewer', permissions: 'Read Only', assignedJobs: 1, candidates: 29, interviews: 41, status: 'Suspended', lastLogin: '2 weeks ago' },
    { id: '12', name: 'Liam O\'Connor', email: 'l.oconnor@gt-solutions.io', initials: 'LO', department: 'Engineering', role: 'Recruiter', permissions: 'Dept Only', assignedJobs: 6, candidates: 105, interviews: 37, status: 'Active', lastLogin: '1 hour ago' },
    { id: '13', name: 'Sofia Rodriguez', email: 's.rodriguez@gt-solutions.io', initials: 'SR', department: 'HR Operations', role: 'Recruiter', permissions: 'Full Access', assignedJobs: 9, candidates: 162, interviews: 70, status: 'Active', lastLogin: 'Just now' },
    { id: '14', name: 'Thomas Mueller', email: 't.mueller@gt-solutions.io', initials: 'TM', department: 'Engineering', role: 'Hiring Manager', permissions: 'Dept Only', assignedJobs: 3, candidates: 74, interviews: 30, status: 'Active', lastLogin: 'Yesterday' },
    { id: '15', name: 'Aisha Diallo', email: 'a.diallo@gt-solutions.io', initials: 'AD', department: 'Product Management', role: 'Interviewer', permissions: 'Read Only', assignedJobs: 0, candidates: 12, interviews: 15, status: 'Deactivated', lastLogin: '1 month ago' },
    { id: '16', name: 'William Turner', email: 'w.turner@gt-solutions.io', initials: 'WT', department: 'Sales & Marketing', role: 'Hiring Manager', permissions: 'Dept Only', assignedJobs: 4, candidates: 48, interviews: 25, status: 'Pending', lastLogin: 'Never' },
    { id: '17', name: 'Emma Watson', email: 'e.watson@gt-solutions.io', initials: 'EW', department: 'Design', role: 'Recruiter', permissions: 'Dept Only', assignedJobs: 5, candidates: 80, interviews: 35, status: 'Active', lastLogin: '3 hours ago' },
    { id: '18', name: 'Ryan Reynolds', email: 'r.reynolds@gt-solutions.io', initials: 'RR', department: 'Customer Success', role: 'Recruiter', permissions: 'Dept Only', assignedJobs: 8, candidates: 110, interviews: 48, status: 'Active', lastLogin: '2 days ago' },
    { id: '19', name: 'Jessica Alba', email: 'j.alba@gt-solutions.io', initials: 'JA', department: 'Legal', role: 'HR Manager', permissions: 'Full Access', assignedJobs: 2, candidates: 25, interviews: 8, status: 'Active', lastLogin: 'Yesterday' },
    { id: '20', name: 'Brad Pitt', email: 'b.pitt@gt-solutions.io', initials: 'BP', department: 'Operations', role: 'Interviewer', permissions: 'Read Only', assignedJobs: 0, candidates: 8, interviews: 10, status: 'Active', lastLogin: '3 hours ago' }
  ]);

  // Pagination recruiters state (5 per page)
  const [recruiterPage, setRecruiterPage] = useState(1);

  // --- DEPARTMENTS MOCK DATA (10 items) ---
  const departments: Department[] = [
    { name: 'Engineering', manager: 'Marcus Wong', headcount: 84, budget: '$1.2M' },
    { name: 'Product Management', manager: 'Sarah Jenkins', headcount: 18, budget: '$450K' },
    { name: 'HR Leadership & Talent', manager: 'Alex Sterling', headcount: 12, budget: '$320K' },
    { name: 'Design & Creative', manager: 'Emma Watson', headcount: 15, budget: '$280K' },
    { name: 'Sales & Marketing', manager: 'Elena Rostova', headcount: 45, budget: '$850K' },
    { name: 'Finance & Treasury', manager: 'Michael Brown', headcount: 8, budget: '$200K' },
    { name: 'Operations & Strategy', manager: 'David Kim', headcount: 22, budget: '$400K' },
    { name: 'Legal & Compliance', manager: 'Jessica Alba', headcount: 6, budget: '$180K' },
    { name: 'Customer Success', manager: 'Ryan Reynolds', headcount: 30, budget: '$380K' },
    { name: 'IT Infrastructure', manager: 'Liam O\'Connor', headcount: 14, budget: '$250K' }
  ];

  // --- OFFICES MOCK DATA (8 locations) ---
  const offices: OfficeLocation[] = [
    { city: 'San Francisco', country: 'United States', address: '100 Pine St, Floor 14', timezone: 'UTC-08:00 (PST)' },
    { city: 'London', country: 'United Kingdom', address: '30 Crown Place', timezone: 'UTC+00:00 (GMT)' },
    { city: 'Singapore', country: 'Singapore', address: '71 Robinson Road', timezone: 'UTC+08:00 (SGT)' },
    { city: 'Tokyo', country: 'Japan', address: 'Shibuya Scramble Square 28F', timezone: 'UTC+09:00 (JST)' },
    { city: 'Sydney', country: 'Australia', address: '120 Pitt Street', timezone: 'UTC+10:00 (AEST)' },
    { city: 'Berlin', country: 'Germany', address: 'Rosa-Luxemburg-Straße 14', timezone: 'UTC+01:00 (CET)' },
    { city: 'New York', country: 'United States', address: '530 Broadway, 4th Floor', timezone: 'UTC-05:00 (EST)' },
    { city: 'Toronto', country: 'Canada', address: '220 Bay Street', timezone: 'UTC-05:00 (EST)' }
  ];

  // --- INTEGRATIONS MOCK DATA (15 items) ---
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    { id: 'gcal', name: 'Google Calendar', category: 'Calendar & Scheduling', icon: 'calendar_month', status: 'Connected', lastSync: '12 mins ago' },
    { id: 'outlook', name: 'Microsoft Outlook', category: 'Calendar & Scheduling', icon: 'mail', status: 'Connected', lastSync: '1 hour ago' },
    { id: 'zoom', name: 'Zoom Video', category: 'Interviews & Video', icon: 'videocam', status: 'Connected', lastSync: '32 mins ago' },
    { id: 'teams', name: 'Microsoft Teams', category: 'Interviews & Video', icon: 'groups', status: 'Disconnected', lastSync: 'Never' },
    { id: 'slack', name: 'Slack Notifications', category: 'Messaging & Alerts', icon: 'chat', status: 'Connected', lastSync: '2 mins ago' },
    { id: 'linkedin', name: 'LinkedIn Recruiter', category: 'Job Boards', icon: 'share', status: 'Connected', lastSync: 'Just now' },
    { id: 'github', name: 'GitHub OAuth', category: 'Developer Source', icon: 'code', status: 'Connected', lastSync: '1 day ago' },
    { id: 'cloudinary', name: 'Cloudinary Media', category: 'Storage & Assets', icon: 'add_photo_alternate', status: 'Connected', lastSync: '12 hours ago' },
    { id: 'gemini', name: 'Gemini AI Engine', category: 'Artificial Intelligence', icon: 'token', status: 'Connected', lastSync: '5 mins ago' },
    { id: 'openai', name: 'OpenAI GPT-4', category: 'Artificial Intelligence', icon: 'psychology', status: 'Disconnected', lastSync: 'Never' },
    { id: 'gdrive', name: 'Google Drive', category: 'Storage', icon: 'database', status: 'Connected', lastSync: '4 hours ago' },
    { id: 'onedrive', name: 'OneDrive', category: 'Storage', icon: 'cloud', status: 'Disconnected', lastSync: 'Never' },
    { id: 'workday', name: 'Workday HRIS', category: 'HRIS & ATS', icon: 'business', status: 'Pending', lastSync: 'Never' },
    { id: 'greenhouse', name: 'Greenhouse ATS', category: 'HRIS & ATS', icon: 'assignment', status: 'Disconnected', lastSync: 'Never' },
    { id: 'atssync', name: 'CareerBridge Sync', category: 'HRIS & ATS', icon: 'sync', status: 'Connected', lastSync: 'Just now' }
  ]);

  // --- ACTIVITY LOGS MOCK DATA (100 items represented via state array) ---
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: '1', event: 'Two-Factor Authentication policy enforced for all recruiters.', user: 'Alex Sterling', time: '10 mins ago', type: 'security', severity: 'high' },
    { id: '2', event: 'LinkedIn Recruiter sync finished successfully.', user: 'LinkedIn Integration', time: '14 mins ago', type: 'integration', severity: 'low' },
    { id: '3', event: 'Gemini AI resume confidence threshold changed from 80% to 85%.', user: 'Alex Sterling', time: '22 mins ago', type: 'ai', severity: 'medium' },
    { id: '4', event: 'New recruiter invite sent to William Turner (w.turner@gt-solutions.io).', user: 'Sarah Jenkins', time: '1 hour ago', type: 'recruiter', severity: 'low' },
    { id: '5', event: 'Slack integration configuration updated.', user: 'Alex Sterling', time: '2 hours ago', type: 'integration', severity: 'low' },
    { id: '6', event: 'Invoice #INV-2026-004 exported to compliance folder.', user: 'Auto System', time: '3 hours ago', type: 'billing', severity: 'low' },
    { id: '7', event: 'Database automated system backup completed successfully.', user: 'Auto System', time: 'Yesterday', type: 'system', severity: 'low' },
    { id: '8', event: 'Failed login attempt detected from IP 192.168.1.14.', user: 'Security Daemon', time: 'Yesterday', type: 'security', severity: 'high' },
    { id: '9', event: 'New Hiring Team created for "Design & Creative" business unit.', user: 'Sarah Jenkins', time: '2 days ago', type: 'recruiter', severity: 'low' },
    { id: '10', event: 'Okta SSO Single Sign-On connector successfully configured.', user: 'Alex Sterling', time: '3 days ago', type: 'integration', severity: 'medium' }
  ]);

  // Timeline logs list (representing search/filtered 100 activity logs)
  const full100Logs: ActivityLog[] = Array.from({ length: 100 }, (_, i) => {
    const types: Array<'recruiter' | 'security' | 'integration' | 'ai' | 'billing' | 'system'> = ['recruiter', 'security', 'integration', 'ai', 'billing', 'system'];
    const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const users = ['Alex Sterling', 'Sarah Jenkins', 'Marcus Wong', 'Auto System', 'Security Daemon'];
    const events = [
      'Recruiter added to hiring dashboard.',
      'SSO permission settings altered.',
      'API keys rotated for environment.',
      'GDPR compliance compliance logs exported.',
      'Gemini AI candidate scoring performed.',
      'Backup created successfully.',
      'Slack notification triggered.',
      'Recruiter deactivated.',
      'Security alert: Unusual traffic threshold.'
    ];
    return {
      id: `log-${i + 1}`,
      event: events[i % events.length],
      user: users[i % users.length],
      time: `${i + 1} hours ago`,
      type: types[i % types.length],
      severity: severities[i % severities.length]
    };
  });

  // --- PERMISSIONS MATRIX ---
  const [permissionsMatrix, setPermissionsMatrix] = useState([
    { key: 'view_candidates', label: 'View Candidate Profiles', admin: true, recruiter: true, manager: true, interviewer: true, hr: true, readonly: true },
    { key: 'edit_candidates', label: 'Edit Candidate Profiles', admin: true, recruiter: true, manager: true, interviewer: false, hr: true, readonly: false },
    { key: 'create_jobs', label: 'Create & Edit Job Posts', admin: true, recruiter: true, manager: true, interviewer: false, hr: false, readonly: false },
    { key: 'approve_offers', label: 'Approve & Release Offers', admin: true, recruiter: false, manager: true, interviewer: false, hr: true, readonly: false },
    { key: 'manage_users', label: 'Invite & Manage Team Seats', admin: true, recruiter: false, manager: false, interviewer: false, hr: true, readonly: false },
    { key: 'billing_access', label: 'Manage Invoices & Plans', admin: true, recruiter: false, manager: false, interviewer: false, hr: false, readonly: false }
  ]);

  // Toggles for notifications
  const [notifConfig, setNotifConfig] = useState({
    emailInterviewAlerts: true,
    emailCandidateUpdates: true,
    emailRecruiterActivity: false,
    emailOffers: true,
    pushInterviewAlerts: true,
    pushCandidateUpdates: false,
    smsInterviewAlerts: false,
    smsSecurityAlerts: true,
    weeklyReports: true,
    monthlyReports: false
  });

  // Toggles for advanced feature flags
  const [advancedFlags, setAdvancedFlags] = useState({
    betaPipeline: true,
    scorecardV2: false,
    smartRecruitMode: true
  });

  // Toast actions helper
  const handleSave = () => {
    showToast('Enterprise settings saved successfully!', 'success');
  };

  const handleDiscard = () => {
    showToast('Enterprise settings discarded.', 'info');
  };

  const handleExport = () => {
    showToast('Exporting admin configuration dump...', 'success');
  };

  const handleImportSettings = () => {
    showToast('Launching settings importer...', 'info');
  };

  const handleCreateBackup = () => {
    const backupId = `CB-BKP-${Math.floor(100000 + Math.random() * 900000)}`;
    showToast(`Created backup bundle ${backupId}`, 'success');
    const newLog: ActivityLog = {
      id: `bkp-${Date.now()}`,
      event: `Manual backup bundle ${backupId} created successfully.`,
      user: 'Alex Sterling',
      time: 'Just now',
      type: 'system',
      severity: 'low'
    };
    setActivityLogs([newLog, ...activityLogs]);
  };

  const handleRestoreBackup = () => {
    showToast('Select a backup zip to restore...', 'info');
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(integrations.map(item => item.id === id ? { ...item, status: 'Disconnected' } : item));
    showToast(`Disconnected ${id} integration.`, 'info');
  };

  const handleReconnect = (id: string) => {
    setIntegrations(integrations.map(item => item.id === id ? { ...item, status: 'Connected', lastSync: 'Just now' } : item));
    showToast(`Reconnected and synced ${id} integration.`, 'success');
  };

  const handlePermissionsToggle = (key: string, field: 'admin' | 'recruiter' | 'manager' | 'interviewer' | 'hr' | 'readonly') => {
    setPermissionsMatrix(permissionsMatrix.map(row => {
      if (row.key === key) {
        const nextVal = !row[field];
        showToast(`Toggled permission for ${row.label}: ${field.toUpperCase()} is now ${nextVal ? 'ALLOWED' : 'DENIED'}`, 'info');
        return { ...row, [field]: nextVal };
      }
      return row;
    }));
  };

  // Recruiters Filter & Pagination
  const filteredRecruiters = recruiters.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchRecruiterQuery.toLowerCase()) || r.email.toLowerCase().includes(searchRecruiterQuery.toLowerCase());
    const matchesRole = recruiterFilterRole === 'All' || r.role === recruiterFilterRole;
    return matchesSearch && matchesRole;
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredRecruiters.length / itemsPerPage);
  const displayedRecruiters = filteredRecruiters.slice((recruiterPage - 1) * itemsPerPage, recruiterPage * itemsPerPage);

  const handleRecruiterAction = (id: string, action: string) => {
    showToast(`Performing recruiter action: "${action}" on recruiter ID ${id}`, 'info');
    if (action === 'suspend') {
      setRecruiters(recruiters.map(r => r.id === id ? { ...r, status: 'Suspended' } : r));
    } else if (action === 'activate') {
      setRecruiters(recruiters.map(r => r.id === id ? { ...r, status: 'Active' } : r));
    } else if (action === 'deactivate') {
      setRecruiters(recruiters.map(r => r.id === id ? { ...r, status: 'Deactivated' } : r));
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden animate-slide-up text-left text-on-surface">
      {/* LEFT COLUMN: Main Admin Settings Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-margin-desktop bg-background pb-stack-lg">
        
        {/* Page Title & Controls */}
        <div className="flex flex-col xl:flex-row items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="font-display text-headline-lg text-primary font-bold mb-2">Enterprise Admin Settings</h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl text-xs">
              Manage organization preferences, workspace profile, pipeline structures, integrations, billing ledger, AI configuration parameters, and database policies.
            </p>
          </div>
          
          {/* Top Actions Grid */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button 
              onClick={handleDiscard}
              className="px-4 py-2.5 rounded-lg border border-outline text-primary hover:bg-surface-container transition-all cursor-pointer bg-white"
            >
              Discard Changes
            </button>
            <button 
              onClick={handleExport}
              className="px-4 py-2.5 rounded-lg bg-surface-container-highest text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              Export
            </button>
            <button 
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/10 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Extended Tools Bar */}
        <div className="bg-surface-container-low border border-primary/5 rounded-xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleImportSettings} 
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded border border-primary/10 hover:bg-surface-container transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span> Import Settings
            </button>
            <button 
              onClick={handleCreateBackup} 
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded border border-primary/10 hover:bg-surface-container transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">backup</span> Create Backup
            </button>
            <button 
              onClick={handleRestoreBackup} 
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded border border-primary/10 hover:bg-surface-container transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">restore</span> Restore Backup
            </button>
          </div>
          <button 
            onClick={() => setAuditLogDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/5 text-primary rounded border border-primary/10 hover:bg-primary/10 transition-all cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-sm">pageview</span> View Audit Logs
          </button>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-outline-variant mb-8 overflow-x-auto no-scrollbar scroll-smooth">
          {(['general', 'organization', 'recruitment', 'recruiters', 'permissions', 'security', 'notifications', 'ai', 'integrations', 'billing', 'branding', 'compliance', 'advanced'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  showToast(`Viewing ${tab.toUpperCase()} dashboard.`, 'info');
                }}
                className={`px-4 py-3 font-label-md transition-all border-b-2 whitespace-nowrap cursor-pointer text-xs capitalize font-bold ${
                  isActive 
                    ? 'border-primary text-primary font-extrabold' 
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab === 'recruiters' ? (
                  <>
                    Recruiters <span className="bg-surface-container text-primary px-1.5 py-0.5 rounded text-[10px] ml-1">20</span>
                  </>
                ) : tab === 'ai' ? (
                  <span className="flex items-center gap-1">
                    AI Settings <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                  </span>
                ) : (
                  tab
                )}
              </button>
            );
          })}
        </div>

        {/* WORKSPACE SWITCHER CONTAINER */}
        <div className="space-y-6">
          
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <h3 className="font-headline-md text-primary font-bold mb-6">Organization Profile Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Company Name</label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Industry Segment</label>
                    <input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Company Size</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                    >
                      <option>1-10 Employees</option>
                      <option>11-50 Employees</option>
                      <option>51-200 Employees</option>
                      <option>201-500 Employees</option>
                      <option>501-1000 Employees</option>
                      <option>1001-5000 Employees</option>
                      <option>5,000+ Employees</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Corporate Website</label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Headquarters Address</label>
                    <input
                      value={hq}
                      onChange={(e) => setHq(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Corporate Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                    >
                      <option>UTC-08:00 (Pacific Time)</option>
                      <option>UTC-05:00 (Eastern Time)</option>
                      <option>UTC+00:00 (Greenwich Mean Time)</option>
                      <option>UTC+08:00 (Singapore Time)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Default Workspace Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                    >
                      <option>USD ($)</option>
                      <option>GBP (£)</option>
                      <option>EUR (€)</option>
                      <option>SGD (S$)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Workspace Language</label>
                    <input
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Default Business Hours</label>
                    <input
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      type="text"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 mt-6">
                  <label className="font-label-sm text-on-surface-variant font-bold text-xs">Company Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Corporate Mission Statement</label>
                    <textarea
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none h-20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label-sm text-on-surface-variant font-bold text-xs">Corporate Vision Statement</label>
                    <textarea
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none h-20"
                    />
                  </div>
                </div>

                {/* Social media links */}
                <div className="mt-8 pt-6 border-t border-outline-variant/10">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-4">Corporate Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-on-surface-variant text-[11px] font-bold">LinkedIn</label>
                      <input
                        value={socialLinks.linkedin}
                        onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                        className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2 px-3 text-xs outline-none focus:border-primary"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-on-surface-variant text-[11px] font-bold">Twitter / X</label>
                      <input
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                        className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2 px-3 text-xs outline-none focus:border-primary"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-on-surface-variant text-[11px] font-bold">GitHub Org</label>
                      <input
                        value={socialLinks.github}
                        onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                        className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2 px-3 text-xs outline-none focus:border-primary"
                        type="text"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo and banner upload simulator */}
                <div className="flex flex-col sm:flex-row gap-6 mt-8 pt-6 border-t border-outline-variant/10">
                  <div className="flex-1 space-y-4">
                    <label className="font-semibold text-xs text-on-surface-variant">Company Logo Asset</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center border border-dashed border-outline">
                        <span className="material-symbols-outlined text-outline">add_photo_alternate</span>
                      </div>
                      <div>
                        <p onClick={() => showToast('Opening logo uploader...', 'info')} className="text-sm font-bold text-primary cursor-pointer hover:underline">Upload logo</p>
                        <p className="text-[10px] text-on-surface-variant">SVG/PNG, recommended square.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <label className="font-semibold text-xs text-on-surface-variant">Header Banner Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-16 rounded-xl bg-surface-container flex items-center justify-center border border-dashed border-outline overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-secondary opacity-25"></div>
                        <span className="material-symbols-outlined text-outline relative z-10">edit</span>
                      </div>
                      <div>
                        <p onClick={() => showToast('Opening banner image editor...', 'info')} className="text-sm font-bold text-primary cursor-pointer hover:underline">Upload Banner</p>
                        <p className="text-[10px] text-on-surface-variant">Recommended 1200x400.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION CONFIG */}
          {activeTab === 'organization' && (
            <div className="space-y-6">
              {/* Departments grid */}
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline-md text-primary font-bold">Corporate Departments ({departments.length})</h3>
                  <button 
                    onClick={() => showToast('Opening Department builder modal...', 'info')}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    + Add Department
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((dept, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-primary/5 bg-background flex justify-between items-center">
                      <div>
                        <p className="font-bold text-primary text-sm">{dept.name}</p>
                        <p className="text-xs text-on-surface-variant">Manager: {dept.manager}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-bold text-primary">{dept.headcount} Headcount</p>
                        <p className="text-on-surface-variant text-[10px]">Budget: {dept.budget}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Office Locations */}
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline-md text-primary font-bold">Office Locations ({offices.length})</h3>
                  <button 
                    onClick={() => showToast('Opening Office Manager drawer...', 'info')}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    + Add Office
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {offices.map((office, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-primary/5 bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-primary text-sm">{office.city}</p>
                        <span className="px-2 py-0.5 bg-surface-container text-[9px] font-bold text-primary rounded">{office.country}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{office.address}</p>
                      <p className="text-[10px] text-primary/75 mt-1 font-semibold">{office.timezone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hiring teams & default recruiters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 card-ambient shadow-sm">
                  <h4 className="font-bold text-primary text-sm mb-4">Organizational Hierarchy & teams</h4>
                  <div className="space-y-3 text-xs text-on-surface">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-primary/5">
                      <span>Default Org Recruiter</span>
                      <span className="font-bold text-primary">Alex Sterling</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-primary/5">
                      <span>Total Active Hiring Teams</span>
                      <span className="font-bold text-primary">14 Teams</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-primary/5">
                      <span>Primary Recruitment Region</span>
                      <span className="font-bold text-primary">North America (AMER)</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 card-ambient shadow-sm">
                  <h4 className="font-bold text-primary text-sm mb-4">Employment Types Configuration</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['Full-Time (W2)', 'Part-Time', 'Contractor (1099)', 'Temporary', 'Internship', 'Co-op'].map((type, i) => (
                      <span key={i} className="px-2.5 py-1 bg-surface-container rounded-md text-primary font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer">{type}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECRUITMENT SETTINGS */}
          {activeTab === 'recruitment' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <h3 className="font-headline-md text-primary font-bold mb-6">Default Hiring Pipeline Stages</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {['1. Application Review', '2. Resume Screening', '3. Technical Test', '4. Panel Interview', '5. Executive Sync', '6. Offer Release'].map((stage, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="px-3.5 py-2.5 bg-primary/5 text-primary border border-primary/10 rounded-xl font-bold">{stage}</span>
                      {i < 5 && <span className="material-symbols-outlined text-outline">arrow_forward</span>}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => showToast('Opening pipeline editor...', 'info')}
                  className="mt-6 text-xs text-primary font-bold hover:underline cursor-pointer bg-transparent border-none"
                >
                  Edit pipeline stages configuration →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 card-ambient shadow-sm">
                  <h4 className="font-bold text-primary text-sm mb-4">Recruitment Expirations & Retention</h4>
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span>Candidate Data Retention Policy</span>
                      <select className="bg-background border border-primary/10 rounded p-1">
                        <option>365 Days</option>
                        <option>730 Days</option>
                        <option>Infinite</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Standard Job Post Expiration</span>
                      <select className="bg-background border border-primary/10 rounded p-1">
                        <option>30 Days</option>
                        <option>60 Days</option>
                        <option>90 Days</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Resume Privacy Visibility</span>
                      <select className="bg-background border border-primary/10 rounded p-1">
                        <option>Assigned Hiring Team Only</option>
                        <option>All Organization Recruiters</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 card-ambient shadow-sm">
                  <h4 className="font-bold text-primary text-sm mb-4">Duplicate Candidate Matching & Assignment</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded bg-background border border-primary/5">
                      <span>Duplicate Candidate Scan on Email</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">ENABLED</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-background border border-primary/5">
                      <span>Auto-Assign Candidates by Dept</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">ENABLED</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-background border border-primary/5">
                      <span>Referral Matching Rules Auto-Verify</span>
                      <span className="px-2 py-0.5 bg-outline-variant/60 text-on-surface-variant text-[10px] font-black rounded">PENDING</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECRUITERS LIST */}
          {activeTab === 'recruiters' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl card-ambient shadow-sm overflow-hidden">
                
                {/* Search / Filter header */}
                <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full max-w-sm group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                    <input
                      value={searchRecruiterQuery}
                      onChange={(e) => setSearchRecruiterQuery(e.target.value)}
                      placeholder="Search recruiter name or email..."
                      className="w-full bg-surface-container-low border border-primary/10 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary"
                      type="text"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <select
                      value={recruiterFilterRole}
                      onChange={(e) => setRecruiterFilterRole(e.target.value)}
                      className="bg-surface-container-low border border-primary/10 rounded-xl py-2 px-3 font-semibold outline-none"
                    >
                      <option value="All">All Roles</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Recruiter">Recruiter</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Hiring Manager">Hiring Manager</option>
                      <option value="Interviewer">Interviewer</option>
                    </select>

                    <button 
                      onClick={() => setInviteModalOpen(true)}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span> Invite Recruiter
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-background text-xs font-bold text-on-surface-variant">
                      <tr>
                        <th className="px-6 py-4 border-b border-outline-variant">Recruiter</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Department</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Role</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Jobs</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Candidates</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Interviews</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Status</th>
                        <th className="px-6 py-4 border-b border-outline-variant">Last Login</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-xs font-semibold">
                      {displayedRecruiters.map((rec) => (
                        <tr key={rec.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-container text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {rec.initials}
                              </div>
                              <div>
                                <p className="font-bold text-primary">{rec.name}</p>
                                <p className="text-[10px] text-on-surface-variant font-medium">{rec.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{rec.department}</td>
                          <td className="px-6 py-4">{rec.role}</td>
                          <td className="px-6 py-4 text-primary font-bold">{rec.assignedJobs}</td>
                          <td className="px-6 py-4 text-primary font-bold">{rec.candidates}</td>
                          <td className="px-6 py-4 text-primary font-bold">{rec.interviews}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              rec.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                              rec.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                              rec.status === 'Deactivated' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface-variant'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant text-[10px]">{rec.lastLogin}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left">
                              <button 
                                onClick={() => setActiveRecruiterId(activeRecruiterId === rec.id ? null : rec.id)}
                                className="material-symbols-outlined text-outline hover:text-primary cursor-pointer bg-transparent border-none p-1"
                              >
                                more_vert
                              </button>
                              
                              {/* Inline actions dropdown */}
                              {activeRecruiterId === rec.id && (
                                <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white border border-primary/10 shadow-lg z-50 py-1 font-bold text-xs text-left">
                                  <button onClick={() => { handleRecruiterAction(rec.id, 'edit'); setActiveRecruiterId(null); }} className="w-full px-4 py-2 hover:bg-surface-container text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none"><span className="material-symbols-outlined text-sm">edit</span> Edit</button>
                                  <button onClick={() => { handleRecruiterAction(rec.id, 'suspend'); setActiveRecruiterId(null); }} className="w-full px-4 py-2 hover:bg-surface-container text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none"><span className="material-symbols-outlined text-sm">pause</span> Suspend</button>
                                  <button onClick={() => { handleRecruiterAction(rec.id, 'deactivate'); setActiveRecruiterId(null); }} className="w-full px-4 py-2 hover:bg-surface-container text-error flex items-center gap-2 cursor-pointer bg-transparent border-none"><span className="material-symbols-outlined text-sm">block</span> Deactivate</button>
                                  <button onClick={() => { handleRecruiterAction(rec.id, 'reset'); setActiveRecruiterId(null); }} className="w-full px-4 py-2 hover:bg-surface-container text-primary flex items-center gap-2 cursor-pointer bg-transparent border-none"><span className="material-symbols-outlined text-sm">lock_reset</span> Reset Password</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-outline-variant/30 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                  <span>Showing {(recruiterPage - 1) * itemsPerPage + 1} - {Math.min(recruiterPage * itemsPerPage, filteredRecruiters.length)} of {filteredRecruiters.length} recruiters</span>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={recruiterPage === 1}
                      onClick={() => setRecruiterPage(recruiterPage - 1)}
                      className="px-3 py-1.5 border border-primary/10 rounded-lg hover:bg-surface-container disabled:opacity-50 cursor-pointer bg-white"
                    >
                      Previous
                    </button>
                    <span>Page {recruiterPage} of {totalPages}</span>
                    <button 
                      disabled={recruiterPage === totalPages}
                      onClick={() => setRecruiterPage(recruiterPage + 1)}
                      className="px-3 py-1.5 border border-primary/10 rounded-lg hover:bg-surface-container disabled:opacity-50 cursor-pointer bg-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ROLES & PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <h3 className="font-headline-md text-primary font-bold mb-2">Workspace Permission Control Matrix</h3>
                <p className="text-xs text-on-surface-variant mb-6">Manage default capabilities across all defined enterprise roles.</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-background text-xs font-bold text-on-surface-variant">
                      <tr>
                        <th className="px-6 py-4 border-b border-outline-variant">Permission Area</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-center">Super Admin</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-center">Recruiter</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-center">HR Manager</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-center">Hiring Manager</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-center">Interviewer</th>
                        <th className="px-6 py-4 border-b border-outline-variant text-center">Read-Only</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-xs font-semibold">
                      {permissionsMatrix.map((row) => (
                        <tr key={row.key} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4 text-primary font-bold">{row.label}</td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={row.admin} 
                              onChange={() => handlePermissionsToggle(row.key, 'admin')} 
                              className="rounded text-primary focus:ring-primary border-outline-variant cursor-pointer w-4 h-4" 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={row.recruiter} 
                              onChange={() => handlePermissionsToggle(row.key, 'recruiter')} 
                              className="rounded text-primary focus:ring-primary border-outline-variant cursor-pointer w-4 h-4" 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={row.hr} 
                              onChange={() => handlePermissionsToggle(row.key, 'hr')} 
                              className="rounded text-primary focus:ring-primary border-outline-variant cursor-pointer w-4 h-4" 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={row.manager} 
                              onChange={() => handlePermissionsToggle(row.key, 'manager')} 
                              className="rounded text-primary focus:ring-primary border-outline-variant cursor-pointer w-4 h-4" 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={row.interviewer} 
                              onChange={() => handlePermissionsToggle(row.key, 'interviewer')} 
                              className="rounded text-primary focus:ring-primary border-outline-variant cursor-pointer w-4 h-4" 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={row.readonly} 
                              onChange={() => handlePermissionsToggle(row.key, 'readonly')} 
                              className="rounded text-primary focus:ring-primary border-outline-variant cursor-pointer w-4 h-4" 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 card-ambient shadow-sm space-y-6">
                  <h4 className="font-bold text-primary text-sm flex items-center gap-2"><span className="material-symbols-outlined text-primary">security</span> Password Policy Configuration</h4>
                  
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Minimum Password Length</span>
                        <span className="font-bold text-primary">{passwordMinLength} characters</span>
                      </div>
                      <input 
                        type="range" 
                        min="8" 
                        max="24" 
                        value={passwordMinLength} 
                        onChange={(e) => setPasswordMinLength(parseInt(e.target.value))} 
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Password Expiration Threshold</span>
                        <span className="font-bold text-primary">{passwordExpiration} Days</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="180" 
                        value={passwordExpiration} 
                        onChange={(e) => setPasswordExpiration(parseInt(e.target.value))} 
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Session Idle Timeout</span>
                        <span className="font-bold text-primary">{sessionTimeout}</span>
                      </div>
                      <select
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2 px-3 focus:border-primary outline-none text-xs"
                      >
                        <option>15 Minutes</option>
                        <option>30 Minutes</option>
                        <option>60 Minutes</option>
                        <option>4 Hours</option>
                        <option>24 Hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 card-ambient shadow-sm space-y-4">
                  <h4 className="font-bold text-primary text-sm flex items-center gap-2"><span className="material-symbols-outlined text-primary">gpp_maybe</span> Authentication Toggles</h4>
                  
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-primary/5">
                      <div>
                        <p className="text-primary font-bold">Two-Factor Authentication (MFA)</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">Enforce for all active recruiters</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setTwoFactorAuth(!twoFactorAuth); showToast(`MFA is now ${!twoFactorAuth ? 'ENABLED' : 'DISABLED'}.`, 'success'); }} 
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none border-none ${twoFactorAuth ? 'bg-primary' : 'bg-outline-variant'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}`}></span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-primary/5">
                      <div>
                        <p className="text-primary font-bold">Single Sign-On (SAML / Okta)</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">Allow login via Okta or Azure AD</p>
                      </div>
                      <button 
                        onClick={() => showToast('Configuring Okta SAML payload...', 'info')}
                        className="px-3 py-1 bg-white border border-primary/10 rounded font-bold hover:bg-surface-container cursor-pointer text-xs"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* IP Whitelist & API keys */}
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <h3 className="font-headline-md text-primary font-bold mb-4">Enterprise API Keys & trusted domains</h3>
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-background rounded border border-primary/5 flex justify-between items-center">
                    <div>
                      <p className="font-mono font-bold text-primary">live_pk_3f92d8f921ea...</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Production ATS Integration Key (Created: 2 weeks ago)</p>
                    </div>
                    <button onClick={() => showToast('Rotated API Key.', 'success')} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none">Rotate Key</button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-on-surface-variant block">IP Whitelisting (CIDR notation)</label>
                    <input
                      defaultValue="192.168.1.1/24, 10.0.0.1/16"
                      className="w-full bg-surface-container-low border border-primary/10 rounded-lg py-2.5 px-4 text-body-md focus:border-primary focus:ring-0 outline-none"
                      placeholder="e.g. 192.168.1.1/24"
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <h3 className="font-headline-md text-primary font-bold mb-6">Subscription Alert Settings</h3>
                <div className="space-y-6 text-xs font-semibold">
                  
                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-primary font-bold uppercase tracking-wider text-[11px]">Email Notifications</h4>
                      <div className="flex items-center justify-between">
                        <span>Interview Scheduling Alerts</span>
                        <input 
                          type="checkbox" 
                          checked={notifConfig.emailInterviewAlerts} 
                          onChange={() => setNotifConfig({ ...notifConfig, emailInterviewAlerts: !notifConfig.emailInterviewAlerts })}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Candidate Pipeline Updates</span>
                        <input 
                          type="checkbox" 
                          checked={notifConfig.emailCandidateUpdates} 
                          onChange={() => setNotifConfig({ ...notifConfig, emailCandidateUpdates: !notifConfig.emailCandidateUpdates })}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Weekly Summary Reports</span>
                        <input 
                          type="checkbox" 
                          checked={notifConfig.weeklyReports} 
                          onChange={() => setNotifConfig({ ...notifConfig, weeklyReports: !notifConfig.weeklyReports })}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-primary font-bold uppercase tracking-wider text-[11px]">Push & SMS Channels</h4>
                      <div className="flex items-center justify-between">
                        <span>Interview Push Alerts</span>
                        <input 
                          type="checkbox" 
                          checked={notifConfig.pushInterviewAlerts} 
                          onChange={() => setNotifConfig({ ...notifConfig, pushInterviewAlerts: !notifConfig.pushInterviewAlerts })}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Security & Login SMS Alerts</span>
                        <input 
                          type="checkbox" 
                          checked={notifConfig.smsSecurityAlerts} 
                          onChange={() => setNotifConfig({ ...notifConfig, smsSecurityAlerts: !notifConfig.smsSecurityAlerts })}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AI CONFIGURATION */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient overflow-hidden relative shadow-sm">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                <h3 className="font-headline-md text-primary font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Gemini AI Enterprise Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="p-5 rounded-xl bg-primary-container text-white space-y-3">
                    <p className="font-bold text-xs uppercase tracking-wider text-primary-fixed">Resume Parsing Confidence Threshold</p>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        value={resumeConfidence} 
                        onChange={(e) => setResumeConfidence(parseInt(e.target.value))}
                        className="flex-1 accent-primary-fixed cursor-pointer"
                      />
                      <span className="text-xl font-bold">{resumeConfidence}%</span>
                    </div>
                    <p className="text-[10px] opacity-85 leading-relaxed">Auto-shortlists matches above this probability factor.</p>
                  </div>

                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                      <span>Enable AI Bias Shield</span>
                      <input 
                        type="checkbox" 
                        checked={biasShieldEnabled}
                        onChange={() => setBiasShieldEnabled(!biasShieldEnabled)}
                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                      <span>Smart Matching Optimization</span>
                      <input 
                        type="checkbox" 
                        checked={aiMatchingEnabled}
                        onChange={() => setAiMatchingEnabled(!aiMatchingEnabled)}
                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                      <span>Enable AI Suggestions</span>
                      <input 
                        type="checkbox" 
                        checked={aiSuggestionsEnabled}
                        onChange={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                      <span>Active Prompt Version</span>
                      <input 
                        type="text" 
                        value={promptVersion}
                        onChange={(e) => setPromptVersion(e.target.value)}
                        className="bg-surface-container-low border border-primary/10 rounded-md py-1 px-2 text-xs outline-none focus:border-primary text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs font-bold">
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">Credits remaining</p>
                    <p className="text-lg text-primary mt-1">4,200 / 5,000</p>
                  </div>
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">Average Match Accuracy</p>
                    <p className="text-lg text-primary mt-1">94.8%</p>
                  </div>
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">AI Model status</p>
                    <p className="text-lg text-primary mt-1 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-primary font-bold">Workspace App Directory ({integrations.length})</h3>
                <span className="text-xs font-semibold text-on-surface-variant">Active: {integrations.filter(i => i.status === 'Connected').length} apps</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {integrations.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl card-ambient shadow-sm flex flex-col justify-between h-60">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold text-xl">
                          <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-primary text-sm">{item.name}</h4>
                          <span className="text-[10px] text-on-surface-variant font-medium">{item.category}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">Connect {item.name} with CareerBridge for real-time ATS operations synchronizations.</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs font-bold">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          item.status === 'Connected' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {item.status}
                        </span>
                        {item.status === 'Connected' && <p className="text-[8px] text-on-surface-variant mt-1">Sync: {item.lastSync}</p>}
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'Connected' ? (
                          <>
                            <button onClick={() => handleDisconnect(item.id)} className="text-error font-bold hover:underline cursor-pointer bg-transparent border-none text-[10px]">Disconnect</button>
                            <button onClick={() => showToast(`Configuring ${item.name}...`, 'info')} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none text-[10px]">Configure</button>
                          </>
                        ) : (
                          <button onClick={() => handleReconnect(item.id)} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none text-[10px]">Reconnect</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-headline-md text-primary font-bold">Enterprise Subscription</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Plan tier: CareerBridge Platinum Enterprise Suite</p>
                  </div>
                  <button 
                    onClick={() => showToast('Upgrading plan tier...', 'success')}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 cursor-pointer border-none"
                  >
                    Upgrade Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-bold mb-6">
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">Recruiter Seats</p>
                    <p className="text-base text-primary mt-1">18 / 20 Seats Used</p>
                  </div>
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">Enterprise Storage</p>
                    <p className="text-base text-primary mt-1">1.2 TB / 5 TB Used</p>
                  </div>
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">Current AI Credits</p>
                    <p className="text-base text-primary mt-1">4.2k / 5k Credits</p>
                  </div>
                  <div className="p-4 bg-background border border-primary/5 rounded-xl">
                    <p className="text-on-surface-variant text-[10px] uppercase">Next Renewal Date</p>
                    <p className="text-base text-primary mt-1">Nov 1, 2026</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between text-xs font-bold text-primary">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">credit_card</span>
                    <span>Primary Card: Visa ending in 4920 (Expires: 12/28)</span>
                  </div>
                  <button onClick={() => showToast('Opening payment methods...', 'info')} className="hover:underline cursor-pointer bg-transparent border-none text-xs text-primary font-bold">Manage payment methods</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm">
                <h3 className="font-headline-md text-primary font-bold mb-6">Theme & Career Page Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant block">Primary Brand Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)} 
                        className="w-10 h-10 rounded border cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)} 
                        className="w-full bg-surface-container-low border border-primary/10 rounded px-2 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant block">Secondary Brand Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)} 
                        className="w-10 h-10 rounded border cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)} 
                        className="w-full bg-surface-container-low border border-primary/10 rounded px-2 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant block">Accent Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={accentColor} 
                        onChange={(e) => setAccentColor(e.target.value)} 
                        className="w-10 h-10 rounded border cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={accentColor} 
                        onChange={(e) => setAccentColor(e.target.value)} 
                        className="w-full bg-surface-container-low border border-primary/10 rounded px-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/10 text-xs font-semibold text-primary space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Career Page Custom Subdomain</span>
                    <span className="font-bold">globaltech.careerbridge.io</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email templates custom signature</span>
                    <button onClick={() => showToast('Opening Email Signature builder...', 'info')} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none text-xs">Edit email signatures</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm space-y-6">
                <h3 className="font-headline-md text-primary font-bold">Privacy & Compliance Dashboard</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                  <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                    <div>
                      <p className="text-primary font-bold">GDPR Anonymization Policy</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Anonymize candidate files after data retention expiry</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={gdprConsent}
                      onChange={() => setGdprConsent(!gdprConsent)}
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                    <div>
                      <p className="text-primary font-bold">CCPA Opt-Out Compliance</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Provide candidates dynamic data export flows</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={ccpaConsent}
                      onChange={() => setCcpaConsent(!ccpaConsent)}
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>GDPR Data Retention Period</span>
                    <span className="font-bold text-primary">{dataRetentionDays} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min="90" 
                    max="1095" 
                    value={dataRetentionDays} 
                    onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Export full candidate registry GDPR CSV</span>
                  <button onClick={() => showToast('Preparing GDPR Candidate data export...', 'success')} className="px-3.5 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg hover:bg-primary/10 cursor-pointer font-bold">Export Data</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: ADVANCED CONFIG */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 card-ambient shadow-sm space-y-6">
                <h3 className="font-headline-md text-primary font-bold">Workspace Maintenance & Feature Flags</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                  <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-primary/5">
                    <div>
                      <p className="text-primary font-bold">Maintenance Mode</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Restrict recruiter login during dashboard upgrades</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setMaintenanceMode(!maintenanceMode); showToast(`Maintenance mode is now ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}.`, 'info'); }} 
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none border-none ${maintenanceMode ? 'bg-primary' : 'bg-outline-variant'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`}></span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-primary font-bold uppercase tracking-wider text-[10px]">Active Feature Flags</p>
                    <div className="flex justify-between items-center text-xs">
                      <span>Beta Hiring Pipeline V2</span>
                      <input 
                        type="checkbox" 
                        checked={advancedFlags.betaPipeline}
                        onChange={() => setAdvancedFlags({ ...advancedFlags, betaPipeline: !advancedFlags.betaPipeline })}
                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Auto-Scorecard Summaries</span>
                      <input 
                        type="checkbox" 
                        checked={advancedFlags.scorecardV2}
                        onChange={() => setAdvancedFlags({ ...advancedFlags, scorecardV2: !advancedFlags.scorecardV2 })}
                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/10 space-y-4">
                  <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Workspace System Diagnostics</h4>
                  <pre className="bg-surface-container-low p-4 rounded-xl text-xs font-mono border border-primary/10 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                    {diagnosticsLogs}
                  </pre>
                  <button 
                    onClick={() => { setDiagnosticsLogs(prev => prev + '\n' + `[${new Date().toLocaleTimeString()}] Diagnostics refresh: latency 42ms. Health 100% OK.`); showToast('Refreshed diagnostic logs.', 'success'); }}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs rounded-lg font-bold hover:opacity-90 cursor-pointer border-none"
                  >
                    Run Diagnostics Check
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: Health, Quick Actions, Activity Timeline */}
      <aside className="w-85 border-l border-outline-variant bg-surface flex flex-col p-6 hidden xl:flex shrink-0 overflow-y-auto custom-scrollbar">
        
        {/* Enterprise Health Score */}
        <div className="mb-8">
          <h4 className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px] mb-4 font-bold">Enterprise Health Metrics</h4>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white card-ambient shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-on-surface-variant font-semibold text-xs">Security Compliance Score</span>
                <span className="font-bold text-emerald-600 text-xs">94%</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[94%]"></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white card-ambient shadow-sm">
              <div className="flex items-center justify-between mb-2 text-xs font-bold">
                <span className="text-on-surface-variant">Workspace Health Index</span>
                <span className="text-primary">96%</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[96%]"></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white card-ambient shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-on-surface-variant font-semibold text-xs">Monthly API Status Latency</span>
                <span className="font-bold text-emerald-600 text-xs">Active (45ms)</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mb-8">
          <h4 className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px] mb-4 font-bold">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            <button 
              onClick={() => setInviteModalOpen(true)}
              className="p-3 bg-white border border-primary/5 hover:bg-surface-container rounded-xl flex flex-col gap-1 text-primary cursor-pointer text-left transition-colors"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Invite Recruiter</span>
            </button>
            <button 
              onClick={() => { setActiveTab('organization'); showToast('Opening Department builder...', 'info'); }}
              className="p-3 bg-white border border-primary/5 hover:bg-surface-container rounded-xl flex flex-col gap-1 text-primary cursor-pointer text-left transition-colors"
            >
              <span className="material-symbols-outlined text-sm">business</span>
              <span>Create Dept</span>
            </button>
            <button 
              onClick={() => { setActiveTab('ai'); showToast('AI analytics launched.', 'success'); }}
              className="p-3 bg-white border border-primary/5 hover:bg-surface-container rounded-xl flex flex-col gap-1 text-primary cursor-pointer text-left transition-colors"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span>Manage AI</span>
            </button>
            <button 
              onClick={() => { setActiveTab('billing'); showToast('Redirecting to payments ledger...', 'info'); }}
              className="p-3 bg-white border border-primary/5 hover:bg-surface-container rounded-xl flex flex-col gap-1 text-primary cursor-pointer text-left transition-colors"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>Manage Billing</span>
            </button>
          </div>
        </div>

        {/* Recent Activity timeline */}
        <div className="mt-auto flex-1 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar">
          <h4 className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px] mb-4 font-bold sticky top-0 bg-surface z-10">Audit Log Timeline</h4>
          <div className="space-y-4 text-xs font-semibold">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3 relative">
                <div className="absolute left-1.5 top-5 bottom-0 w-px bg-outline-variant/30"></div>
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                  log.severity === 'high' ? 'bg-error animate-pulse' :
                  log.severity === 'medium' ? 'bg-primary' : 'bg-outline-variant'
                }`}></div>
                <div>
                  <p className="text-primary font-bold leading-normal">{log.event}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{log.user} • {log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* DRAWER: Comprehensive Audit Logs Viewer (100 Logs) */}
      {auditLogDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-8 text-left animate-slide-left">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
              <div>
                <h3 className="font-headline-md text-primary font-bold">Enterprise Audit Logs</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Showing 100 recent system activity events</p>
              </div>
              <button 
                onClick={() => setAuditLogDrawerOpen(false)}
                className="material-symbols-outlined text-primary cursor-pointer border-none bg-transparent hover:text-red-500"
              >
                close
              </button>
            </div>
            
            {/* Search within Drawer */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                placeholder="Search audit logs..."
                className="w-full bg-surface-container-low border border-primary/10 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-primary"
                type="text"
                value={searchLogsQuery}
                onChange={(e) => setSearchLogsQuery(e.target.value)}
              />
            </div>

            {/* Scrollable logs list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {full100Logs.filter(log => 
                log.event.toLowerCase().includes(searchLogsQuery.toLowerCase()) || 
                log.user.toLowerCase().includes(searchLogsQuery.toLowerCase())
              ).map((log, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-primary/5 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.severity === 'high' ? 'bg-error' :
                    log.severity === 'medium' ? 'bg-primary' : 'bg-outline-variant'
                  }`}></div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-primary leading-normal">{log.event}</p>
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1">
                      <span>Operator: {log.user}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/30 text-right">
              <button 
                onClick={() => { showToast('Audit logs exported successfully.', 'success'); setAuditLogDrawerOpen(false); }}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invite Recruiter */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-scale-up text-left">
            <h3 className="font-headline-md text-primary font-bold mb-2">Invite Recruiter</h3>
            <p className="text-xs text-on-surface-variant mb-6">Send an invite token to add a member to the corporate workspace.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              showToast('Invite sent to recruiter successfully!', 'success');
              setInviteModalOpen(false);
            }} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-on-surface-variant">Full Name</label>
                <input 
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface-container-low border border-primary/10 rounded-xl py-2 px-3 outline-none focus:border-primary"
                  type="text" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-on-surface-variant">Work Email Address</label>
                <input 
                  required
                  placeholder="e.g. j.doe@gt-solutions.io"
                  className="w-full bg-surface-container-low border border-primary/10 rounded-xl py-2 px-3 outline-none focus:border-primary"
                  type="email" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-on-surface-variant">Department</label>
                  <select className="w-full bg-surface-container-low border border-primary/10 rounded-xl py-2 px-3 outline-none focus:border-primary">
                    <option>Engineering</option>
                    <option>Product Management</option>
                    <option>Design</option>
                    <option>Sales &amp; Marketing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-on-surface-variant">Role</label>
                  <select className="w-full bg-surface-container-low border border-primary/10 rounded-xl py-2 px-3 outline-none focus:border-primary">
                    <option>Recruiter</option>
                    <option>Super Admin</option>
                    <option>Hiring Manager</option>
                    <option>Interviewer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 font-bold">
                <button 
                  type="button" 
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded-lg text-primary bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-primary text-white rounded-lg cursor-pointer hover:opacity-90"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerSettings;
