import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  /** Remove default padding when composing custom layouts */
  flush?: boolean;
}

/** Shared surface card -- white, 16px radius, quiet border + soft shadow. */
export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  flush = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-surface-container-lowest ${flush ? '' : 'p-6'} rounded-2xl border border-outline-variant/60 shadow-card transition-all duration-200 ${
        hoverable ? 'hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Consistent card heading row used across dashboards. */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, icon, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-body-md font-semibold text-on-surface truncate">{title}</h3>
        {subtitle && <p className="text-label-sm text-on-surface-variant truncate">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
