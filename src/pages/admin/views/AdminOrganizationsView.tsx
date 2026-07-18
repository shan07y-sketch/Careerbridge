import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminCompanyRow, type AdminUniversityRow } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Toolbar, FilterChip } from '../../../components/ui/Toolbar';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

type Tab = 'companies' | 'universities';

export const AdminOrganizationsView: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('companies');
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [universities, setUniversities] = useState<AdminUniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setSearch(searchInput), 300); return () => clearTimeout(t); }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'companies') setCompanies((await AdminService.getCompanies(1, 50, search || undefined)).companies);
      else setUniversities((await AdminService.getUniversities(1, 50, search || undefined)).universities);
    } catch (e: any) { setError(e?.message || 'Failed to load organizations.'); }
    finally { setLoading(false); }
  }, [tab, search]);
  useEffect(() => { load(); }, [load]);

  const verifyCompany = async (id: string, v: boolean) => { setActingId(id); try { await AdminService.verifyCompany(id, v); showToast(v ? 'Company verified.' : 'Company unverified.', 'success'); await load(); } catch (e: any) { showToast(e?.message || 'Failed.', 'error'); } finally { setActingId(null); } };
  const toggleCompany = async (id: string, deactivate: boolean) => { setActingId(id); try { await AdminService.toggleCompany(id, deactivate); showToast(deactivate ? 'Company deactivated.' : 'Company reactivated.', 'success'); await load(); } catch (e: any) { showToast(e?.message || 'Failed.', 'error'); } finally { setActingId(null); } };
  const verifyUni = async (id: string, v: boolean) => { setActingId(id); try { await AdminService.verifyUniversity(id, v); showToast(v ? 'University verified.' : 'University unverified.', 'success'); await load(); } catch (e: any) { showToast(e?.message || 'Failed.', 'error'); } finally { setActingId(null); } };
  const toggleUni = async (id: string, deactivate: boolean) => { setActingId(id); try { await AdminService.toggleUniversity(id, deactivate); showToast(deactivate ? 'University deactivated.' : 'University reactivated.', 'success'); await load(); } catch (e: any) { showToast(e?.message || 'Failed.', 'error'); } finally { setActingId(null); } };

  const th = 'px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant text-left';

  return (
    <>
      <PageHeader title="Organizations" description="Companies and universities on the platform — verify, and activate or deactivate accounts." />
      <div className="space-y-6">
        <Toolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search organizations…"
          filters={<>
            <FilterChip active={tab === 'companies'} onClick={() => setTab('companies')}>Companies</FilterChip>
            <FilterChip active={tab === 'universities'} onClick={() => setTab('universities')}>Universities</FilterChip>
          </>}
        />
        {loading ? (
          <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <EmptyState icon="cloud_off" title="Couldn't load organizations" description={error} actionLabel="Retry" onAction={load} />
        ) : tab === 'companies' ? (
          companies.length === 0 ? <EmptyState icon="apartment" title="No companies found" description="No companies match your search." /> : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="border-b border-outline-variant/60"><tr><th className={th}>Company</th><th className={th}>Industry</th><th className={th}>Jobs</th><th className={th}>Status</th><th className={`${th} text-right`}>Actions</th></tr></thead>
                <tbody>{companies.map(c => (
                  <tr key={c.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-on-surface">{c.name}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{c.industry}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{c._count.jobs} · {c._count.recruiters} recruiters</td>
                    <td className="px-5 py-4"><div className="flex gap-1.5">{c.isDeleted ? <Badge tone="error">Inactive</Badge> : <Badge tone="success">Active</Badge>}{c.isVerified && <Badge tone="info" icon="verified">Verified</Badge>}</div></td>
                    <td className="px-5 py-4 text-right"><div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" disabled={actingId === c.id} onClick={() => verifyCompany(c.id, !c.isVerified)}>{c.isVerified ? 'Unverify' : 'Verify'}</Button>
                      <Button size="sm" variant="ghost" className={c.isDeleted ? '' : '!text-error'} disabled={actingId === c.id} onClick={() => toggleCompany(c.id, !c.isDeleted)}>{c.isDeleted ? 'Reactivate' : 'Deactivate'}</Button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          )
        ) : (
          universities.length === 0 ? <EmptyState icon="school" title="No universities found" description="No universities match your search." /> : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="border-b border-outline-variant/60"><tr><th className={th}>University</th><th className={th}>Location</th><th className={th}>Students</th><th className={th}>Status</th><th className={`${th} text-right`}>Actions</th></tr></thead>
                <tbody>{universities.map(u => (
                  <tr key={u.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-on-surface">{u.name}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{u.location}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{u._count.students} · {u._count.placementDrives} drives</td>
                    <td className="px-5 py-4"><div className="flex gap-1.5">{u.isDeleted ? <Badge tone="error">Inactive</Badge> : <Badge tone="success">Active</Badge>}{u.isVerified && <Badge tone="info" icon="verified">Verified</Badge>}</div></td>
                    <td className="px-5 py-4 text-right"><div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" disabled={actingId === u.id} onClick={() => verifyUni(u.id, !u.isVerified)}>{u.isVerified ? 'Unverify' : 'Verify'}</Button>
                      <Button size="sm" variant="ghost" className={u.isDeleted ? '' : '!text-error'} disabled={actingId === u.id} onClick={() => toggleUni(u.id, !u.isDeleted)}>{u.isDeleted ? 'Reactivate' : 'Deactivate'}</Button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          )
        )}
      </div>
    </>
  );
};

export default AdminOrganizationsView;
