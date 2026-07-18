import React, { useEffect, useState, useCallback } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { UniversityService } from '../../services';
import { UniversityOverviewPanel } from '../../components/university/UniversityOverviewPanel';
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

/**
 * University portal shell — the same shared PageLayout (role="university") that
 * drives the Student and Employer portals, so chrome, spacing and interaction
 * patterns are identical platform-wide. Single-page tabbed experience keyed off
 * the shared Sidebar's nav; each panel owns its own PageHeader + IA content.
 */
export const UniversityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [appliedStudentSearch, setAppliedStudentSearch] = useState<string | undefined>(undefined);
  const [editingDrive, setEditingDrive] = useState<any | null>(null);
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => { setSelectedStudentId(null); }, [activeTab]);

  useEffect(() => {
    UniversityService.getDashboard()
      .then(d => setBadges({ pendingVerifications: d.pendingVerificationsCount || 0 }))
      .catch(() => setBadges({}));
  }, []);

  const goToTab = useCallback((tab: string) => setActiveTab(tab), []);

  const handleSearch = (q: string) => { setAppliedStudentSearch(q); setActiveTab('students'); };

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard': return <UniversityOverviewPanel onNavigate={goToTab} />;
      case 'students':
        return selectedStudentId
          ? <StudentProfile studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />
          : <StudentManagement onSelectStudent={setSelectedStudentId} initialSearch={appliedStudentSearch} />;
      case 'verification':
        return selectedStudentId
          ? <StudentProfile studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />
          : <StudentManagement onSelectStudent={setSelectedStudentId} verificationOnly />;
      case 'companies': return <CompaniesManagement />;
      case 'drives': return <CampusDrives onCreateDrive={() => { setEditingDrive(null); setActiveTab('post_drive'); }} onEditDrive={(d: any) => { setEditingDrive(d); setActiveTab('post_drive'); }} />;
      case 'analytics': return <PlacementAnalytics />;
      case 'reports': return <ReportsCenter />;
      case 'messages': return <MessagingCenter />;
      case 'notifications': return <NotificationsCenter />;
      case 'settings': return <UniversitySettings />;
      case 'help': return <UniversityHelpCenter />;
      case 'post_drive': return <PostCampusDrive editingDrive={editingDrive} onCancel={() => setActiveTab('drives')} onPublish={() => setActiveTab('drives')} />;
      default: return <UniversityOverviewPanel onNavigate={goToTab} />;
    }
  };

  return (
    <PageLayout
      role="university"
      activeKey={activeTab}
      onNavigate={setActiveTab}
      badges={badges}
      roleLabel="University"
      searchPlaceholder="Search students…"
      onSearch={handleSearch}
      onNotifications={() => setActiveTab('notifications')}
      onSettings={() => setActiveTab('settings')}
      onProfile={() => setActiveTab('settings')}
    >
      {renderPanel()}
    </PageLayout>
  );
};

export default UniversityDashboard;
