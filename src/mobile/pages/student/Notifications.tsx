/**
 * Mobile Notifications — grouped list with mark-as-read.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../../types';
import { NotificationService } from '../../../services';
import { MobileShell, SkeletonList, EmptyState, ErrorState, PullToRefresh } from '../../components';

const TYPE_ICON: Record<Notification['type'], string> = {
  interview: 'event',
  ai: 'neurology',
  resume: 'description',
  network: 'group',
  message: 'forum',
};

const MobileNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await NotificationService.getNotifications());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter(n => !n.isRead).length;

  const open = async (n: Notification) => {
    if (!n.isRead) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      NotificationService.markAsRead(n.id).catch(() => undefined);
    }
    if (n.action?.link) navigate(n.action.link);
  };

  const markAll = async () => {
    setItems(prev => prev.map(x => ({ ...x, isRead: true })));
    NotificationService.markAllAsRead().catch(() => undefined);
  };

  return (
    <MobileShell
      title="Notifications"
      subtitle={unread ? `${unread} unread` : 'All caught up'}
      actions={unread > 0 ? (
        <button onClick={markAll} className="text-xs font-bold text-primary px-2">Mark all read</button>
      ) : undefined}
    >
      {loading ? (
        <SkeletonList count={6} itemClass="h-16" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : items.length === 0 ? (
        <EmptyState icon="notifications" title="No notifications" hint="Interview invites, AI insights and updates will land here." />
      ) : (
        <PullToRefresh onRefresh={load}>
          <div className="divide-y divide-on-surface/5">
            {items.map(n => (
              <button key={n.id} onClick={() => open(n)} className="m-press w-full flex items-start gap-3 px-4 py-3 text-left">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? 'bg-surface-container' : 'bg-primary-container'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${n.isRead ? 'text-on-surface-variant' : 'text-on-primary-container'}`}>
                    {TYPE_ICON[n.type] || 'notifications'}
                  </span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.isRead ? 'font-medium text-on-surface-variant' : 'font-bold text-on-surface'}`}>{n.title}</p>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{n.content}</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">{n.time}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" aria-label="Unread" />}
              </button>
            ))}
          </div>
        </PullToRefresh>
      )}
    </MobileShell>
  );
};

export default MobileNotifications;
