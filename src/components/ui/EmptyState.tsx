import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

/** Shared empty state -- honest, helpful, never a blank void. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant animate-fade-in ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center mb-4 text-on-secondary-container">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-headline-md font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-body-md text-on-surface-variant max-w-sm mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button variant="outline" onClick={onSecondary}>{secondaryLabel}</Button>
        )}
      </div>
    </div>
  );
};
