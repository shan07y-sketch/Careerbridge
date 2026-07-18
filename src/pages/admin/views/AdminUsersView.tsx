import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminUserRow } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Toolbar, FilterChip } from '../../../components/ui/Toolbar';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

const ROLES = ['All', 'STUDENT', 'RECRUITER', 'UNIVERSITY', 'ADMIN'];
const displayName = (u: AdminUserRow) =>
  u.studentProfile ? `${u.studentProfile.firstName} ${u.studentProfile.lastName}`
  : u.recruiterProfile ? `${u.recruiterProfile.firstName} ${u.recruiterProfile.lastName}`
  : u.universityProfile ? u.universityProfile.name
  : u.company ? u.company.name : u.email;

export const AdminUsersView: React.FC = () => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);
  useEffect(() => { setPage(1); }, [role]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await AdminService.getUsers(page, limit, search || undefined, role === 'All' ? undefined : role);
      setRows(res.users); setTotal(res.total);
    } catch (e: any) { setError(e?.message || 'Failed to load users.'); }
    finally { setLoading(false); }
  }, [page, search, role]);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'suspend' | 'activate' | 'verify') => {
    setActingId(id);
    try {
      if (action === 'suspend') await AdminService.suspendUser(id);
      else if (action === 'activate') await AdminService.activateUser(id);
      else await AdminService.verifyUser(id);
      showToast(`User ${action === 'verify' ? 'verified' : action + 'd'}.`, 'success');
      await load();
    } catch (e: any) { showToast(e?.message || `Could not ${action} user.`, 'error'); }
    finally { setActingId(null); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <PageHeader title="Users" description="Every account on the platform — search, verify, suspend and manage roles." />
      <div className="space-y-6">
        <Toolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by name or email…"
          filters={ROLES.map(r => <FilterChip key={r} active={role === r} onClick={() => setRole(r)}>{r === 'All' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}</FilterChip>)}
        />
        {loading ? (
          <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <EmptyState icon="cloud_off" title="Couldn't load users" description={error} actionLabel="Retry" onAction={load} />
        ) : rows.length === 0 ? (
          <EmptyState icon="group_off" title="No users found" description="No accounts match your search or filter." />
        ) : (
          <>
            <p className="text-label-sm text-on-surface-variant">{total.toLocaleString()} users</p>
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                  <tr><th className="px-5 py-3 font-semibold">User</th><th className="px-5 py-3 font-semibold">Role</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Joined</th><th className="px-5 py-3 font-semibold text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {rows.map(u => (
                    <tr key={u.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4"><p className="font-semibold text-on-surface">{displayName(u)}</p><p className="text-label-sm text-on-surface-variant">{u.email}</p></td>
                      <td className="px-5 py-4"><Badge tone="neutral">{u.role.charAt(0) + u.role.slice(1).toLowerCase()}</Badge></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {u.isDeleted ? <Badge tone="error">Suspended</Badge> : <Badge tone="success">Active</Badge>}
                          {u.isVerified && <Badge tone="info" icon="verified">Verified</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          {!u.isVerified && <Button size="sm" variant="ghost" disabled={actingId === u.id} onClick={() => act(u.id, 'verify')}>Verify</Button>}
                          {u.isDeleted
                            ? <Button size="sm" variant="ghost" disabled={actingId === u.id} onClick={() => act(u.id, 'activate')}>Activate</Button>
                            : <Button size="sm" variant="ghost" className="!text-error" disabled={actingId === u.id} onClick={() => act(u.id, 'suspend')}>Suspend</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
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

export default AdminUsersView;
