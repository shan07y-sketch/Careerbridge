/**
 * TabBar — fixed bottom navigation for phones / the Android app.
 *
 * Reads the SAME navigation model (NAV_CONFIG) as the desktop sidebar:
 * the first four primary items become tabs, everything else moves into
 * the "More" sheet. Route-based items (student) navigate; key-based
 * items (employer / university / admin shells) call onNavigate(key).
 */
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_CONFIG } from '../../config/navigation';
import type { NavItem, PortalRole } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Sheet } from './Sheet';

interface TabBarProps {
  role?: PortalRole;
  activeKey?: string;
  onNavigate?: (key: string) => void;
  badges?: Record<string, number>;
}

export const TabBar: React.FC<TabBarProps> = ({ role, activeKey, onNavigate, badges }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role: authRole, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const resolvedRole: PortalRole = role ?? ((authRole as PortalRole) || 'student');

  const { primary, overflow } = useMemo(() => {
    const groups = NAV_CONFIG[resolvedRole];
    const all = groups.flatMap(g => g.items);
    return { primary: all.slice(0, 4), overflow: all.slice(4) };
  }, [resolvedRole]);

  const isActive = (item: NavItem): boolean => {
    if (item.to) return location.pathname.startsWith(item.to);
    return !!item.key && item.key === activeKey;
  };

  const open = (item: NavItem) => {
    setMoreOpen(false);
    if (item.to) navigate(item.to);
    else if (item.key && onNavigate) onNavigate(item.key);
  };

  const badgeFor = (item: NavItem): number =>
    (item.badgeKey && badges?.[item.badgeKey]) || 0;

  const overflowActive = overflow.some(isActive);

  return (
    <>
      <nav
        aria-label="Primary"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-on-surface/10 m-safe-bottom"
      >
        <div className="grid grid-cols-5 h-[64px]">
          {primary.map(item => {
            const active = isActive(item);
            const badge = badgeFor(item);
            return (
              <button
                key={item.label}
                onClick={() => open(item)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className="m-press flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
              >
                <span className="relative">
                  <span
                    className={`material-symbols-outlined text-[24px] ${
                      active ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] leading-none ${active ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            className="m-press flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
          >
            <span className={`material-symbols-outlined text-[24px] ${overflowActive ? 'text-primary' : 'text-on-surface-variant'}`}>
              apps
            </span>
            <span className={`text-[11px] leading-none ${overflowActive ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-4 gap-2 pb-2">
          {overflow.map(item => (
            <button
              key={item.label}
              onClick={() => open(item)}
              className="m-press flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-surface-container"
            >
              <span className="relative w-11 h-11 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-on-primary-container">{item.icon}</span>
                {badgeFor(item) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
                    {badgeFor(item)}
                  </span>
                )}
              </span>
              <span className="text-[11px] text-on-surface text-center leading-tight">{item.label}</span>
            </button>
          ))}
          <button
            onClick={async () => { setMoreOpen(false); await logout(); navigate('/'); }}
            className="m-press flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-surface-container"
          >
            <span className="w-11 h-11 rounded-full bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-on-error-container">logout</span>
            </span>
            <span className="text-[11px] text-on-surface leading-tight">Sign out</span>
          </button>
        </div>
      </Sheet>
    </>
  );
};
