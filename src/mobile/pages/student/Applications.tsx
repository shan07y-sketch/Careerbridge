/**
 * Mobile Applications — premium status-tracked pipeline.
 * Aurora hero with live counts, sticky segmented tabs, rise-in cards with a
 * stage stepper, and a rich detail sheet (timeline, interviews, offers, withdraw).
 * All data + actions come from ApplicationService (real API); presentation only.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Application } from '../../../types';
import { ApplicationService } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Chip, Segmented, SkeletonList, EmptyState, ErrorState, PullToRefresh, Sheet, Button, Avatar } from '../../components';

type Tab = 'active' | 'offers' | 'closed';

const STATUS_TONE: Record<Application['status'], 'neutral' | 'info' | 'success' | 'error'> = {
  applied: 'neutral',
  interviewing: 'info',
  offer: 'success',
  rejected: 'error',
};

const STATUS_LABEL: Record<Application['status'], string> = {
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Closed',
};

/** Ordered pipeline stages for the per-card stepper. */
const STAGES = ['applied', 'interviewing', 'offer'] as const;
const stageIndex = (s: Application['status']) => (s === 'rejected' ? -1 : STAGES.indexOf(s as (typeof STAGES)[number]));

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

  const counts = useMemo(() => ({
    active: applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offers: applications.filter(a => a.status === 'offer').length,
  }), [applications]);

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

  if (loading) {
    return <MobileShell title="Applications"><SkeletonList count={5} /></MobileShell>;
  }
  if (error) {
    return <MobileShell title="Applications"><ErrorState message={error} onRetry={() => { setLoading(true); load(); }} /></MobileShell>;
  }

  return (
    <MobileShell bare>
      {/* ---- Aurora hero + live pipeline counts ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <p className="text-[13px] text-white/70 leading-none">Your pipeline</p>
        <h1 className="text-2xl font-extrabold leading-tight">Applications</h1>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: counts.active, l: 'Active' },
            { v: counts.interviewing, l: 'Interviewing' },
            { v: counts.offers, l: 'Offers' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl m-glass py-2.5 text-center">
              <p className="text-xl font-extrabold leading-none">{s.v}</p>
              <p className="text-[11px] text-white/70 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Sticky tabs ---- */}
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-on-surface/5 px-4 py-2.5">
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

      {visible.length === 0 ? (
        <EmptyState
          icon="assignment"
          title={tab === 'offers' ? 'No offers yet' : tab === 'closed' ? 'No closed applications' : 'No active applications'}
          hint="Applications you submit will show up here with their live status."
        />
      ) : (
        <PullToRefresh onRefresh={load}>
          <div className="px-4 pt-3 space-y-3">
            {visible.map((app, i) => {
              const idx = stageIndex(app.status);
              return (
                <button
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={`m-card-lift w-full text-left rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 shadow-sm m-rise m-rise-${Math.min(i + 1, 5)}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={app.companyLogo} name={app.companyName} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold truncate">{app.jobTitle}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {app.companyName} · {new Date(app.dateApplied).toLocaleDateString()}
                      </p>
                    </div>
                    <Chip tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Chip>
                  </div>

                  {/* Stage stepper (applied → interviewing → offer) */}
                  {app.status !== 'rejected' && (
                    <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
                      {STAGES.map((_, s) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${s <= idx ? 'bg-gradient-to-r from-primary to-[#3bb98b]' : 'bg-on-surface/8'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Real signals: required action / expected response */}
                  {app.requiredAction ? (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-warning">
                      <span className="material-symbols-outlined text-[15px]">bolt</span>
                      <span className="truncate">{app.requiredAction}</span>
                    </div>
                  ) : app.expectedResponseDate ? (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      <span className="truncate">Response expected by {new Date(app.expectedResponseDate).toLocaleDateString()}</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
            <div className="h-4" />
          </div>
        </PullToRefresh>
      )}

      {/* ---- Detail sheet ---- */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.jobTitle}>
        {selected && (
          <div className="pb-4 space-y-4">
            <div className="flex items-center gap-3 px-1">
              <Avatar src={selected.companyLogo} name={selected.companyName} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{selected.companyName}</p>
                <p className="text-xs text-on-surface-variant">Applied {new Date(selected.dateApplied).toLocaleDateString()}</p>
              </div>
              <Chip tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Chip>
            </div>

            {/* Real application timeline */}
            {selected.timeline && selected.timeline.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface px-1">Timeline</p>
                <div className="m-card p-4 space-y-3">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 ${t.active ? 'bg-primary' : 'bg-on-surface/20'}`} />
                        {i < selected.timeline!.length - 1 && <span className="w-px flex-1 bg-on-surface/10 my-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm font-semibold text-on-surface">{t.stage}</p>
                        {t.description && <p className="text-xs text-on-surface-variant">{t.description}</p>}
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.interviews && selected.interviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface px-1">Interviews</p>
                {selected.interviews.map(iv => (
                  <div key={iv.id} className="m-card p-3 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-on-primary-container">event</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{iv.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(iv.scheduledAt).toLocaleString()} · {iv.duration} min
                      </p>
                    </div>
                    {iv.locationUrl && (
                      <a href={iv.locationUrl} target="_blank" rel="noreferrer" className="m-press text-xs font-bold text-primary shrink-0">Join</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selected.offer && (
              <div className="m-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success">celebration</span>
                  <p className="text-sm font-bold">Offer: {selected.offer.title}</p>
                </div>
                <p className="text-sm text-on-surface-variant">
                  {selected.offer.currency} {selected.offer.salary.toLocaleString()} · starts {new Date(selected.offer.startDate).toLocaleDateString()}
                </p>
                {selected.offer.status === 'EXTENDED' ? (
                  <div className="flex gap-2">
                    <Button full disabled={busy} onClick={() => act(() => ApplicationService.acceptOffer(selected.id), 'Offer accepted 🎉')}>Accept</Button>
                    <Button full variant="outline" disabled={busy} onClick={() => act(() => ApplicationService.declineOffer(selected.id), 'Offer declined')}>Decline</Button>
                  </div>
                ) : (
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
