import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminCompanyRow, type AdminUniversityRow } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Section } from '../../../components/ui/Section';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

export const AdminVerificationView: React.FC = () => {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [universities, setUniversities] = useState<AdminUniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [c, u] = await Promise.all([AdminService.getCompanies(1, 100), AdminService.getUniversities(1, 100)]);
      setCompanies(c.companies.filter(x => !x.isVerified && !x.isDeleted));
      setUniversities(u.universities.filter(x => !x.isVerified && !x.isDeleted));
    } catch (e: any) { setError(e?.message || 'Failed to load verification queue.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const verifyCompany = async (id: string) => { setActingId(id); try { await AdminService.verifyCompany(id, true); showToast('Company verified.', 'success'); setCompanies(prev => prev.filter(c => c.id !== id)); } catch (e: any) { showToast(e?.message || 'Failed.', 'error'); } finally { setActingId(null); } };
  const verifyUni = async (id: string) => { setActingId(id); try { await AdminService.verifyUniversity(id, true); showToast('University verified.', 'success'); setUniversities(prev => prev.filter(u => u.id !== id)); } catch (e: any) { showToast(e?.message || 'Failed.', 'error'); } finally { setActingId(null); } };

  const header = <PageHeader title="Verification queue" description="Organizations awaiting verification. Verified orgs rank higher and unlock full platform access." />;
  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load the queue" description={error} actionLabel="Retry" onAction={load} /></>;

  const empty = companies.length === 0 && universities.length === 0;

  return (
    <>
      {header}
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Companies pending" value={companies.length} icon="apartment" hint="to verify" />
          <StatCard label="Universities pending" value={universities.length} icon="school" hint="to verify" />
          <StatCard label="Total pending" value={companies.length + universities.length} icon="pending_actions" hint="need review" />
        </div>

        {empty ? (
          <EmptyState icon="verified" title="Nothing to verify" description="Every organization on the platform is verified. New sign-ups will appear here for review." />
        ) : (
          <>
            {companies.length > 0 && (
              <Section title="Companies" description={`${companies.length} awaiting verification`}>
                <Card className="!p-0 overflow-hidden"><ul className="divide-y divide-outline-variant/60">
                  {companies.map(c => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0"><p className="font-semibold text-on-surface truncate">{c.name}</p><p className="text-label-sm text-on-surface-variant">{c.industry} · {c._count.jobs} jobs · joined {new Date(c.createdAt).toLocaleDateString()}</p></div>
                      <Button size="sm" variant="primary" disabled={actingId === c.id} onClick={() => verifyCompany(c.id)}>Verify</Button>
                    </li>
                  ))}
                </ul></Card>
              </Section>
            )}
            {universities.length > 0 && (
              <Section title="Universities" description={`${universities.length} awaiting verification`}>
                <Card className="!p-0 overflow-hidden"><ul className="divide-y divide-outline-variant/60">
                  {universities.map(u => (
                    <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0"><p className="font-semibold text-on-surface truncate">{u.name}</p><p className="text-label-sm text-on-surface-variant">{u.location} · {u._count.students} students · joined {new Date(u.createdAt).toLocaleDateString()}</p></div>
                      <Button size="sm" variant="primary" disabled={actingId === u.id} onClick={() => verifyUni(u.id)}>Verify</Button>
                    </li>
                  ))}
                </ul></Card>
              </Section>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminVerificationView;
