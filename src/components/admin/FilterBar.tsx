import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  onFilterChange?: (key: string, value: string) => void;
  onClearAll?: () => void;
  rightActions?: React.ReactNode;
}

/**
 * Search + dropdown-filter row shared across every admin list screen
 * (Users, Companies, Universities, Jobs, Audit Logs). Filters are declared
 * by the caller so this component stays agnostic of what's being filtered.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  onFilterChange,
  onClearAll,
  rightActions,
}) => {
  const hasActiveFilters = filters.some((f) => f.value) || !!searchValue;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant" aria-hidden="true">
          search
        </span>
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Search"
        />
      </div>

      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
          className="px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={filter.label}
        >
          <option value="">{filter.label}: All</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {hasActiveFilters && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors"
        >
          Clear filters
        </button>
      )}

      {rightActions && <div className="sm:ml-auto flex items-center gap-2">{rightActions}</div>}
    </div>
  );
};

export default FilterBar;
