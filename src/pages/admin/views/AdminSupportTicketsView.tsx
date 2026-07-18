import React, { useCallback, useEffect, useState } from 'react';
import { AdminDataTable, AdminDialog, Badge } from '../../../components/admin';
import type { AdminTableColumn } from '../../../components/admin';
import { AdminService } from '../../../services';
import type { AdminSupportTicket } from '../../../services';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const STATUS_TONE: Record<AdminSupportTicket['status'], 'warning' | 'info' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

/**
 * Real support ticket triage, backed by the SupportTicket table. Every row
 * originates from an actual submission (currently the University Portal's
 * "Contact Support" form; other portals can wire into the same endpoint).
 */
export const AdminSupportTicketsView: React.FC = () => {
  const [rows, setRows] = useState<AdminSupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTicket, setActiveTicket] = useState<AdminSupportTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Rows previously showed only a single-line, truncated preview of the
  // message with no way to read the rest -- an admin triaging a real ticket
  // needs the full submission, not a clipped fragment. Any row now opens a
  // read-only detail view; the resolve action stays a separate, explicit dialog.
  const [detailTicket, setDetailTicket] = useState<AdminSupportTicket | null>(null);

  const pageSize = 20;

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    AdminService.getSupportTickets(page, pageSize, status || undefined)
      .then((res) => { setRows(res.tickets); setTotal(res.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load support tickets.'))
      .finally(() => setIsLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const quickUpdateStatus = async (ticket: AdminSupportTicket, newStatus: string) => {
    try {
      await AdminService.updateSupportTicket(ticket.id, { status: newStatus });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket.');
    }
  };

  const openResolveDialog = (ticket: AdminSupportTicket) => {
    setActiveTicket(ticket);
    setResolutionNote(ticket.resolutionNote ?? '');
  };

  const submitResolution = async () => {
    if (!activeTicket) return;
    setIsSubmitting(true);
    try {
      await AdminService.updateSupportTicket(activeTicket.id, { status: 'RESOLVED', resolutionNote });
      setActiveTicket(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: AdminTableColumn<AdminSupportTicket>[] = [
    {
      key: 'subject', header: 'Ticket', render: (t) => (
        <div>
          <p className="font-semibold text-on-surface">{t.subject}</p>
          <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{t.message}</p>
        </div>
      )
    },
    { key: 'requester', header: 'Requester', render: (t) => (
      <div>
        <p className="text-on-surface">{t.requesterEmail}</p>
        <p className="text-xs text-on-surface-variant">{t.requesterRole}</p>
      </div>
    ) },
    { key: 'status', header: 'Status', render: (t) => <Badge label={t.status.replace('_', ' ')} tone={STATUS_TONE[t.status]} size="sm" /> },
    { key: 'priority', header: 'Priority', render: (t) => t.priority },
    { key: 'createdAt', header: 'Submitted', render: (t) => new Date(t.createdAt).toLocaleString() },
    {
      key: 'actions', header: '', align: 'right', render: (t) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {t.status === 'OPEN' && (
            <button type="button" onClick={() => quickUpdateStatus(t, 'IN_PROGRESS')} className="text-xs font-semibold text-primary hover:underline">Start</button>
          )}
          {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') && (
            <button type="button" onClick={() => openResolveDialog(t)} className="text-xs font-semibold text-primary hover:underline">Resolve</button>
          )}
          {t.status !== 'CLOSED' && (
            <button type="button" onClick={() => quickUpdateStatus(t, 'CLOSED')} className="text-xs font-semibold text-on-surface-variant hover:underline">Close</button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Filter by status"
        >
          <option value="">Status: All</option>
          {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {status && (
          <button type="button" onClick={() => setStatus('')} className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors">
            Clear filter
          </button>
        )}
      </div>

      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        error={error}
        emptyTitle="No support tickets"
        emptyDescription="Requests submitted through any portal's support form will appear here."
        pagination={{ page, pageSize, total, onPageChange: setPage }}
        onRowClick={(t) => setDetailTicket(t)}
      />

      <AdminDialog
        isOpen={!!detailTicket}
        onClose={() => setDetailTicket(null)}
        title={detailTicket?.subject ?? 'Ticket'}
        size="md"
      >
        {detailTicket && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label={detailTicket.status.replace('_', ' ')} tone={STATUS_TONE[detailTicket.status]} size="sm" />
              <span className="text-xs text-on-surface-variant">
                {detailTicket.requesterEmail} &middot; {detailTicket.requesterRole}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Submitted {new Date(detailTicket.createdAt).toLocaleString()}
            </p>
            <div className="rounded-lg bg-surface-container-high p-3 whitespace-pre-wrap text-on-surface">
              {detailTicket.message}
            </div>
            {detailTicket.resolutionNote && (
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">Resolution notes</p>
                <div className="rounded-lg bg-surface-container-high p-3 whitespace-pre-wrap text-on-surface">
                  {detailTicket.resolutionNote}
                </div>
              </div>
            )}
            {detailTicket.assignedTo && (
              <p className="text-xs text-on-surface-variant">Assigned to {detailTicket.assignedTo.email}</p>
            )}
          </div>
        )}
      </AdminDialog>

      <AdminDialog
        isOpen={!!activeTicket}
        onClose={() => setActiveTicket(null)}
        title="Resolve ticket"
        confirmLabel="Mark resolved"
        onConfirm={submitResolution}
        isLoading={isSubmitting}
      >
        <textarea
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          placeholder="Resolution notes (optional, visible in audit history)"
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </AdminDialog>
    </div>
  );
};

export default AdminSupportTicketsView;
