type Props = {
  used?: number;
  total?: number;
  unit?: string;
  tone?: 'flag' | 'klein' | 'leaf' | 'amber' | 'ink';
};

const toneClass: Record<string, string> = {
  flag: 'is-flag',
  klein: 'is-klein',
  leaf: 'is-leaf',
  amber: 'is-amber',
  ink: ''
};

export function CapacityBar({ used = 0, total = 0, unit = '', tone = 'ink' }: Props) {
  const safeTotal = total > 0 ? total : 1;
  const pct = Math.min(100, Math.max(0, (used / safeTotal) * 100));
  const cls = toneClass[tone] || '';
  return (
    <div className="grid gap-1.5 min-w-[120px]">
      <div className="flex items-baseline justify-between font-mono text-[10px] tabular text-[#11100D]">
        <span>
          <span className="text-[#11100D] font-medium">{used}</span>
          <span className="text-[#6F6A5F]"> / {total}{unit ? ` ${unit}` : ''}</span>
        </span>
        <span className="text-[#6F6A5F]">{pct.toFixed(0)}%</span>
      </div>
      <div className={`mini-bar ${cls}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
