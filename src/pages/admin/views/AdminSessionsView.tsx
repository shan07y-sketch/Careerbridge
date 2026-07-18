import React, { useCallback, useEffect, useState } from 'react';
import { AdminDataTable, AdminDialog, FilterBar } from '../../../components/admin';
import type { AdminTableColumn } from '../../../components/admin';
import { AdminService } from '../../../services';
import type { AdminSession } from '../../../services';

type DialogAction = 'session' | 'family' | null;

/**
 * Sessions & Devices, backed directly by the real RefreshToken table --
 * the same rows that power login/refresh/logout. There is no separate
 * device-fingerprint model: "device" here is a login session, and revoking
 * one immediately invalidates that refresh token (the user is forced to
 * re-authenticate on their next token refresh).
 */
export const AdminSessionsView: React.FC = () => {
  const [rows, setRows] = useState<AdminSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<AdminSession | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageSize = 20;

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    AdminService.getActiveSessions(page, pageSize, search || undefined)
      .then((res) => { setRows(res.sessions); setTotal(res.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load sessions.'))
      .finally(() => setIsLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const closeDialog = () => { setDialogAction(null); setActiveSession(null); };

  const runAction = async () => {
    if (!activeSession || !dialogAction) return;
    setIsSubmitting(true);
    try {
      if (dialogAction === 'session') await AdminService.revokeSession(activeSession.id);
      else await AdminService.revokeSessionFamily(activeSession.family);
      closeDialog();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: AdminTableColumn<AdminSession>[] = [
    { key: 'user', header: 'User', render: (s) => <div><p className="font-semibold text-on-surface">{s.user.email}</p><p className="text-xs text-on-surface-variant">{s.user.role}</p></div> },
    { key: 'createdAt', header: 'Signed in', render: (s) => new Date(s.createdAt).toLocaleString() },
    { key: 'expiresAt', header: 'Expires', render: (s) => new Date(s.expiresAt).toLocaleString() },
    {
      key: 'actions', header: '', align: 'right', render: (s) => (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setActiveSession(s); setDialogAction('session'); }} className="text-xs font-semibold text-error hover:underline">Revoke session</button>
          <button type="button" onClick={() => { setActiveSession(s); setDialogAction('family'); }} className="text-xs font-semibold text-error hover:underline">Sign out everywhere</button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by user email…" />

      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        error={error}
        emptyTitle="No active sessions"
        emptyDescription="Every currently valid login session across the platform will appear here."
        pagination={{ page, pageSize, total, onPageChange: setPage }}
      />

      <AdminDialog
        isOpen={dialogAction === 'session'}
        onClose={closeDialog}
        title="Revoke session"
        description={`This immediately invalidates this session for ${activeSession?.user.email ?? 'this user'}. Other active sessions for this user are unaffected.`}
        confirmLabel="Revoke"
        confirmVariant="error"
        onConfirm={runAction}
        isLoading={isSubmitting}
      />
      <AdminDialog
        isOpen={dialogAction === 'family'}
        onClose={closeDialog}
        title="Sign out everywhere"
        description={`This revokes every session descended from this login for ${activeSession?.user.email ?? 'this user'}, forcing them to re-authenticate on all devices.`}
        confirmLabel="Sign out everywhere"
        confirmVariant="error"
        onConfirm={runAction}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AdminSessionsView;
