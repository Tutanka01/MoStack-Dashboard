import { EmptyState } from './EmptyState';

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T>({ rows, columns, empty = 'No records observed.' }: { rows?: T[]; columns: Column<T>[]; empty?: string }) {
  if (!rows || rows.length === 0) return <EmptyState title={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-[11px] uppercase text-zinc-500">
            {columns.map((column) => (
              <th key={column.header} className={`px-3 py-3 font-semibold ${column.className || ''}`}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-zinc-200 last:border-0">
              {columns.map((column) => (
                <td key={column.header} className={`px-3 py-3 align-top ${column.className || ''}`}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
