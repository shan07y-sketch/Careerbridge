import React, { useCallback, useEffect, useState } from 'react';
import { AdminService, type AdminSystemMonitoring, type AdminSession } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Section } from '../../../components/ui/Section';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/Skeleton';

const fmtUptime = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

export const AdminSystemHealthView: React.FC = () => {
  const { showToast } = useToast();
  const [mon, setMon] = useState<AdminSystemMonitoring | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [m, s] = await Promise.all([AdminService.getMonitoring(), AdminService.getActiveSessions(1, 20)]);
      setMon(m); setSessions(s.sessions);
    } catch (e: any) { setError(e?.message || 'Failed to load system health.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const revoke = async (id: string) => { setActingId(id); try { await AdminService.revokeSession(id); showToast('Session revoked.', 'success'); setSessions(prev => prev.filter(s => s.id !== id)); } catch (e: any) { showToast(e?.message || 'Failed to revoke.', 'error'); } finally { setActingId(null); } };

  const header = <PageHeader title="System health" description="Live database, runtime and AI service health, plus active sessions." />;
  if (loading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !mon) return <>{header}<EmptyState icon="cloud_off" title="Couldn't load system health" description={error || 'Please try again.'} actionLabel="Retry" onAction={load} /></>;

  const dbOk = mon.databaseStatus?.toLowerCase() === 'connected' || mon.databaseStatus?.toLowerCase() === 'ok' || mon.databaseStatus?.toLowerCase() === 'healthy';

  return (
    <>
      {header}
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Database" value={mon.databaseStatus} icon="database" hint={`${mon.databaseLatencyMs}ms latency`} />
          <StatCard label="Uptime" value={fmtUptime(mon.processUptimeSeconds)} icon="schedule" hint={`Node ${mon.nodeVersion}`} />
          <StatCard label="Errors (24h)" value={mon.recentErrorLogsLast24h} icon="error" hint="logged" />
          <StatCard label="AI cache hit" value={`${mon.aiCacheHitRatePercent}%`} icon="bolt" hint={`${mon.aiAvgLatencyMs}ms avg`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Section title="Runtime">
            <Card>
              <div className="grid grid-cols-2 gap-4 text-label-md">
                <div><p className="text-on-surface-variant">Platform</p><p className="font-semibold text-on-surface">{mon.platform}</p></div>
                <div><p className="text-on-surface-variant">CPU cores</p><p className="font-semibold text-on-surface">{mon.cpuCount}</p></div>
                <div><p className="text-on-surface-variant">Load avg</p><p className="font-semibold text-on-surface">{mon.loadAverage.map(n => n.toFixed(2)).join(', ')}</p></div>
                <div><p className="text-on-surface-variant">Heap used</p><p className="font-semibold text-on-surface">{mon.memory.heapUsedMb}/{mon.memory.heapTotalMb} MB</p></div>
                <div><p className="text-on-surface-variant">RSS</p><p className="font-semibold text-on-surface">{mon.memory.rssMb} MB</p></div>
                <div><p className="text-on-surface-variant">System free</p><p className="font-semibold text-on-surface">{mon.memory.systemFreeMb}/{mon.memory.systemTotalMb} MB</p></div>
              </div>
            </Card>
          </Section>
          <Section title="Status">
            <Card>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-label-md text-on-surface">Database connection</span>{dbOk ? <Badge tone="success" icon="check">Healthy</Badge> : <Badge tone="error">{mon.databaseStatus}</Badge>}</div>
                <div className="flex items-center justify-between"><span className="text-label-md text-on-surface">AI service</span><Badge tone={mon.aiUsageSampleSize > 0 ? 'success' : 'neutral'}>{mon.aiUsageSampleSize} calls sampled</Badge></div>
                <div className="flex items-center justify-between"><span className="text-label-md text-on-surface">Error rate (24h)</span><Badge tone={mon.recentErrorLogsLast24h > 0 ? 'warning' : 'success'}>{mon.recentErrorLogsLast24h}</Badge></div>
              </div>
            </Card>
          </Section>
        </div>

        <Section title="Active sessions" description={`${sessions.length} shown`}>
          {sessions.length === 0 ? (
            <Card><p className="text-label-md text-on-surface-variant">No active sessions.</p></Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-body-md">
                <thead className="border-b border-outline-variant/60"><tr><th className="px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">User</th><th className="px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Started</th><th className="px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Expires</th><th className="px-5 py-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant text-right">Actions</th></tr></thead>
                <tbody>{sessions.map(s => (
                  <tr key={s.id} className="border-t border-outline-variant/60"><td className="px-5 py-4"><p className="font-semibold text-on-surface">{s.user.email}</p><p className="text-label-sm text-on-surface-variant capitalize">{s.user.role.toLowerCase()}</p></td><td className="px-5 py-4 text-on-surface-variant">{new Date(s.createdAt).toLocaleString()}</td><td className="px-5 py-4 text-on-surface-variant">{new Date(s.expiresAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><Button size="sm" variant="ghost" className="!text-error" disabled={actingId === s.id} onClick={() => revoke(s.id)}>Revoke</Button></td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
};

export default AdminSystemHealthView;
