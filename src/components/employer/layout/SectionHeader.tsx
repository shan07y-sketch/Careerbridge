import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
      <div>
        <h2 className="font-display text-headline-lg text-primary mb-1">{title}</h2>
        {subtitle && <div className="text-on-surface-variant text-sm leading-relaxed">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 items-center shrink-0">{actions}</div>}
    </div>
  );
};
export default SectionHeader;
