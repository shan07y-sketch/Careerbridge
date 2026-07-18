import React, { useCallback, useEffect, useState } from 'react';
import { FilterBar, LogsViewer, AdminPagination } from '../../../components/admin';
import type { AuditLogRow } from '../../../components/admin';
import { AdminService } from '../../../services';
import type { AdminInsightReport, SystemHealthResult } from '../../../types';

/**
 * Full audit log explorer backed by GET /admin/audit-logs. Every entry is a
 * real AuditLog row written by an admin (or auth) action elsewhere in the
 * system -- filterable by action keyword, paginated server-side.
 */
export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 25;

  const [healthReport, setHealthReport] = useState<AdminInsightReport<SystemHealthResult> | null>(null);
  const [isGeneratingHealth, setIsGeneratingHealth] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    AdminService.getAuditLogs(page, pageSize, { action: actionFilter || undefined })
      .then((res) => { setLogs(res.logs); setTotal(res.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit logs.'))
      .finally(() => setIsLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [actionFilter]);
  useEffect(() => { AdminService.getLatestSystemHealthReport().then(setHealthReport).catch(() => {}); }, []);

  const handleGenerateHealth = async () => {
    setIsGeneratingHealth(true);
    try {
      const report = await AdminService.generateSystemHealthSummary();
      setHealthReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate system health summary.');
    } finally {
      setIsGeneratingHealth(false);
    }
  };

  const statusTone =
    healthReport?.payload.healthStatus === 'Healthy' ? 'text-primary' : healthReport?.payload.healthStatus === 'Degraded' ? 'text-amber-600' : 'text-error';

  return (
    <div className="space-y-4">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-on-surface">AI system health summary</h3>
          <button
            type="button"
            onClick={handleGenerateHealth}
            disabled={isGeneratingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold disabled:opacity-50"
          >
            {isGeneratingHealth ? (
              <span className="w-3 h-3 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            )}
            {healthReport ? 'Refresh' : 'Analyze'}
          </button>
        </div>

        {!healthReport ? (
          <p className="text-xs text-on-surface-variant italic">
            Analyze recent audit log volume, error rates, and recurring patterns to summarize backend health.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            <p className={`text-sm font-bold ${statusTone}`}>{healthReport.payload.healthStatus}</p>
            <p className="text-on-surface-variant font-medium">{healthReport.payload.summary}</p>
            {healthReport.payload.issues.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-error mb-1">Issues</p>
                <ul className="space-y-1">
                  {healthReport.payload.issues.map((issue, idx) => (
                    <li key={idx} className="text-on-surface-variant font-medium">- {issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {healthReport.payload.recurringPatterns.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface mb-1">Recurring patterns</p>
                <ul className="space-y-1">
                  {healthReport.payload.recurringPatterns.map((pattern, idx) => (
                    <li key={idx} className="text-on-surface-variant font-medium">- {pattern}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[10px] text-on-surface-variant/70">Generated {new Date(healthReport.createdAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      <FilterBar
        searchValue={actionFilter}
        onSearchChange={setActionFilter}
        searchPlaceholder="Filter by action (e.g. ADMIN_SUSPEND_USER)…"
        onClearAll={actionFilter ? () => setActionFilter('') : undefined}
      />

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-2">
        <LogsViewer logs={logs} isLoading={isLoading} error={error} />
        {!isLoading && !error && logs.length > 0 && (
          <AdminPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogsView;
