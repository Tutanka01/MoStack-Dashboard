const styles: Record<string, string> = {
  UP: 'border-emerald-500/40 bg-emerald-50 text-emerald-800',
  ENABLED: 'border-emerald-500/40 bg-emerald-50 text-emerald-800',
  ACTIVE: 'border-emerald-500/40 bg-emerald-50 text-emerald-800',
  AVAILABLE: 'border-emerald-500/40 bg-emerald-50 text-emerald-800',
  'IN-USE': 'border-cyan-500/40 bg-cyan-50 text-cyan-800',
  DOWN: 'border-red-500/40 bg-red-50 text-red-800',
  DISABLED: 'border-zinc-400 bg-zinc-100 text-zinc-700',
  ERROR: 'border-red-500/40 bg-red-50 text-red-800'
};

export function StatusBadge({ value }: { value?: string | boolean | null }) {
  const label = typeof value === 'boolean' ? (value ? 'UP' : 'DOWN') : (value || 'UNKNOWN').toString().toUpperCase();
  const className = styles[label] || 'border-zinc-300 bg-white text-zinc-700';
  return (
    <span className={`inline-flex items-center border px-2 py-1 text-[11px] font-semibold uppercase tracking-normal ${className}`}>
      {label}
    </span>
  );
}
