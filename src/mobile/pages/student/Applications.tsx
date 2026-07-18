/**
 * Mobile Applications — status-grouped list with offer actions and withdraw.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Application } from '../../../types';
import { ApplicationService } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Chip, Segmented, SkeletonList, EmptyState, ErrorState, PullToRefresh, Sheet, Button, Avatar } from '../../components';

type Tab = 'active' | 'offers' | 'closed';

const STATUS_TONE: Record<Application['status'], 'neutral' | 'info' | 'success' | 'error'> = {
  applied: 'neutral',
  interviewing: 'info',
  offer: 'success',
  rejected: 'error',
};

const MobileApplications: React.FC = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('active');
  const [selected, setSelected] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setApplications(await ApplicationService.getApplications());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (tab === 'offers') return applications.filter(a => a.status === 'offer');
    if (tab === 'closed') return applications.filter(a => a.status === 'rejected');
    return applications.filter(a => a.status === 'applied' || a.status === 'interviewing');
  }, [applications, tab]);

  const act = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await fn();
      showToast(done);
      setSelected(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileShell title="Applications" subtitle={`${applications.length} total`}>
      <div className="px-4 pt-3">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'offers', label: 'Offers' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : visible.length === 0 ? (
        <EmptyState icon="assignment" title={tab === 'offers' ? 'No offers yet' : tab === 'closed' ? 'No closed applications' : 'No active applications'} hint="Applications you submit will show up here with their live status." />
      ) : (
        <div className="px-4 pt-3">
          <PullToRefresh onRefresh={load}>
            <div className="space-y-2.5">
              {visible.map(app => (
                <Card key={app.id} onClick={() => setSelected(app)}>
                  <div className="flex items-center gap-3">
                    <Avatar src={app.companyLogo} name={app.companyName} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{app.jobTitle}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {app.companyName} · {new Date(app.dateApplied).toLocaleDateString()}
                      </p>
                    </div>
                    <Chip tone={STATUS_TONE[app.status]}>{app.status}</Chip>
                  </div>
                </Card>
              ))}
            </div>
          </PullToRefresh>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.jobTitle}>
        {selected && (
          <div className="pb-4 space-y-4">
            <p className="text-sm text-on-surface-variant px-1">
              {selected.companyName} · applied {new Date(selected.dateApplied).toLocaleDateString()}
            </p>

            {selected.interviews && selected.interviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface px-1">Interviews</p>
                {selected.interviews.map(iv => (
                  <div key={iv.id} className="m-card p-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">event</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{iv.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(iv.scheduledAt).toLocaleString()} · {iv.duration} min
                      </p>
                    </div>
                    {iv.locationUrl && (
                      <a href={iv.locationUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary">Join</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selected.offer && (
              <div className="m-card p-4 space-y-3">
                <p className="text-sm font-bold">Offer: {selected.offer.title}</p>
                <p className="text-sm text-on-surface-variant">
                  {selected.offer.currency} {selected.offer.salary.toLocaleString()} · starts {new Date(selected.offer.startDate).toLocaleDateString()}
                </p>
                {selected.offer.status === 'EXTENDED' && (
                  <div className="flex gap-2">
                    <Button full disabled={busy} onClick={() => act(() => ApplicationService.acceptOffer(selected.id), 'Offer accepted 🎉')}>Accept</Button>
                    <Button full variant="outline" disabled={busy} onClick={() => act(() => ApplicationService.declineOffer(selected.id), 'Offer declined')}>Decline</Button>
                  </div>
                )}
                {selected.offer.status !== 'EXTENDED' && (
                  <Chip tone={selected.offer.status === 'ACCEPTED' ? 'success' : 'neutral'}>{selected.offer.status}</Chip>
                )}
              </div>
            )}

            {(selected.status === 'applied' || selected.status === 'interviewing') && (
              <Button full variant="danger" disabled={busy} onClick={() => act(() => ApplicationService.retractApplication(selected.id), 'Application withdrawn')}>
                Withdraw application
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </MobileShell>
  );
};

export default MobileApplications;
