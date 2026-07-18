import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog } from '../ui/Dialog';
import { NAV_CONFIG, PORTAL_META, type NavGroup, type NavItem, type PortalRole } from '../../config/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  /** Override the role (defaults to the authenticated user's role). */
  role?: PortalRole;
  /** For internal-view shells (employer/university/admin): current view key. */
  activeKey?: string;
  /** For internal-view shells: called with the item key when a nav item is clicked. */
  onNavigate?: (key: string) => void;
  /** Live badge counts keyed by NavItem.badgeKey. */
  badges?: Record<string, number>;
}

/**
 * Shared enterprise sidebar — one elegant navigation surface for every portal.
 *
 * - Grouped into logical sections with quiet section labels.
 * - Active item uses a solid brand pill (not a border tick) for a calm, modern feel.
 * - Route-based (student) and callback-based (employer/university/admin) items
 *   both supported, so all portals render the exact same component.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  role,
  activeKey,
  onNavigate,
  badges = {},
}) => {
  const { logout, user, role: authRole } = useAuth();
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const resolvedRole: PortalRole = role ?? ((authRole as PortalRole) || 'student');
  const groups: NavGroup[] = NAV_CONFIG[resolvedRole] ?? NAV_CONFIG.student;
  const meta = PORTAL_META[resolvedRole] ?? PORTAL_META.student;

  const handleLogout = async () => {
    await logout();
    setIsLogoutOpen(false);
    navigate('/role-selection');
  };

  const initials = (user?.name || 'User').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const itemInner = (item: NavItem, active: boolean) => (
    <>
      <span className={`material-symbols-outlined text-[21px] ${active ? '' : 'text-on-surface-variant group-hover:text-on-surface'}`}
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        {item.icon}
      </span>
      <span className="flex-1 text-label-md">{item.label}</span>
      {item.badgeKey && badges[item.badgeKey] > 0 && (
        <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
          active ? 'bg-on-primary/20 text-on-primary' : 'bg-primary text-on-primary'
        }`}>
          {badges[item.badgeKey]}
        </span>
      )}
    </>
  );

  const baseItem = 'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 w-full text-left';
  const activeItem = 'bg-primary text-on-primary font-semibold shadow-card';
  const idleItem = 'text-on-surface-variant hover:bg-surface-container font-medium';

  return (
    <>
      <aside
        className={`bg-surface-container-lowest h-screen w-[264px] fixed left-0 top-0 overflow-y-auto border-r border-outline-variant/70 flex flex-col z-50 custom-scrollbar transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="px-5 h-16 flex items-center justify-between shrink-0 border-b border-outline-variant/50">
          <button onClick={() => (onNavigate ? onNavigate(groups[0].items[0].key || '') : navigate(meta.home))}
            className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </span>
            <span className="text-left leading-tight">
              <span className="block text-body-md font-bold text-on-surface tracking-tight">CareerBridge</span>
              <span className="block text-[11px] font-semibold text-tertiary uppercase tracking-wider">{meta.label}</span>
            </span>
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full" type="button">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 px-3 py-5 space-y-6">
          {groups.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.title && (
                <div className="px-3 pb-1.5 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-[0.12em]">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                if (item.to) {
                  return (
                    <NavLink key={item.to} to={item.to} onClick={onClose}
                      className={({ isActive }) => `${baseItem} ${isActive ? activeItem : idleItem}`}>
                      {({ isActive }) => itemInner(item, isActive)}
                    </NavLink>
                  );
                }
                const active = activeKey === item.key;
                return (
                  <button key={item.key} onClick={() => { onNavigate?.(item.key!); onClose?.(); }}
                    className={`${baseItem} ${active ? activeItem : idleItem}`}>
                    {itemInner(item, active)}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="mt-auto p-3 border-t border-outline-variant/50 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container transition-colors">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0">{initials}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-label-md font-semibold text-on-surface truncate">{user?.name || 'My Account'}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{user?.email || meta.label}</p>
            </div>
            <button onClick={() => setIsLogoutOpen(true)} title="Log out"
              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors shrink-0">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <Dialog
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title="Log out of CareerBridge?"
        description="You'll be returned to the role selection screen and will need to sign in again to continue."
        confirmLabel="Log Out"
        onConfirm={handleLogout}
        confirmVariant="error"
      />
    </>
  );
};
