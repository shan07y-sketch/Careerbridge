/**
 * MobileShell — the standard mobile page frame: sticky header, scrollable
 * content, offline banner and the bottom TabBar. Pure presentation; all
 * data comes from the page using it.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TabBar } from './TabBar';
import { OfflineBanner } from './OfflineBanner';
import type { PortalRole } from '../../config/navigation';

interface MobileShellProps {
  title: string;
  subtitle?: string;
  /** Show a back arrow instead of the app mark. */
  back?: boolean;
  /** Right-side header action buttons. */
  actions?: React.ReactNode;
  /** Hide the bottom tab bar (e.g. full-screen flows). */
  hideTabs?: boolean;
  role?: PortalRole;
  activeKey?: string;
  onNavigate?: (key: string) => void;
  badges?: Record<string, number>;
  /** Floating action button rendered above the tab bar. */
  fab?: React.ReactNode;
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  title, subtitle, back, actions, hideTabs, role, activeKey, onNavigate, badges, fab, children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <OfflineBanner />

      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-on-surface/5 m-safe-top">
        <div className="flex items-center gap-3 h-14 px-4">
          {back ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="m-press -ml-2 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : (
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="material-symbols-outlined text-[18px] text-on-primary">school</span>
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </header>

      <main className={hideTabs ? 'pb-6' : 'pb-[88px]'}>
        {children}
      </main>

      {fab && (
        <div className="fixed right-5 z-40" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          {fab}
        </div>
      )}

      {!hideTabs && <TabBar role={role} activeKey={activeKey} onNavigate={onNavigate} badges={badges} />}
    </div>
  );
};
