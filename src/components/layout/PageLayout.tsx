import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TabBar } from '../../mobile/components/TabBar';
import { useAuth } from '../../contexts/AuthContext';
import type { PortalRole } from '../../config/navigation';

interface PageLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  title?: string;
  searchPlaceholder?: string;
  role?: PortalRole;
  activeKey?: string;
  onNavigate?: (key: string) => void;
  badges?: Record<string, number>;
  onSearch?: (q: string) => void;
  onNotifications?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  roleLabel?: string;
}

/**
 * Shared application shell: fixed sidebar + sticky topbar + a comfortable,
 * max-width content column with generous, consistent page padding. Route-based
 * portals (student) use it with no extra props. Internal-view shells
 * (employer/university/admin) pass role + activeKey + onNavigate (+ optional
 * badges and topbar callbacks) so the same shell drives a single-page tabbed
 * experience with the identical look and feel.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children, fullWidth = false, title, searchPlaceholder,
  role, activeKey, onNavigate, badges,
  onSearch, onNotifications, onSettings, onProfile, roleLabel,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { role: authRole } = useAuth();
  const resolvedRole: PortalRole = role ?? ((authRole as PortalRole) || 'student');

  return (
    <div className="text-on-surface bg-surface min-h-screen flex">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-[2px] z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Desktop/web: fixed sidebar (hidden below lg, i.e. on phones/tablets and the Android app). */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={role}
        activeKey={activeKey}
        onNavigate={onNavigate}
        badges={badges}
      />

      <div className="flex-grow min-w-0 lg:ml-[264px] flex flex-col min-h-screen">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          title={title}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          onNotifications={onNotifications}
          onSettings={onSettings}
          onProfile={onProfile}
          roleLabel={roleLabel}
        />

        {/* Reserve space for the fixed BottomNav on phones/native so content never sits under it. */}
        <main className="flex-1 bg-surface pb-[76px] lg:pb-0">
          {fullWidth ? (
            <div className="page-enter">{children}</div>
          ) : (
            <div className="px-4 md:px-8 lg:px-10 py-8 lg:py-10">
              <div className="w-full max-w-container-max mx-auto page-enter">{children}</div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile/native: bottom tab bar replaces the hamburger-triggered sidebar below lg. */}
      <TabBar role={resolvedRole} activeKey={activeKey} onNavigate={onNavigate} badges={badges} />
    </div>
  );
};
