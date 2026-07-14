import React from 'react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalEntries?: number;
  pageSize?: number;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalEntries,
  pageSize,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 bg-surface-container-low/20 border-t border-primary/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-on-surface-variant ${className}`}>
      <div>
        {totalEntries !== undefined && pageSize !== undefined && (
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalEntries)} to{' '}
            {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ${
              currentPage === page
                ? 'bg-primary text-white'
                : 'border border-outline-variant/30 hover:bg-surface-container-low'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};
export default TablePagination;
