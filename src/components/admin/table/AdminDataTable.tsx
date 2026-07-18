import React from 'react';
import { AdminPagination } from './AdminPagination';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface AdminDataTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void };
  title?: string;
  headerActions?: React.ReactNode;
}

/**
 * Generic, dense, sortable admin table. Deliberately data-shape-agnostic
 * (columns own their own `render`) so the same component serves Users,
 * Companies, Universities, Jobs, and Audit Logs without per-entity forks.
 */
export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error = null,
  emptyTitle = 'No results',
  emptyDescription = 'Nothing matches the current filters.',
  onRowClick,
  sortKey,
  sortDirection,
  onSortChange,
  pagination,
  title,
  headerActions,
}: AdminDataTableProps<T>) {
  const alignClass = (align?: 'left' | 'right' | 'center') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden">
      {(title || headerActions) && (
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-outline-variant/15">
          {title && <h3 className="text-sm font-bold text-on-surface">{title}</h3>}
          {headerActions}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/15 bg-surface-container-low/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-5 py-3 font-bold text-[11px] uppercase tracking-wide text-on-surface-variant ${alignClass(col.align)}`}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(col.key)}
                      className="inline-flex items-center gap-1 hover:text-on-surface transition-colors"
                    >
                      {col.header}
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        {sortKey === col.key ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-outline-variant/10">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-surface-container-high animate-pulse" style={{ width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && error && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-error">
                  {error}
                </td>
              </tr>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-on-surface">{emptyTitle}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{emptyDescription}</p>
                </td>
              </tr>
            )}

            {!isLoading && !error && rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-outline-variant/10 last:border-0 ${
                  onRowClick ? 'cursor-pointer hover:bg-surface-container-low/60 transition-colors' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-3.5 text-on-surface ${alignClass(col.align)}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && !isLoading && !error && (
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

export default AdminDataTable;
