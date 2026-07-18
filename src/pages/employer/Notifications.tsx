import React, { useMemo, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

type Filter = 'All' | 'Unread' | 'Important';
const FILTERS: Filter[] = ['All', 'Unread', 'Important'];

const typeConfig: Record<string, { icon: string; tone: string }> = {
  interview: { icon: 'event', tone: 'bg-info-container text-on-info-container' },
  application: { icon: 'assignment_ind', tone: 'bg-primary-container text-on-primary-container' },
  resume: { icon: 'description', tone: 'bg-tertiary-container text-on-tertiary-container' },
  message: { icon: 'forum', tone: 'bg-surface-container-high text-on-surface-variant' },
};

/** Employer notifications — real, from the shared notification context. No fabricated feed. */
export const EmployerNotifications: React.FC = () => {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>('All');

  const unread = notifications.filter((n: any) => !n.isRead).length;
  const important = notifications.filter((n: any) => n.isImportant).length;

  const filtered = useMemo(() => notifications.filter((n: any) => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Important') return n.isImportant;
    return true;
  }), [notifications, filter]);

  const countFor = (f: Filter) => f === 'Unread' ? unread : f === 'Important' ? important : notifications.length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates on applications, interviews and messages across your organization."
        actions={<Button variant="outline" disabled={unread === 0} onClick={markAllAsRead} leftIcon={<span className="material-symbols-outlined text-[19px]">done_all</span>}>Mark all read</Button>}
      />
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Unread" value={unread} icon="mark_email_unread" hint="need a look" onClick={() => setFilter('Unread')} />
          <StatCard label="Important" value={important} icon="priority_high" hint="flagged" onClick={() => setFilter('Important')} />
          <StatCard label="Total" value={notifications.length} icon="notifications" hint="all time" onClick={() => setFilter('All')} />
        </div>

        <div>
          <Toolbar filters={FILTERS.map(f => <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)} count={countFor(f)}>{f}</FilterChip>)} />
          {filtered.length === 0 ? (
            <EmptyState icon="notifications_off"
              title={notifications.length === 0 ? "You're all caught up" : 'Nothing in this view'}
              description={notifications.length === 0 ? "When a candidate applies, an interview is booked, or you receive a message, it'll appear here." : 'No notifications match this filter.'} />
          ) : (
            <div className="space-y-3">
              {filtered.map((n: any) => {
                const cfg = typeConfig[n.type] || { icon: 'notifications', tone: 'bg-surface-container-high text-on-surface-variant' };
                return (
                  <div key={n.id} onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                    className={`group relative bg-surface-container-lowest p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 shadow-card hover:shadow-card-hover ${n.isRead ? 'border-outline-variant/60' : 'border-primary/30'}`}>
                    {!n.isRead && <span className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-primary" />}
                    <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.tone}`}><span className="material-symbols-outlined text-[20px]">{cfg.icon}</span></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-body-md font-semibold text-on-surface truncate">{n.title}</h4>
                          {n.isImportant && <Badge tone="warning">Important</Badge>}
                        </div>
                        <span className="text-label-sm text-on-surface-variant shrink-0">{n.time}</span>
                      </div>
                      {n.content && <p className="text-label-md text-on-surface-variant mt-1 leading-relaxed">{n.content}</p>}
                      {!n.isRead && <Button size="sm" variant="ghost" className="mt-2" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>Mark read</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployerNotifications;
