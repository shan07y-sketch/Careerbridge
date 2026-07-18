import React, { useState } from 'react';
import { Badge } from './Badge';

export interface AuditLogRow {
  id: string;
  action: string;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
  user: { email: string; role: string } | null;
}

interface LogsViewerProps {
  logs: AuditLogRow[];
  isLoading?: boolean;
  error?: string | null;
}

function actionTone(action: string): 'error' | 'warning' | 'success' | 'neutral' {
  if (action.includes('SUSPEND') || action.includes('DELETE') || action.includes('ERROR')) return 'error';
  if (action.includes('VERIFY') || action.includes('ACTIVATE') || action.includes('CREATE')) return 'success';
  if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('RESET')) return 'warning';
  return 'neutral';
}

function safeParse(details: string | null): Record<string, unknown> | null {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

/**
 * Audit log explorer: every row is a real `AuditLog` record. Details are
 * stored as a JSON string and rendered as an expandable, pretty-printed
 * block rather than a flat string dump, so admins can actually read what
 * changed (before/after values, request id, target entity id).
 */
export const LogsViewer: React.FC<LogsViewerProps> = ({ logs, isLoading = false, error = null }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-error text-center py-8">{error}</p>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40" aria-hidden="true">history_edu</span>
        <p className="text-sm font-semibold text-on-surface mt-3">No audit log entries</p>
        <p className="text-xs text-on-surface-variant mt-1">Administrative actions will be recorded here as they occur.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-outline-variant/10">
      {logs.map((log) => {
        const parsed = safeParse(log.details);
        const isExpanded = expandedId === log.id;
        return (
          <li key={log.id}>
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-surface-container-low/50 transition-colors rounded-lg"
              aria-expanded={isExpanded}
            >
              <Badge label={log.action.replace(/_/g, ' ')} tone={actionTone(log.action)} size="sm" />
              <span className="text-xs text-on-surface-variant truncate flex-1">
                {log.user?.email ?? 'System'} {log.ipAddress && <span className="opacity-60">&middot; {log.ipAddress}</span>}
              </span>
              <time className="text-xs text-on-surface-variant/70 shrink-0" dateTime={log.createdAt}>
                {new Date(log.createdAt).toLocaleString()}
              </time>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0" aria-hidden="true">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {isExpanded && (
              <pre className="mx-2 mb-3 p-3 rounded-lg bg-surface-container-high text-[11px] text-on-surface-variant overflow-x-auto">
                {parsed ? JSON.stringify(parsed, null, 2) : (log.details || 'No additional details recorded.')}
              </pre>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default LogsViewer;
