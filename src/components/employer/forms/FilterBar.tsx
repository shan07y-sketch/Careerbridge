import React from 'react';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  selectedId,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`flex gap-1 bg-surface-container-low p-1 rounded-full text-xs font-bold ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            selectedId === option.id
              ? 'bg-white text-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
export default FilterBar;
