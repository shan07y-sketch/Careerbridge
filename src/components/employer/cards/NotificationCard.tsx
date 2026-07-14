import React from 'react';
import DashboardCard from './DashboardCard';

interface NotificationCardProps {
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  onMarkRead?: () => void;
  className?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  description,
  timestamp,
  isRead,
  onMarkRead,
  className = '',
}) => {
  return (
    <DashboardCard className={`flex items-start justify-between gap-4 border-l-4 ${isRead ? 'border-l-transparent' : 'border-l-primary'} ${className}`}>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-sm text-primary">{title}</h4>
          {!isRead && (
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <p className="text-xs text-on-surface-variant font-medium mb-1.5">{description}</p>
        <span className="text-[10px] text-on-surface-variant opacity-60 font-semibold">{timestamp}</span>
      </div>
      {!isRead && onMarkRead && (
        <button
          onClick={onMarkRead}
          className="text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          Mark as Read
        </button>
      )}
    </DashboardCard>
  );
};
export default NotificationCard;
