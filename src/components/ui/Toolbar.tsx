import React from 'react';

interface ToolbarProps {
  /** Search box (optional). */
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  /** Filter controls / chips rendered inline. */
  filters?: React.ReactNode;
  /** Right-aligned actions (primary/bulk). */
  actions?: React.ReactNode;
  /** Contextual bar shown when rows are selected. */
  selectedCount?: number;
  bulkActions?: React.ReactNode;
  className?: string;
}

/**
 * Table/list toolbar — search, filters, and actions in one consistent bar so
 * every data view offers the same controls in the same place. When rows are
 * selected it swaps to a bulk-action bar.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  searchValue, onSearchChange, searchPlaceholder = 'Search…',
  filters, actions, selectedCount = 0, bulkActions, className = '',
}) => {
  if (selectedCount > 0 && bulkActions) {
    return (
      <div className={`flex items-center justify-between gap-4 px-4 py-3 bg-primary-container/60 border border-primary/20 rounded-xl mb-4 animate-fade-in ${className}`}>
        <span className="text-label-md font-semibold text-on-primary-container">{selectedCount} selected</span>
        <div className="flex items-center gap-2">{bulkActions}</div>
      </div>
    );
  }
  return (
    <div className={`flex flex-wrap items-center gap-3 mb-4 ${className}`}>
      {onSearchChange && (
        <div className="flex items-center gap-2 bg-surface-container-lowest px-3 h-10 rounded-xl border border-outline-variant/70 focus-within:border-primary/40 focus-within:shadow-focus-brand transition-all min-w-[220px] flex-1 max-w-xs">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder}
            className="bg-transparent border-none focus:ring-0 text-label-md w-full p-0 text-on-surface placeholder:text-on-surface-variant/70" />
        </div>
      )}
      {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
    </div>
  );
};

interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  count?: number;
}

/** Segmented filter chip — consistent quick-filter control. */
export const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, children, count }) => (
  <button onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-label-md font-semibold border transition-all ${
      active
        ? 'bg-primary text-on-primary border-primary'
        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/70 hover:border-primary/40 hover:text-on-surface'
    }`}>
    {children}
    {count !== undefined && (
      <span className={`min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center ${active ? 'bg-on-primary/20' : 'bg-surface-container-high'}`}>{count}</span>
    )}
  </button>
);
