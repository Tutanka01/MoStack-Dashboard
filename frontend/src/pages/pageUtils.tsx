import { StatusBadge } from '../components/StatusBadge';

export type AnyRecord = Record<string, any>;

export function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8 grid gap-4 border-b border-zinc-300 pb-6 md:grid-cols-[220px_1fr]">
      <p className="text-xs font-semibold uppercase text-cyan-700">{eyebrow}</p>
      <div>
        <h1 className="max-w-4xl text-5xl font-semibold leading-none tracking-normal text-zinc-950 md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600">{description}</p>
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
