import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';

interface NotificationCardProps {
  notification: Notification;
  onArchive?: (id: string) => void;
  onToggleImportant?: (id: string) => void;
  isImportantLocal?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ 
  notification,
  onArchive,
  onToggleImportant,
  isImportantLocal = false
}) => {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(notification.id);
    if (notification.action) {
      navigate(notification.action.link);
    }
  };

  const handleContainerClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const config = {
    interview: { icon: 'calendar_today', bg: 'bg-error-container/20 text-error', border: 'border-l-error' },
    ai: { icon: 'auto_awesome', bg: 'bg-primary-fixed/20 text-on-primary-fixed-variant', border: 'border-l-primary' },
    resume: { icon: 'analytics', bg: 'bg-secondary-container/40 text-secondary', border: 'border-l-secondary' },
    network: { icon: 'person_add', bg: 'bg-tertiary-fixed/30 text-tertiary-fixed-dim', border: 'border-l-outline-variant' },
    message: { icon: 'chat', bg: 'bg-surface-container-high text-on-surface-variant', border: 'border-l-primary' }
  };

  const typeConfig = config[notification.type] || config.ai;
  const isStarred = isImportantLocal || notification.isImportant;

  const priorities = {
    high: 'bg-error-container/10 text-error font-extrabold border border-error/10',
    medium: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 font-extrabold border border-orange-500/10',
    low: 'bg-surface-container-high text-on-surface-variant'
  };

  const currentPriorityClass = priorities[notification.priority || 'low'];

  return (
    <div
      onClick={handleContainerClick}
      className={`bg-white dark:bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex gap-4 cursor-pointer relative overflow-hidden ${
        !notification.isRead ? `border-l-4 ${typeConfig.border}` : ''
      }`}
    >
      {/* Type Icon */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {typeConfig.icon}
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-body-md font-bold text-primary dark:text-primary-fixed truncate">
              {notification.title}
            </h4>
            
            <span className={`px-2 py-0.5 text-[8px] rounded uppercase tracking-wider ${currentPriorityClass}`}>
              {notification.priority || 'low'} Priority
            </span>

            {notification.category && (
              <span className="px-2 py-0.5 bg-primary/5 text-primary dark:text-primary-fixed text-[8px] font-bold rounded uppercase tracking-wider">
                {notification.category}
              </span>
            )}
          </div>
          <span className="text-[11px] text-on-surface-variant/60 shrink-0">{notification.time}</span>
        </div>

        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {notification.content}
        </p>

        {/* Action triggers */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {notification.action && (
              <Button size="sm" onClick={handleAction}>
                {notification.action.label}
              </Button>
            )}
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  await markAsRead(notification.id);
                }}
              >
                Mark Read
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onToggleImportant && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleImportant(notification.id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-surface-container ${
                  isStarred ? 'text-orange-500' : 'text-on-surface-variant/50'
                }`}
                title={isStarred ? "Starred alert" : "Star alert"}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isStarred ? "'FILL' 1" : undefined }}>
                  star
                </span>
              </button>
            )}
            
            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(notification.id);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/50 hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                title="Archive notification"
              >
                <span className="material-symbols-outlined text-[18px]">
                  archive
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
