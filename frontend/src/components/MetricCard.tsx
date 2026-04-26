import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value?: number | string;
  icon?: LucideIcon;
  hint?: string;
  num?: string;
  accent?: 'flag' | 'klein' | 'leaf' | 'mute';
};

const accentClass: Record<string, string> = {
  flag: 'is-flag',
  klein: 'is-klein',
  leaf: '',
  mute: 'is-mute'
};

const accentMark: Record<string, string> = {
  flag: 'bg-[#DD2A1C]',
  klein: 'bg-[#1535C7]',
  leaf: 'bg-[#07683C]',
  mute: 'bg-[#11100D]'
};

export function MetricCard({ label, value, icon: Icon, hint, num, accent }: Props) {
  const variant = accent ? accentClass[accent] : '';
  const mark = accent ? accentMark[accent] : 'bg-[#11100D]';

  return (
    <div className={`group panel-chrome ${variant} relative p-4 transition-transform duration-200 hover:-translate-y-px`}>
      {num && (
        <span className="absolute right-3 top-2 font-mono text-[10px] tabular text-[#6F6A5F] tracking-[0.12em]">
          {num}
        </span>
      )}
      <div className="mb-5 flex items-center justify-between">
        <span className="eyebrow eyebrow-ink">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-[#2A2722] opacity-70" />}
      </div>
      <div className="flex items-end gap-2">
        <div className="font-display tabular text-[56px] leading-[0.85] font-medium text-[#11100D]">
          {value ?? '—'}
        </div>
        <div className={`mb-2 h-2 w-2 ${mark}`} aria-hidden />
      </div>
      {hint && (
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">
          {hint}
        </div>
      )}
    </div>
  );
}
