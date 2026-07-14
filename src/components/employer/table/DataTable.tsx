import React from 'react';
import TableHeader from './TableHeader';
import type { TableColumn } from './TableHeader';
import TablePagination from './TablePagination';

interface DataTableProps {
  columns: TableColumn[];
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalEntries?: number;
    pageSize?: number;
  };
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  children,
  title,
  subtitle,
  headerActions,
  pagination,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-3xl border border-primary/5 shadow-sm overflow-hidden text-left ${className}`}>
      {/* Table Header Section */}
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-5 border-b border-primary/5 flex justify-between items-center bg-surface-container-low/20">
          <div>
            {title && <h3 className="text-lg font-bold text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-4">{headerActions}</div>}
        </div>
      )}
      {/* Table Body Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <TableHeader columns={columns} />
          <tbody className="divide-y divide-primary/5">
            {children}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      {pagination && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          totalEntries={pagination.totalEntries}
          pageSize={pagination.pageSize}
        />
      )}
    </div>
  );
};
export default DataTable;
