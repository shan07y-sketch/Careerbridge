import React from 'react';

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Numeric pagination for admin list screens, backed by real
 * `{ page, limit, total }` responses from the paginated admin endpoints
 * (users/companies/universities/audit-logs) -- never a client-side guess
 * at total pages.
 */
export const AdminPagination: React.FC<AdminPaginationProps> = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pageNumbers = (() => {
    const nums: (number | 'ellipsis')[] = [];
    const windowSize = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
        nums.push(p);
      } else if (nums[nums.length - 1] !== 'ellipsis') {
        nums.push('ellipsis');
      }
    }
    return nums;
  })();

  return (
    <div className="px-5 py-3.5 border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
      <span>
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1.5">&hellip;</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors ${
                p === page ? 'bg-primary text-on-primary' : 'border border-outline-variant/30 hover:bg-surface-container-low'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
