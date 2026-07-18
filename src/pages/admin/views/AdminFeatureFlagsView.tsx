import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminFeatureFlag } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

export const AdminFeatureFlagsView: React.FC = () => {
  const { showToast } = useToast();
  const [flags, setFlags] = useState<AdminFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(() => { setLoading(true); setError(null); AdminService.getFeatureFlags().then(setFlags).catch(e => setError(e?.message || 'Failed to load feature flags.')).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (flag: AdminFeatureFlag) => {
    setSavingKey(flag.key);
    const next = !flag.value;
    setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, value: next } : f));
    try { await AdminService.updateFeatureFlag(flag.key, next); showToast(`"${flag.key}" ${next ? 'enabled' : 'disabled'}.`, 'success'); }
    catch (e: any) { setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, value: flag.value } : f)); showToast(e?.message || 'Failed to update flag.', 'error'); }
    finally { setSavingKey(null); }
  };

  const header = <PageHeader title="Feature flags" description="Toggle platform capabilities on and off. Changes take effect immediately." />;
  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load feature flags" description={error} actionLabel="Retry" onAction={load} /></>;
  if (flags.length === 0) return <>{header}<EmptyState icon="flag" title="No feature flags" description="There are no configurable feature flags right now." /></>;

  return (
    <>
      {header}
      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-outline-variant/60">
          {flags.map(flag => (
            <li key={flag.key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-on-surface">{flag.key}</p>
                {flag.description && <p className="text-label-md text-on-surface-variant mt-0.5">{flag.description}</p>}
                {flag.updatedAt && <p className="text-label-sm text-on-surface-variant/80 mt-1">Updated {new Date(flag.updatedAt).toLocaleDateString()}{flag.updatedBy ? ` by ${flag.updatedBy}` : ''}</p>}
              </div>
              <button type="button" onClick={() => toggle(flag)} disabled={savingKey === flag.key} role="switch" aria-checked={flag.value} aria-label={flag.key}
                className={`w-11 h-6 rounded-full shrink-0 transition-colors relative disabled:opacity-50 ${flag.value ? 'bg-primary' : 'bg-surface-container-high'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform ${flag.value ? 'translate-x-5' : ''}`} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
};

export default AdminFeatureFlagsView;
