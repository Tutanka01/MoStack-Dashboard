import { StatusBadge } from '../components/StatusBadge';

export type AnyRecord = Record<string, any>;

type PageTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
  num?: string;
  meta?: { label: string; value: string }[];
};

export function PageTitle({ eyebrow, title, description, num = '00', meta = [] }: PageTitleProps) {
  return (
    <div className="mb-12 fade-up">
      <div className="grid gap-4 md:grid-cols-[80px_1fr] md:gap-10">
        <div className="flex md:flex-col md:items-end gap-3 pt-1">
          <span className="font-mono tabular text-[11px] font-medium uppercase tracking-[0.18em] text-[#11100D]">
            §{num}
          </span>
          <span className="hidden md:block h-12 w-px bg-[#11100D]/30" />
          <span className="hidden md:block font-mono text-[9px] uppercase tracking-[0.18em] text-[#6F6A5F] writing-mode-vertical">
            Section
          </span>
        </div>
        <div className="border-t-2 border-[#11100D] pt-5">
          <p className="eyebrow eyebrow-flag">{eyebrow}</p>
          <h1 className="mt-3 font-display max-w-5xl text-[44px] sm:text-6xl md:text-[72px] font-medium leading-[0.92] tracking-[-0.025em] text-[#11100D]">
            {title}
          </h1>
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-3xl font-serif text-lg md:text-xl leading-7 italic text-[#2A2722]">
              {description}
            </p>
            {meta.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 md:flex md:gap-6 shrink-0">
                {meta.map((item) => (
                  <div key={item.label} className="border-l-2 border-[#11100D]/30 pl-3">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6F6A5F]">
                      {item.label}
                    </dt>
                    <dd className="font-mono tabular text-sm text-[#11100D] mt-0.5">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString();
}

export function formatBytes(value?: number) {
  if (!value) return '—';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}

export function formatAddresses(addresses: AnyRecord = {}) {
  const values = Object.entries(addresses).flatMap(([network, ips]) =>
    Array.isArray(ips) ? ips.map((ip) => `${network}: ${ip.addr || ip['OS-EXT-IPS:type'] || '—'}`) : []
  );
  return values.length ? values.join(', ') : '—';
}

export function statusCell(value?: string | boolean | null) {
  return <StatusBadge value={value} />;
}

export function apiItems<T>(payload: AnyRecord | undefined, key = 'items'): T[] {
  return (payload?.[key] as T[]) || [];
}

export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[11px] tabular text-[#2A2722] bg-[#11100D]/4 border border-[#11100D]/8 px-1 py-0.5">
      {children}
    </code>
  );
}
