import type { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, icon: Icon }: { label: string; value?: number | string; icon: LucideIcon }) {
  return (
    <div className="panel p-4">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-zinc-500">{label}</span>
        <Icon className="h-4 w-4 text-cyan-700" />
      </div>
      <div className="tabular text-4xl font-semibold text-zinc-950">{value ?? '-'}</div>
    </div>
  );
}
