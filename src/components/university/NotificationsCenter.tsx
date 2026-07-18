import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type UniversityNotification } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Toolbar, FilterChip } from '../ui/Toolbar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

const TYPE_LABELS: Record<UniversityNotification['type'], string> = {
  SYSTEM: 'System', APPLICATION: 'Application', JOB: 'Job', MESSAGE: 'Message', INTERVIEW: 'Interview', NETWORK: 'Network', AI: 'AI insight', EVENT: 'Event',
};
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const PRIORITY_TONE: Record<UniversityNotification['priority'], BadgeTone> = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', URGENT: 'error' };

export const NotificationsCenter: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<UniversityNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setNotifications(await UniversityService.getNotifications()); }
    catch (err: any) { setError(err?.message || 'Failed to load notifications.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => notifications.filter(n => filter === 'all' || !n.isRead), [notifications, filter]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { await UniversityService.markNotificationRead(id); } catch (err: any) { showToast(err?.message || 'Failed to mark as read.', 'error'); load(); }
  };
  const handleMarkAllRead = async () => {
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await UniversityService.markAllNotificationsRead(); showToast('All notifications marked as read.', 'success'); }
    catch (err: any) { setNotifications(previous); showToast(err?.message || 'Failed to mark all as read.', 'error'); }
  };
  const handleDelete = async (id: string) => {
    const previous = notifications;
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await UniversityService.deleteNotification(id); } catch (err: any) { setNotifications(previous); showToast(err?.message || 'Failed to delete.', 'error'); }
  };

  return (
    <>
      <PageHeader title="Notifications" description={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up.'}
        actions={<Button variant="outline" disabled={unreadCount === 0} onClick={handleMarkAllRead} leftIcon={<span className="material-symbols-outlined text-[19px]">done_all</span>}>Mark all read</Button>} />
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Unread" value={unreadCount} icon="mark_email_unread" hint="need a look" onClick={() => setFilter('unread')} />
          <StatCard label="Total" value={notifications.length} icon="notifications" hint="all time" onClick={() => setFilter('all')} />
        </div>
        <div>
          <Toolbar filters={<>
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={notifications.length}>All</FilterChip>
            <FilterChip active={filter === 'unread'} onClick={() => setFilter('unread')} count={unreadCount}>Unread</FilterChip>
          </>} />
          {isLoading ? (
            <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
          ) : error ? (
            <EmptyState icon="cloud_off" title="Couldn't load notifications" description={error} actionLabel="Retry" onAction={load} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="notifications_off" title={filter === 'unread' ? 'No unread notifications' : "You're all caught up"} description={filter === 'unread' ? 'Everything has been read.' : 'New notifications will appear here.'} />
          ) : (
            <div className="space-y-3">
              {filtered.map(n => (
                <div key={n.id} className={`group bg-surface-container-lowest p-5 rounded-2xl border flex items-start gap-4 shadow-card ${n.isRead ? 'border-outline-variant/60' : 'border-primary/30'}`}>
                  <Badge tone={PRIORITY_TONE[n.priority]}>{TYPE_LABELS[n.type]}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface">{n.title}</p>
                    <p className="text-label-md text-on-surface-variant mt-1">{n.content}</p>
                    <p className="text-label-sm text-on-surface-variant/80 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && <button onClick={() => handleMarkRead(n.id)} className="p-2 rounded-lg hover:bg-surface-container" aria-label="Mark as read"><span className="material-symbols-outlined text-primary text-[20px]">done</span></button>}
                    <button onClick={() => handleDelete(n.id)} className="p-2 rounded-lg hover:bg-error-container/40" aria-label="Delete"><span className="material-symbols-outlined text-error text-[20px]">delete</span></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsCenter;
