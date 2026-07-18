import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { EmployerOverviewService } from '../../services';
import { DashboardOverviewPanel } from './DashboardOverviewPanel';
import { JobsListPanel } from './JobsListPanel';
import { CandidatesQueuePanel } from './CandidatesQueuePanel';
import { HiringPipelinePanel } from './HiringPipelinePanel';
import { InterviewsPanel } from './InterviewsPanel';
import { MessagingPanel } from './MessagingPanel';
import { CompanyProfilePanel } from './CompanyProfilePanel';
import { RecruitersPanel } from './RecruitersPanel';
import { ReportsPanel } from './ReportsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { EmployerNotifications } from './Notifications';
import { EmployerSettings } from './Settings';
import { JobPostingForm } from './JobPostingForm';

/**
 * Employer portal shell. Uses the shared PageLayout (role="employer") so the
 * sidebar, topbar, spacing and design language are identical to the Student
 * portal — a single-page tabbed experience driven by the shared Sidebar's
 * key-based nav. Each panel owns its own PageHeader + IA content.
 */
export const EmployerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const badges: Record<string, number> = {};

  const openPostJob = useCallback(() => setJobFormOpen(true), []);

  useEffect(() => {
    EmployerOverviewService.getDashboard()
      .then(() => { /* stats warmed for panels; badges wired below */ })
      .catch(() => undefined);
  }, []);

  const searchPlaceholder =
    activeTab === 'candidates' || activeTab === 'pipeline' ? 'Search candidates…'
    : activeTab === 'jobs' ? 'Search jobs…'
    : 'Search…';

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverviewPanel onNavigate={setActiveTab} onPostJob={openPostJob} />;
      case 'jobs': return <JobsListPanel />;
      case 'candidates': return <CandidatesQueuePanel />;
      case 'pipeline': return <HiringPipelinePanel />;
      case 'interviews': return <InterviewsPanel />;
      case 'messages': return <MessagingPanel />;
      case 'company': return <CompanyProfilePanel />;
      case 'recruiters': return <RecruitersPanel />;
      case 'reports': return <ReportsPanel />;
      case 'analytics': return <AnalyticsPanel />;
      case 'notifications': return <EmployerNotifications />;
      case 'settings': return <EmployerSettings />;
      default: return <DashboardOverviewPanel onNavigate={setActiveTab} onPostJob={openPostJob} />;
    }
  };

  return (
    <PageLayout
      role="employer"
      activeKey={activeTab}
      onNavigate={setActiveTab}
      badges={badges}
      roleLabel="Employer"
      searchPlaceholder={searchPlaceholder}
      onNotifications={() => setActiveTab('notifications')}
      onSettings={() => setActiveTab('settings')}
      onProfile={() => setActiveTab('company')}
    >
      {renderPanel()}

      <JobPostingForm
        isOpen={jobFormOpen}
        onClose={() => setJobFormOpen(false)}
        onSaved={() => { setJobFormOpen(false); setActiveTab('jobs'); }}
      />
    </PageLayout>
  );
};

export default EmployerDashboard;
