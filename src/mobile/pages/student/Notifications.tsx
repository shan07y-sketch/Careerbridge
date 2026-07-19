/**
 * Mobile Notifications — premium activity feed.
 * Aurora hero with unread count + mark-all, sticky type filters, and a
 * rise-in list with priority emphasis and action deep-links.
 * All data + mutations via NotificationService (real API).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../../types';
import { NotificationService } from '../../../services';
import { MobileShell, Chip, SkeletonList, EmptyState, ErrorState, PullToRefresh } from '../../components';

/**
 * The API returns the backend enum (uppercase, broader than the legacy
 * frontend union): INTERVIEW | AI | RESUME | NETWORK | MESSAGE | APPLICATION |
 * JOB | SYSTEM | EVENT. Normalize so icons, filters and priority actually work.
 */
const TYPE_META: Record<string, { icon: string; label: string }> = {
  INTERVIEW: { icon: 'event', label: 'Interviews' },
  AI: { icon: 'neurology', label: 'AI' },
  RESUME: { icon: 'description', label: 'Resume' },
  NETWORK: { icon: 'group', label: 'Network' },
  MESSAGE: { icon: 'forum', label: 'Messages' },
  APPLICATION: { icon: 'assignment_turned_in', label: 'Applications' },
  JOB: { icon: 'work', label: 'Jobs' },
  SYSTEM: { icon: 'settings', label: 'System' },
  EVENT: { icon: 'celebration', label: 'Events' },
};
const typeKey = (t: Notification['type'] | string): string => String(t || '').toUpperCase();
const metaFor = (t: Notification['type'] | string) => TYPE_META[typeKey(t)] || { icon: 'notifications', label: 'Updates' };
const isHigh = (n: Notification): boolean => String(n.priority || '').toUpperCase() === 'HIGH' || !!n.isImportant;

type Filter = string; // 'all' | 'unread' | uppercase type key

const MobileNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

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

  // Type filters only for types actually present (normalized), in a stable order.
  const presentTypes = useMemo(() => {
    const order = Object.keys(TYPE_META);
    const set = new Set(items.map(n => typeKey(n.type)));
    return order.filter(t => set.has(t)).concat(Array.from(set).filter(t => !order.includes(t)));
  }, [items]);

  const visible = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter(n => !n.isRead);
    return items.filter(n => typeKey(n.type) === filter);
  }, [items, filter]);

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

  if (loading) {
    return <MobileShell title="Notifications"><SkeletonList count={6} itemClass="h-16" /></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Notifications"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  return (
    <MobileShell bare>
      {/* ---- Aurora hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] text-white/70 leading-none">Activity</p>
            <h1 className="text-2xl font-extrabold leading-tight">Notifications</h1>
            <p className="mt-1 text-[13px] text-white/75">{unread ? `${unread} unread` : 'You’re all caught up'}</p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="m-press h-9 px-4 rounded-full m-glass text-xs font-bold text-white"
            >
              Mark all read
            </button>
          )}
        </div>
      </section>

      {/* ---- Sticky type filters ---- */}
      {items.length > 0 && (
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-on-surface/5">
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5" style={{ scrollbarWidth: 'none' }}>
            <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
            {unread > 0 && (
              <Chip selected={filter === 'unread'} onClick={() => setFilter('unread')}>Unread · {unread}</Chip>
            )}
            {presentTypes.map(t => (
              <Chip key={t} selected={filter === t} onClick={() => setFilter(t)}>{metaFor(t).label}</Chip>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon="notifications" title="No notifications" hint="Interview invites, AI insights and updates will land here." />
      ) : visible.length === 0 ? (
        <EmptyState icon="filter_alt_off" title="Nothing here" hint="No notifications match this filter." />
      ) : (
        <PullToRefresh onRefresh={load}>
          <div className="px-4 pt-3 space-y-2.5">
            {visible.map((n, i) => {
              const high = isHigh(n);
              const meta = metaFor(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={`m-card-lift w-full text-left rounded-2xl border p-3.5 flex items-start gap-3 m-rise m-rise-${Math.min(i + 1, 5)} ${
                    n.isRead ? 'bg-surface-container/50 border-on-surface/5' : 'bg-surface-container/80 border-primary/15'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    high ? 'bg-warning/15' : n.isRead ? 'bg-surface-container' : 'bg-primary-container'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      high ? 'text-warning' : n.isRead ? 'text-on-surface-variant' : 'text-on-primary-container'
                    }`}>
                      {meta.icon}
                    </span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm leading-snug truncate ${n.isRead ? 'font-medium text-on-surface-variant' : 'font-bold text-on-surface'}`}>{n.title}</p>
                      {high && <span className="text-[10px] font-bold text-warning shrink-0">!</span>}
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{n.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-on-surface-variant">{n.time}</p>
                      {n.action?.label && (
                        <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-0.5">
                          {n.action.label}<span className="material-symbols-outlined text-[13px]">chevron_right</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" aria-label="Unread" />}
                </button>
              );
            })}
            <div className="h-4" />
          </div>
        </PullToRefresh>
      )}
    </MobileShell>
  );
};

export default MobileNotifications;
