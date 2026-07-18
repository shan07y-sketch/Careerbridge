import React, { useState, useEffect } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { AdminService } from '../../services';
import { AdminOverviewView } from './views/AdminOverviewView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminOrganizationsView } from './views/AdminOrganizationsView';
import { AdminVerificationView } from './views/AdminVerificationView';
import { AdminAnalyticsView } from './views/AdminAnalyticsView';
import { AdminModerationView } from './views/AdminModerationView';
import { AdminSystemHealthView } from './views/AdminSystemHealthView';
import { AdminFeatureFlagsView } from './views/AdminFeatureFlagsView';
import { AdminAnnouncementsView } from './views/AdminAnnouncementsView';
import { AdminSupportTicketsView } from './views/AdminSupportTicketsView';
import { AdminSessionsView } from './views/AdminSessionsView';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';

/**
 * Platform admin console. Runs on the shared PageLayout (role="admin") so the
 * chrome, spacing and interaction language match the Student/Employer/University
 * portals. Single-page tabbed console keyed off the shared Sidebar's admin nav.
 */
export const AdminPortal: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('overview');
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    AdminService.getStats()
      .then(s => setBadges({ pendingVerifications: (s.unverifiedCompanies || 0) + (s.unverifiedUniversities || 0) + (s.pendingStudentVerifications || 0) }))
      .catch(() => setBadges({}));
  }, []);

  const renderView = () => {
    switch (activeKey) {
      case 'overview': return <AdminOverviewView onNavigate={setActiveKey} />;
      case 'users': return <AdminUsersView />;
      case 'organizations': return <AdminOrganizationsView />;
      case 'verification': return <AdminVerificationView />;
      case 'analytics': return <AdminAnalyticsView />;
      case 'moderation': return <AdminModerationView />;
      case 'health': return <AdminSystemHealthView />;
      case 'flags': return <AdminFeatureFlagsView />;
      case 'announcements': return <AdminAnnouncementsView />;
      case 'support': return <AdminSupportTicketsView />;
      case 'sessions': return <AdminSessionsView />;
      case 'audit': return <AdminAuditLogsView />;
      default: return <AdminOverviewView onNavigate={setActiveKey} />;
    }
  };

  return (
    <PageLayout
      role="admin"
      activeKey={activeKey}
      onNavigate={setActiveKey}
      badges={badges}
      roleLabel="Admin"
      searchPlaceholder="Search users…"
      onSearch={() => setActiveKey('users')}
      onNotifications={() => setActiveKey('announcements')}
      onSettings={() => setActiveKey('flags')}
      onProfile={() => setActiveKey('overview')}
    >
      {renderView()}
    </PageLayout>
  );
};

export default AdminPortal;
