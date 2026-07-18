import React, { useEffect, useMemo, useState } from 'react';
import { EmployerRecruiterService } from '../../services';
import type { EmployerRecruiter } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';

const displayName = (r: EmployerRecruiter) =>
  r.firstName || r.lastName ? `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() : r.user.email;

export const RecruitersPanel: React.FC = () => {
  const { showToast } = useToast();
  const [recruiters, setRecruiters] = useState<EmployerRecruiter[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    EmployerRecruiterService.getRecruiters()
      .then(setRecruiters)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load recruiters.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const totals = useMemo(() => {
    const list = recruiters || [];
    return {
      count: list.length,
      jobs: list.reduce((a, r) => a + r._count.jobs, 0),
      offers: list.reduce((a, r) => a + r._count.offers, 0),
      interviews: list.reduce((a, r) => a + r._count.scheduledInterviews, 0),
    };
  }, [recruiters]);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await EmployerRecruiterService.inviteRecruiter(inviteEmail.trim());
      showToast(`Invitation sent to ${inviteEmail.trim()}.`, 'success');
      setInviteEmail(''); setIsInviteOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send invitation.', 'error');
    } finally { setIsInviting(false); }
  };

  const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 focus:shadow-focus-brand outline-none transition-all';

  return (
    <>
      <PageHeader
        title="Recruiters"
        description="Everyone on your recruiting team and their live workload."
        actions={<Button variant="primary" onClick={() => setIsInviteOpen(true)} leftIcon={<span className="material-symbols-outlined text-[19px]">person_add</span>}>Invite recruiter</Button>}
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Recruiters" value={totals.count} icon="badge" hint="on your team" />
          <StatCard label="Jobs owned" value={totals.jobs} icon="work" hint="across the team" />
          <StatCard label="Interviews" value={totals.interviews} icon="videocam" hint="scheduled" />
          <StatCard label="Offers" value={totals.offers} icon="handshake" hint="extended" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <EmptyState icon="cloud_off" title="Couldn't load your team" description={error} actionLabel="Retry" onAction={load} />
        ) : !recruiters || recruiters.length === 0 ? (
          <EmptyState icon="group_add" title="No recruiters yet"
            description="Invite your first teammate to start collaborating on hiring — they'll be able to post jobs, review candidates and schedule interviews."
            actionLabel="Invite recruiter" onAction={() => setIsInviteOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruiters.map(r => (
              <Card key={r.id}>
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-title-lg shrink-0">{displayName(r).charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <h3 className="text-body-md font-semibold text-on-surface truncate">{displayName(r)}</h3>
                    <p className="text-label-sm text-on-surface-variant truncate">{r.title}</p>
                    <p className="text-label-sm text-on-surface-variant/80 truncate">{r.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-outline-variant/60 text-center">
                  <div><p className="text-title-md font-semibold text-on-surface">{r._count.jobs}</p><p className="text-label-sm text-on-surface-variant">Jobs</p></div>
                  <div><p className="text-title-md font-semibold text-on-surface">{r._count.offers}</p><p className="text-label-sm text-on-surface-variant">Offers</p></div>
                  <div><p className="text-title-md font-semibold text-on-surface">{r._count.scheduledInterviews}</p><p className="text-label-sm text-on-surface-variant">Interviews</p></div>
                </div>
                <p className="text-label-sm text-on-surface-variant/80 mt-4">{r.user.lastLoginAt ? `Last active ${new Date(r.user.lastLoginAt).toLocaleDateString()}` : 'Never logged in'}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite a recruiter">
        <form onSubmit={submitInvite} className="space-y-4 text-left">
          <label className="block">
            <span className="text-label-md font-semibold text-on-surface">Email address</span>
            <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@company.com" className={`mt-1.5 ${inputClass}`} />
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isInviting}>{isInviting ? 'Sending…' : 'Send invite'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default RecruitersPanel;
