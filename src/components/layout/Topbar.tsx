import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { PORTAL_META, type PortalRole } from '../../config/navigation';

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  notificationsTo?: string;
  settingsTo?: string;
  profileTo?: string;
  onNotifications?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  roleLabel?: string;
}

/**
 * Shared top bar — deliberately minimal: search, notifications, profile.
 * Role-aware so every portal shares it. Route-based portals pass link targets;
 * internal-view shells pass onNotifications/onSettings/onProfile callbacks.
 */
export const Topbar: React.FC<TopbarProps> = ({
  onMenuClick, title, searchPlaceholder = 'Search…', onSearch,
  notificationsTo, settingsTo, profileTo,
  onNotifications, onSettings, onProfile, roleLabel,
}) => {
  const { user, role } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const resolvedRole = (role as PortalRole) || 'student';
  const initials = (user?.name || 'User').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (onSearch) onSearch(q);
    else navigate(`/student/search-results?query=${encodeURIComponent(q)}`);
  };

  const notifTarget = notificationsTo ?? '/student/notifications';
  const settingsTarget = settingsTo ?? '/student/settings';
  const profileTarget = profileTo ?? '/student/profile';

  const menuItemClass = 'w-full text-left flex items-center gap-3 px-4 py-2.5 text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors';

  return (
    <header className="h-16 flex items-center justify-between gap-4 px-4 md:px-8 bg-surface/85 backdrop-blur-md border-b border-outline-variant/60 z-40 sticky top-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg" type="button">
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        {title && <h2 className="lg:hidden text-body-md font-semibold text-on-surface truncate">{title}</h2>}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center gap-2.5 bg-surface-container-lowest px-3.5 h-10 rounded-xl w-full max-w-md border border-outline-variant/70 focus-within:border-primary/40 focus-within:shadow-focus-brand transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-label-md w-full p-0 text-on-surface placeholder:text-on-surface-variant/70"
            placeholder={searchPlaceholder}
            type="text"
          />
        </form>
      </div>

      <div className="flex items-center gap-1.5">
        {onNotifications ? (
          <button onClick={onNotifications} title="Notifications" type="button"
            className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-error text-on-error text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-surface">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        ) : (
          <Link to={notifTarget} title="Notifications"
            className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-error text-on-error text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-surface">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </Link>
        )}

        <div className="w-px h-6 bg-outline-variant/70 mx-1.5" />

        <div className="relative">
          <button onClick={() => setIsDropdownOpen(v => !v)} className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-surface-container transition-colors group">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[13px]">{initials}</span>
            )}
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-label-md font-semibold text-on-surface max-w-[140px] truncate">{user?.name || 'My Account'}</span>
              <span className="block text-[11px] text-on-surface-variant capitalize">{roleLabel || PORTAL_META[resolvedRole]?.label || resolvedRole}</span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant hidden sm:block">expand_more</span>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-2xl shadow-pop border border-outline-variant/70 py-2 z-50 animate-scale-in origin-top-right">
                <div className="px-4 py-2 mb-1 border-b border-outline-variant/50">
                  <p className="text-label-md font-semibold text-on-surface truncate">{user?.name || 'My Account'}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{user?.email || ''}</p>
                </div>
                {onProfile ? (
                  <button type="button" onClick={() => { setIsDropdownOpen(false); onProfile(); }} className={menuItemClass}><span className="material-symbols-outlined text-[20px]">account_circle</span> Profile</button>
                ) : (
                  <Link to={profileTarget} onClick={() => setIsDropdownOpen(false)} className={menuItemClass}><span className="material-symbols-outlined text-[20px]">account_circle</span> Profile</Link>
                )}
                {onSettings ? (
                  <button type="button" onClick={() => { setIsDropdownOpen(false); onSettings(); }} className={menuItemClass}><span className="material-symbols-outlined text-[20px]">settings</span> Settings</button>
                ) : (
                  <Link to={settingsTarget} onClick={() => setIsDropdownOpen(false)} className={menuItemClass}><span className="material-symbols-outlined text-[20px]">settings</span> Settings</Link>
                )}
                <div className="border-t border-outline-variant/50 my-1" />
                <Link to="/role-selection" onClick={() => setIsDropdownOpen(false)} className={menuItemClass}><span className="material-symbols-outlined text-[20px]">swap_horiz</span> Switch portal</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
