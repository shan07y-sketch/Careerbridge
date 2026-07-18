import React from 'react';

export interface ActivityItem {
  id: string;
  icon: string;
  title: React.ReactNode;
  meta?: string;         // e.g. relative time
  tone?: 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  onClick?: () => void;
}

const toneMap: Record<string, string> = {
  brand: 'bg-primary-container text-on-primary-container',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-info-container text-on-info-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
};

/**
 * Recent-activity timeline — answers "what recently changed?" on any dashboard.
 * Quiet connective spine, iconized events, optional click-through.
 */
export const ActivityFeed: React.FC<{ items: ActivityItem[]; emptyLabel?: string }> = ({ items, emptyLabel = 'No recent activity yet.' }) => {
  if (!items.length) {
    return <p className="text-label-md text-on-surface-variant py-6 text-center">{emptyLabel}</p>;
  }
  return (
    <ul className="relative">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-outline-variant" aria-hidden />}
          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${toneMap[it.tone || 'neutral']}`}>
            <span className="material-symbols-outlined text-[19px]">{it.icon}</span>
          </span>
          <button onClick={it.onClick} disabled={!it.onClick}
            className={`text-left flex-1 min-w-0 pt-1 ${it.onClick ? 'hover:opacity-70 transition-opacity' : ''}`}>
            <p className="text-label-md text-on-surface leading-snug">{it.title}</p>
            {it.meta && <p className="text-[12px] text-on-surface-variant mt-0.5">{it.meta}</p>}
          </button>
        </li>
      ))}
    </ul>
  );
};
