import { EmptyState } from './EmptyState';

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
};

type Props<T> = {
  rows?: T[];
  columns: Column<T>[];
  empty?: string;
  index?: boolean;
};

export function DataTable<T>({ rows, columns, empty = 'No records observed.', index = true }: Props<T>) {
  if (!rows || rows.length === 0) return <EmptyState title={empty} />;

  return (
    <div className="overflow-x-auto -mx-5 -mb-5">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-y border-[#11100D]/15 bg-[#E5DEC9]/40">
            {index && (
              <th className="px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#6F6A5F] w-[44px] text-right tabular">
                Nº
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.header}
                className={`px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#6F6A5F] ${
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                } ${column.className || ''}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#11100D]/8 last:border-0 transition-colors duration-150 hover:bg-[#EFE9D9]/60"
            >
              {index && (
                <td className="px-3 py-3 align-top font-mono text-[11px] tabular text-[#6F6A5F] text-right">
                  {String(i + 1).padStart(2, '0')}
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-3 py-3 align-top text-sm tabular text-[#11100D] ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                  } ${column.className || ''}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
