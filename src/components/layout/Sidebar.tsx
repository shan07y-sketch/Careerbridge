import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog } from '../ui/Dialog';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = false, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsLogoutOpen(false);
    navigate('/');
  };

  const navItems = [
    { to: '/student/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/student/jobs', icon: 'work', label: 'Jobs' },
    { to: '/student/applications', icon: 'assignment_turned_in', label: 'Applications' },
    { to: '/student/career-report', icon: 'psychology', label: 'AI Career Coach' },
    { to: '/student/profile', icon: 'description', label: 'Resume Analyzer' },
    { to: '/student/mock-interview', icon: 'record_voice_over', label: 'Mock Interviews' },
  ];

  const connectItems = [
    { to: '/student/network', icon: 'group', label: 'Network' },
    { to: '/student/messages', icon: 'mail', label: 'Messages' },
  ];

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = 'flex items-center gap-3 px-4 py-3 transition-colors active:scale-[0.98] rounded-lg ';
    if (isActive) {
      return base + 'text-primary dark:text-primary-fixed font-bold border-r-4 border-primary dark:border-primary-fixed bg-surface-container-high dark:bg-surface-container';
    }
    return base + 'text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container';
  };

  return (
    <>
      <aside className={`bg-surface dark:bg-surface-container-low h-screen w-64 fixed left-0 top-0 overflow-y-auto shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col py-8 px-4 z-50 custom-scrollbar transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="mb-10 px-4 flex justify-between items-center">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">CareerBridge</h1>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Career Success Platform</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full"
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={getLinkClass}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-6 pb-2 px-4 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">Connect</div>
          
          {connectItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={getLinkClass}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-4 space-y-4">
          <div className="p-4 bg-secondary-container dark:bg-secondary-container/20 rounded-2xl space-y-2">
            <p className="text-label-md font-bold text-on-secondary-container">AI Insights</p>
            <ul className="space-y-1">
              <li className="text-[10px] font-bold text-on-secondary-container/80 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check_circle</span> 
                Profile Completion: {user?.resumeScore || 82}%
              </li>
              <li className="text-[10px] font-bold text-on-secondary-container/80 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">trending_up</span> 
                Resume: High Impact
              </li>
              <li className="text-[10px] font-bold text-on-secondary-container/80 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">lightbulb</span> 
                Career Tip: Network with Alums
              </li>
            </ul>
          </div>
          
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="flex items-center gap-3 py-3 w-full text-left text-on-surface-variant hover:text-primary transition-colors hover:font-semibold"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <Dialog
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title="Confirm Logout"
        description="Are you sure you want to log out of your CareerBridge account?"
        confirmLabel="Log Out"
        onConfirm={handleLogout}
        confirmVariant="error"
      />
    </>
  );
};
