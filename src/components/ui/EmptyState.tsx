import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-surface-container-lowest rounded-[16px] border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] ${className}`}>
      <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-4 text-primary">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed mb-2">{title}</h3>
      <p className="font-body-md text-on-surface-variant max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
