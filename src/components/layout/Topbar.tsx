import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export const Topbar: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/search-results?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-margin-desktop bg-surface/80 dark:bg-surface-container-low/80 backdrop-blur-md border-b border-primary/10 z-40">
      <div className="flex items-center gap-2 flex-1 md:flex-initial">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full"
            type="button"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-4 bg-surface-container-low dark:bg-surface-container px-4 py-2 rounded-full w-full max-w-[280px] sm:max-w-96 border border-outline/5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full p-0 text-on-surface dark:text-white"
            placeholder="Search jobs, skills, or companies..."
            type="text"
          />
        </form>
      </div>

      {/* Navigation Icons & Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Help */}
          <Link
            to="/legal/terms"
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high dark:hover:bg-surface-container"
            title="Help / Terms"
          >
            <span className="material-symbols-outlined">help</span>
          </Link>
          
          {/* Notifications Center */}
          <Link
            to="/student/notifications"
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high dark:hover:bg-surface-container relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4.5 h-4.5 bg-error text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </Link>
          
          {/* Settings */}
          <Link
            to="/student/settings"
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high dark:hover:bg-surface-container"
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
        
        <div className="h-8 w-px bg-outline/10"></div>
        
        {/* User Profile Info Dropdown */}
        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-label-md font-bold leading-none text-on-surface dark:text-white group-hover:text-primary transition-colors">
                {user?.name || 'Alex Rivera'}
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight mt-1">
                Student Pro
              </p>
            </div>
            <img
              className="w-10 h-10 rounded-full border-2 border-primary/10 group-hover:border-primary/30 object-cover"
              alt="Candidate Profile"
              src={user?.profilePicture || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1Z06J7OeckxCu3w8L1VBcSX5Hoao7qMW6lvtD6G8HSaxxX8GAQMJn-lNYIwZF1s_gsD6pi8mPtbMBHI_U-QQMsQdhr2Fd_e2-B8BSbQWrWipFZfPbpARcXsUCpqHdjOYI2CesC9HcETnQE8l2UkJYSYMuwHrO_4sO8t0GHsrl1gebTXdzXvFkyvLDXngAIzIfZlnhHIqGLkw1x9bgCGFZUbepArFI3fBBsr4qVvP6bs3HQ1ju1Nnp22MOhzDaMfu9m6g7ix_7Cd8'}
            />
          </div>

          {/* Quick Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-container rounded-xl shadow-xl border border-primary/5 py-2 z-50 animate-slide-up">
                <Link
                  to="/student/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  Profile
                </Link>
                <Link
                  to="/student/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Settings
                </Link>
                <div className="border-t border-outline/5 my-1" />
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // Trigger the click event on the sidebar logout button
                    const logoutBtn = document.querySelector('button[onClick*="LogoutOpen"]') as HTMLButtonElement;
                    if (logoutBtn) {
                      logoutBtn.click();
                    } else {
                      navigate('/auth');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-colors w-full text-left"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
