import React from 'react';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface TableHeaderProps {
  columns: TableColumn[];
}

export const TableHeader: React.FC<TableHeaderProps> = ({ columns }) => {
  return (
    <thead>
      <tr className="bg-surface-container-low/30 border-b border-outline-variant/10 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
        {columns.map((col, idx) => {
          const alignmentClass =
            col.align === 'center'
              ? 'text-center'
              : col.align === 'right'
              ? 'text-right'
              : 'text-left';

          const paddingClass =
            idx === 0
              ? 'pl-6 pr-4'
              : idx === columns.length - 1
              ? 'pl-4 pr-6'
              : 'px-4';

          return (
            <th
              key={col.key}
              className={`${paddingClass} py-4 ${alignmentClass} ${col.className || ''}`}
            >
              {col.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};
export default TableHeader;
