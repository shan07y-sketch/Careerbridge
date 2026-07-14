import React, { useState, useEffect, useRef } from 'react';

export interface DropdownOption {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

interface ActionDropdownProps {
  trigger?: React.ReactNode;
  options: DropdownOption[];
  className?: string;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
  trigger,
  options,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <span className="material-symbols-outlined text-on-surface-variant text-sm hover:text-primary hover:bg-surface-container p-0.5 rounded transition-all">
            more_vert
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant/30 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden animate-slide-up text-left">
          {options.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                option.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-surface-container-low text-xs font-semibold transition-all cursor-pointer ${
                option.danger ? 'text-error hover:bg-error/5' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {option.icon && (
                <span className="material-symbols-outlined text-base">{option.icon}</span>
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default ActionDropdown;
