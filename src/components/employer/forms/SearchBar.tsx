import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions?: React.ReactNode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  showSuggestions = false,
  onFocus,
  onBlur,
  suggestions,
}) => {
  return (
    <div className="relative w-96">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full text-sm font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all shadow-sm text-on-surface"
        placeholder={placeholder}
        type="text"
      />

      {showSuggestions && suggestions && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-outline-variant overflow-hidden z-50">
          {suggestions}
        </div>
      )}
    </div>
  );
};
export default SearchBar;
