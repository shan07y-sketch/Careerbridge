/**
 * Shared navigation model for all portals.
 *
 * One vocabulary, four roles. Each portal renders the SAME Sidebar component
 * from this config, so the platform reads as one product. Items are grouped
 * into logical sections (per the IA principles); secondary/utility items live
 * in their own group so the primary workflow stays uncluttered.
 *
 * Items can be route-based (`to`) for portals wired to the router (student),
 * or key-based (`key`) for portals that switch views internally
 * (employer / university / admin single-page shells).
 */

export interface NavItem {
  label: string;
  icon: string;
  to?: string;        // router path (student)
  key?: string;       // internal view key (employer/university/admin shells)
  badgeKey?: string;  // optional live-count key (e.g. 'unread', 'pending')
}

export interface NavGroup {
  /** Section label; omit for the top/primary group which needs no heading. */
  title?: string;
  items: NavItem[];
}

export type PortalRole = 'student' | 'employer' | 'university' | 'admin';

export const NAV_CONFIG: Record<PortalRole, NavGroup[]> = {
  student: [
    {
      items: [
        { label: 'Dashboard', icon: 'space_dashboard', to: '/student/dashboard' },
        { label: 'Jobs', icon: 'work', to: '/student/jobs' },
        { label: 'Applications', icon: 'assignment_turned_in', to: '/student/applications' },
        { label: 'Saved', icon: 'bookmark', to: '/student/saved' },
        { label: 'Internships', icon: 'school', to: '/student/internships' },
      ],
    },
    {
      title: 'Career growth',
      items: [
        { label: 'AI Career Coach', icon: 'neurology', to: '/student/coach' },
        { label: 'Career Report', icon: 'insights', to: '/student/career-report' },
        { label: 'Resume Analyzer', icon: 'description', to: '/student/resume' },
        { label: 'Interviews', icon: 'record_voice_over', to: '/student/interviews' },
      ],
    },
    {
      title: 'Community',
      items: [
        { label: 'Network', icon: 'group', to: '/student/network' },
        { label: 'Messages', icon: 'forum', to: '/student/messages', badgeKey: 'unreadMessages' },
      ],
    },
  ],

  employer: [
    {
      items: [
        { label: 'Dashboard', icon: 'space_dashboard', key: 'dashboard' },
        { label: 'Jobs', icon: 'work', key: 'jobs' },
        { label: 'Candidates', icon: 'groups', key: 'candidates' },
        { label: 'Talent Pipeline', icon: 'account_tree', key: 'pipeline' },
      ],
    },
    {
      title: 'Insight',
      items: [
        { label: 'Analytics', icon: 'monitoring', key: 'analytics' },
        { label: 'Reports', icon: 'summarize', key: 'reports' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { label: 'Recruiters', icon: 'badge', key: 'recruiters' },
        { label: 'Company Profile', icon: 'apartment', key: 'company' },
        { label: 'Messages', icon: 'forum', key: 'messages', badgeKey: 'unreadMessages' },
        { label: 'Interviews', icon: 'videocam', key: 'interviews' },
      ],
    },
  ],

  university: [
    {
      items: [
        { label: 'Dashboard', icon: 'space_dashboard', key: 'dashboard' },
        { label: 'Students', icon: 'school', key: 'students' },
        { label: 'Placements', icon: 'workspace_premium', key: 'drives' },
        { label: 'Internships', icon: 'work_history', key: 'internships' },
      ],
    },
    {
      title: 'Insight',
      items: [
        { label: 'Analytics', icon: 'monitoring', key: 'analytics' },
        { label: 'Companies', icon: 'apartment', key: 'companies' },
        { label: 'Reports', icon: 'summarize', key: 'reports' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { label: 'Messages', icon: 'forum', key: 'messages', badgeKey: 'unreadMessages' },
        { label: 'Verification', icon: 'verified', key: 'verification', badgeKey: 'pendingVerifications' },
        { label: 'Help & Support', icon: 'help', key: 'help' },
      ],
    },
  ],

  admin: [
    {
      items: [
        { label: 'Overview', icon: 'space_dashboard', key: 'overview' },
        { label: 'Users', icon: 'manage_accounts', key: 'users' },
        { label: 'Organizations', icon: 'domain', key: 'organizations' },
        { label: 'Verification Queue', icon: 'fact_check', key: 'verification', badgeKey: 'pendingVerifications' },
      ],
    },
    {
      title: 'Platform',
      items: [
        { label: 'Analytics', icon: 'monitoring', key: 'analytics' },
        { label: 'Moderation', icon: 'gavel', key: 'moderation' },
        { label: 'Support Tickets', icon: 'confirmation_number', key: 'support' },
        { label: 'System Health', icon: 'health_and_safety', key: 'health' },
      ],
    },
    {
      title: 'Security',
      items: [
        { label: 'Sessions & Devices', icon: 'devices', key: 'sessions' },
        { label: 'Audit Logs', icon: 'receipt_long', key: 'audit' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Feature Flags', icon: 'flag', key: 'flags' },
        { label: 'Announcements', icon: 'notifications_active', key: 'announcements' },
      ],
    },
  ],
};

export const PORTAL_META: Record<PortalRole, { label: string; home: string }> = {
  student: { label: 'Student', home: '/student/dashboard' },
  employer: { label: 'Employer', home: '/employer/dashboard' },
  university: { label: 'University', home: '/university/dashboard' },
  admin: { label: 'Admin', home: '/admin' },
};
