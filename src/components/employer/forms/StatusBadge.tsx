import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'status' | 'tonal' | 'pill' | 'default';
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  type,
  className = '',
}) => {
  // Infer type if not explicitly passed
  let resolvedType: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' = type || 'neutral';
  
  if (!type) {
    const l = label.toLowerCase();
    if (l === 'published' || l === 'active' || l === 'immediate' || l === 'top match' || l === 'success') {
      resolvedType = 'success';
    } else if (l === 'closed' || l === 'high priority') {
      resolvedType = 'error';
    } else if (l === 'draft' || l === '2 weeks' || l === 'medium priority') {
      resolvedType = 'warning';
    } else if (l === 'flexible' || l === 'recently applied' || l === 'shortlisted') {
      resolvedType = 'info';
    } else if (['design', 'engineering', 'product', 'marketing'].includes(l)) {
      resolvedType = 'primary';
    }
  }

  // Tonal backgrounds & text colors
  const typeStyles = {
    primary: 'bg-secondary-container text-on-secondary-container border-primary/5',
    success: 'bg-primary-fixed/20 text-primary border-primary-fixed/30',
    warning: 'bg-secondary-container/60 text-secondary border-secondary-container/70',
    error: 'bg-error-container text-on-error-container border-error/10',
    info: 'bg-primary/5 text-primary border-primary/10',
    neutral: 'bg-surface-container text-on-surface-variant border-outline-variant/20',
  };

  // Dots for status variants
  const dotColor = {
    primary: 'bg-primary',
    success: 'bg-primary animate-pulse',
    warning: 'bg-secondary',
    error: 'bg-error animate-pulse',
    info: 'bg-primary',
    neutral: 'bg-on-surface-variant',
  };

  if (variant === 'status') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold bg-primary/5 text-primary px-2.5 py-1 rounded-full border border-primary/10 w-fit ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor[resolvedType]}`}></span>
        {label}
      </span>
    );
  }

  if (variant === 'tonal') {
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${typeStyles[resolvedType]} ${className}`}>
        {label}
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${typeStyles[resolvedType]} ${className}`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${typeStyles[resolvedType]} ${className}`}>
      {label}
    </span>
  );
};
export default StatusBadge;
