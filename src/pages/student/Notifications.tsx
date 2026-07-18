import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

type Filter = 'All' | 'Unread' | 'Applications' | 'Interviews' | 'AI' | 'Network' | 'Important' | 'Archived';
const FILTERS: Filter[] = ['All', 'Unread', 'Applications', 'Interviews', 'AI', 'Network', 'Important', 'Archived'];

const typeConfig: Record<string, { icon: string; tone: string }> = {
  interview: { icon: 'event', tone: 'bg-info-container text-on-info-container' },
  ai: { icon: 'auto_awesome', tone: 'bg-primary-container text-on-primary-container' },
  resume: { icon: 'description', tone: 'bg-tertiary-container text-on-tertiary-container' },
  network: { icon: 'group', tone: 'bg-surface-container-high text-on-surface-variant' },
  message: { icon: 'forum', tone: 'bg-surface-container-high text-on-surface-variant' },
};

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);

  const isStarred = (n: any) => starredIds.includes(n.id) || n.isImportant;

  const filtered = useMemo(() => notifications.filter((n: any) => {
    if (activeFilter === 'Archived') return archivedIds.includes(n.id);
    if (archivedIds.includes(n.id)) return false;
    switch (activeFilter) {
      case 'All': return true;
      case 'Unread': return !n.isRead;
      case 'Important': return isStarred(n);
      case 'Applications': return n.type === 'resume';
      case 'Interviews': return n.type === 'interview';
      case 'AI': return n.type === 'ai';
      case 'Network': return n.type === 'network';
      default: return true;
    }
  }), [notifications, activeFilter, archivedIds, starredIds]);

  const visible = notifications.filter((n: any) => !archivedIds.includes(n.id));
  const unread = visible.filter((n: any) => !n.isRead).length;
  const interviewCount = visible.filter((n: any) => n.type === 'interview').length;
  const appCount = visible.filter((n: any) => n.type === 'resume').length;
  const aiCount = visible.filter((n: any) => n.type === 'ai').length;

  const countFor = (f: Filter): number => {
    if (f === 'Archived') return archivedIds.length;
    return notifications.filter((n: any) => {
      if (archivedIds.includes(n.id)) return false;
      switch (f) {
        case 'All': return true;
        case 'Unread': return !n.isRead;
        case 'Important': return isStarred(n);
        case 'Applications': return n.type === 'resume';
        case 'Interviews': return n.type === 'interview';
        case 'AI': return n.type === 'ai';
        case 'Network': return n.type === 'network';
        default: return true;
      }
    }).length;
  };

  const toggleStar = (id: string) => setStarredIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const archive = (id: string) => setArchivedIds(p => [...p, id]);

  return (
    <PageLayout searchPlaceholder="Search notifications…">
      <PageHeader
        title="Notifications"
        description="Updates on your applications, interviews, recommendations and network."
        actions={
          <>
            <Button variant="outline" disabled={unread === 0} onClick={markAllAsRead}
              leftIcon={<span className="material-symbols-outlined text-[19px]">done_all</span>}>
              Mark all read
            </Button>
            <Button variant="ghost" onClick={() => navigate('/student/settings')}
              leftIcon={<span className="material-symbols-outlined text-[19px]">settings</span>}>
              Preferences
            </Button>
          </>
        }
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Unread" value={unread} icon="mark_email_unread" hint="need a look" onClick={() => setActiveFilter('Unread')} />
          <StatCard label="Applications" value={appCount} icon="description" hint="status updates" onClick={() => setActiveFilter('Applications')} />
          <StatCard label="Interviews" value={interviewCount} icon="event" hint="scheduling" onClick={() => setActiveFilter('Interviews')} />
          <StatCard label="AI insights" value={aiCount} icon="auto_awesome" hint="recommendations" onClick={() => setActiveFilter('AI')} />
        </div>

        <div>
          <Toolbar
            filters={FILTERS.map(f => (
              <FilterChip key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} count={countFor(f)}>{f}</FilterChip>
            ))}
          />

          {filtered.length === 0 ? (
            <EmptyState icon="notifications_off"
              title={notifications.length === 0 ? "You're all caught up" : 'Nothing in this view'}
              description={notifications.length === 0
                ? "When something needs your attention — an application update, a scheduled interview, a new recommendation — it'll appear here."
                : 'No notifications match this filter right now.'}
              actionLabel={activeFilter === 'All' ? undefined : 'Show all'}
              onAction={activeFilter === 'All' ? undefined : () => setActiveFilter('All')} />
          ) : (
            <div className="space-y-3">
              {filtered.map((n: any) => {
                const cfg = typeConfig[n.type] || { icon: 'notifications', tone: 'bg-surface-container-high text-on-surface-variant' };
                return (
                  <div key={n.id}
                    onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                    className={`group relative bg-surface-container-lowest p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 shadow-card hover:shadow-card-hover ${n.isRead ? 'border-outline-variant/60' : 'border-primary/30'}`}>
                    {!n.isRead && <span className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-primary" />}
                    <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.tone}`}>
                      <span className="material-symbols-outlined text-[20px]">{cfg.icon}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-body-md font-semibold text-on-surface truncate">{n.title}</h4>
                          {isStarred(n) && <Badge tone="warning">Priority</Badge>}
                        </div>
                        <span className="text-label-sm text-on-surface-variant shrink-0">{n.time}</span>
                      </div>
                      {n.content && <p className="text-label-md text-on-surface-variant mt-1 leading-relaxed">{n.content}</p>}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex gap-2">
                          {n.action && (
                            <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); navigate(n.action.link); }}>
                              {n.action.label}
                            </Button>
                          )}
                          {!n.isRead && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>Mark read</Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); toggleStar(n.id); }} title="Priority"
                            className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container ${isStarred(n) ? 'text-warning' : 'text-on-surface-variant/60'}`}>
                            <span className="material-symbols-outlined text-[18px]">star</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); archive(n.id); }} title="Archive"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-error hover:bg-surface-container">
                            <span className="material-symbols-outlined text-[18px]">archive</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Notifications;
