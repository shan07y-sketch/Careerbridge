import React from 'react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: string;
  /** e.g. "+12% vs last month"; sign controls color unless deltaTone is set */
  delta?: string;
  deltaTone?: 'up' | 'down' | 'neutral';
  hint?: string;
  onClick?: () => void;
  className?: string;
}

/** Shared KPI stat card -- identical metrics presentation on every dashboard. */
export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon, delta, deltaTone, hint, onClick, className = ''
}) => {
  const tone = deltaTone ?? (delta?.trim().startsWith('-') ? 'down' : delta ? 'up' : 'neutral');
  const deltaColor = tone === 'up' ? 'text-success' : tone === 'down' ? 'text-error' : 'text-on-surface-variant';
  const Comp: any = onClick ? 'button' : 'div';

  return (
    <Comp
      onClick={onClick}
      className={`text-left w-full bg-white rounded-2xl border border-outline-variant/60 shadow-card p-5 transition-all duration-200 ${onClick ? 'hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wide">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="text-headline-lg font-bold text-on-surface leading-none">{value}</div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-label-sm">
          {delta && <span className={`font-semibold ${deltaColor}`}>{delta}</span>}
          {hint && <span className="text-on-surface-variant">{hint}</span>}
        </div>
      )}
    </Comp>
  );
};
