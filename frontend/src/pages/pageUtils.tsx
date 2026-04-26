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
    <div className="mb-7 fade-up">
      <div className="border-b border-[#11100D]/12 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-chip">{num}</span>
          <p className="eyebrow eyebrow-flag">{eyebrow}</p>
        </div>
        <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <h1 className="font-display max-w-4xl text-3xl sm:text-4xl md:text-[44px] font-semibold leading-tight text-[#11100D]">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm md:text-base leading-6 text-[#4A453B]">
              {description}
            </p>
          </div>
          {meta.length > 0 && (
            <dl className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
              {meta.map((item) => (
                <div key={item.label} className="min-w-[112px] border border-[#11100D]/12 bg-[#F7F2E2] px-3 py-2">
                  <dt className="label-compact">{item.label}</dt>
                  <dd className="font-mono tabular text-sm font-medium text-[#11100D] mt-0.5">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

export function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString();
}

export function formatBytes(value?: number) {
  if (!value) return '-';
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
    Array.isArray(ips) ? ips.map((ip) => `${network}: ${ip.addr || ip['OS-EXT-IPS:type'] || '-'}`) : []
  );
  return values.length ? values.join(', ') : '-';
}

export function statusCell(value?: string | boolean | null) {
  return <StatusBadge value={value} />;
}

export function apiItems<T>(payload: AnyRecord | undefined, key = 'items'): T[] {
  return (payload?.[key] as T[]) || [];
}

export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs tabular text-[#2A2722] bg-[#11100D]/4 border border-[#11100D]/8 px-1.5 py-0.5">
      {children}
    </code>
  );
}
