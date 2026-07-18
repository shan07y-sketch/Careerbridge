import React from 'react';

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'teal';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: string;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-container text-on-surface-variant',
  brand: 'bg-primary-container text-on-primary-container',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-info-container text-on-info-container',
  teal: 'bg-tertiary-container text-on-tertiary-container',
};

/** Shared status badge -- one visual language for statuses across portals. */
export const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', icon, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold whitespace-nowrap ${tones[tone]} ${className}`}
  >
    {icon && <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span>}
    {children}
  </span>
);

/** Map common domain statuses to badge tones so every portal renders them identically. */
export const statusTone = (status: string): BadgeTone => {
  const s = status.toLowerCase();
  if (/(approved|accepted|offer|hired|placed|verified|active|completed|success)/.test(s)) return 'success';
  if (/(pending|review|applied|submitted|scheduled|in.progress|awaiting)/.test(s)) return 'warning';
  if (/(rejected|declined|withdrawn|failed|expired|suspended|blocked)/.test(s)) return 'error';
  if (/(interview|shortlist)/.test(s)) return 'brand';
  if (/(draft|closed|archived|inactive)/.test(s)) return 'neutral';
  return 'info';
};
