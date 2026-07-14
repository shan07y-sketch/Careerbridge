import React from 'react';
import SearchBar from '../forms/SearchBar';

interface EmployerHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  suggestions?: React.ReactNode;
  placeholder?: string;
  onNotificationClick: () => void;
  onHelpClick: () => void;
  userName: string;
  userRole: string;
  userAvatar: string;
}

export const EmployerHeader: React.FC<EmployerHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  placeholder = "Search...",
  onNotificationClick,
  onHelpClick,
  userName,
  userRole,
  userAvatar,
}) => {
  return (
    <header className="sticky top-0 z-30 flex justify-between items-center w-full px-10 py-4 bg-white/95 border-b border-primary/5 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-4 flex-1">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={placeholder}
          showSuggestions={showSuggestions}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          suggestions={suggestions}
        />
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={onNotificationClick}
          className="relative text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
        </button>
        <button 
          onClick={onHelpClick}
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/40">
          <div className="text-right">
            <p className="font-bold text-sm text-primary leading-tight">{userName}</p>
            <p className="text-[9px] text-on-surface-variant font-extrabold uppercase tracking-wider">{userRole}</p>
          </div>
          <img
            alt={userName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/15"
            src={userAvatar}
          />
        </div>
      </div>
    </header>
  );
};
export default EmployerHeader;
