import React, { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: string;
  onSort?: (key: string) => void;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  empty = 'No data available',
  onSort,
}: TableProps<T>) {
  return (
    <table className="w-full text-sm text-left border-collapse">
      <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`px-4 py-3 font-medium border-b border-[var(--color-separator)] ${col.sortable ? 'cursor-pointer hover:bg-black/5' : ''}`}
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={() => col.sortable && onSort?.(col.key)}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={`skeleton-${i}`} className="border-b border-[var(--color-separator)]">
              {columns.map((col, j) => (
                <td key={`skeleton-${i}-${j}`} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded skeleton w-3/4 animate-pulse" />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
              {empty}
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr
              key={row.id || i}
              className="border-b border-[var(--color-separator)] hover:bg-black/5 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
      {children}
    </div>
  );
}

export default Table;
