import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminSupportTicket } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Toolbar, FilterChip } from '../../../components/ui/Toolbar';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

const STATUSES = ['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const STATUS_TONE: Record<string, BadgeTone> = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'neutral' };
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ');

export const AdminModerationView: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { setPage(1); }, [status]);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await AdminService.getSupportTickets(page, limit, status === 'All' ? undefined : status); setTickets(res.tickets); setTotal(res.total); }
    catch (e: any) { setError(e?.message || 'Failed to load tickets.'); }
    finally { setLoading(false); }
  }, [page, status]);
  useEffect(() => { load(); }, [load]);

  const setTicketStatus = async (id: string, newStatus: string) => {
    setActingId(id);
    try { await AdminService.updateSupportTicket(id, { status: newStatus }); showToast(`Ticket marked ${label(newStatus)}.`, 'success'); await load(); }
    catch (e: any) { showToast(e?.message || 'Failed to update ticket.', 'error'); }
    finally { setActingId(null); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <PageHeader title="Moderation & support" description="Support tickets and escalations from across the platform." />
      <div className="space-y-6">
        <Toolbar filters={STATUSES.map(s => <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>{s === 'All' ? 'All' : label(s)}</FilterChip>)} />
        {loading ? (
          <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <EmptyState icon="cloud_off" title="Couldn't load tickets" description={error} actionLabel="Retry" onAction={load} />
        ) : tickets.length === 0 ? (
          <EmptyState icon="inbox" title="No tickets" description={status === 'All' ? 'No support tickets have been raised.' : `No ${label(status)} tickets right now.`} />
        ) : (
          <>
            <p className="text-label-sm text-on-surface-variant">{total.toLocaleString()} tickets</p>
            <div className="space-y-3">
              {tickets.map(t => (
                <Card key={t.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><p className="text-body-md font-semibold text-on-surface truncate">{t.subject}</p><Badge tone={STATUS_TONE[t.status] || 'neutral'}>{label(t.status)}</Badge></div>
                      <p className="text-label-md text-on-surface-variant mt-1 line-clamp-2">{t.message}</p>
                      <p className="text-label-sm text-on-surface-variant/80 mt-2">{t.requesterEmail} · {t.requesterRole.toLowerCase()} · {new Date(t.createdAt).toLocaleDateString()}{t.assignedTo ? ` · assigned to ${t.assignedTo.email}` : ''}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {t.status === 'OPEN' && <Button size="sm" variant="outline" disabled={actingId === t.id} onClick={() => setTicketStatus(t.id, 'IN_PROGRESS')}>Start</Button>}
                      {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') && <Button size="sm" variant="primary" disabled={actingId === t.id} onClick={() => setTicketStatus(t.id, 'RESOLVED')}>Resolve</Button>}
                      {t.status === 'RESOLVED' && <Button size="sm" variant="ghost" disabled={actingId === t.id} onClick={() => setTicketStatus(t.id, 'CLOSED')}>Close</Button>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                <span className="text-label-md font-semibold text-on-surface-variant">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminModerationView;
