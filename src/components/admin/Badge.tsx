import React from 'react';

interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  size?: 'sm' | 'md';
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  primary: 'bg-primary-fixed/30 text-primary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-blue-100 text-blue-700',
};

/**
 * Generic labeled pill (role names, feature-flag state, log severity,
 * environment tags) -- distinct from StatusChip, which is specifically for
 * lifecycle states (active/suspended/pending) and carries a dot indicator.
 */
export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral', icon, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide whitespace-nowrap ${sizeClasses} ${TONE_CLASSES[tone]}`}>
      {icon && <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{icon}</span>}
      {label}
    </span>
  );
};

export default Badge;
