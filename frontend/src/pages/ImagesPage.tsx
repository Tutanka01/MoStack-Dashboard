import { Image as ImageIcon } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, formatBytes, formatDate, statusCell } from './pageUtils';

const FAMILY_TONES: Record<string, string> = {
  CirrOS: 'is-flag',
  'Ubuntu cloud image': 'is-klein',
  'Debian cloud image': 'is-leaf',
  'Other image': ''
};

function family(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('cirros')) return 'CirrOS';
  if (lower.includes('ubuntu')) return 'Ubuntu cloud image';
  if (lower.includes('debian')) return 'Debian cloud image';
  return 'Other image';
}

export default function ImagesPage({ refreshKey }: { refreshKey: number }) {
  const images = useApi<AnyRecord>('/images', refreshKey);
  if (images.loading && !images.data) return <LoadingBlock />;
  const rows = apiItems<AnyRecord>(images.data);

  const families = rows.reduce<Record<string, number>>((acc, r) => {
    const key = family(r.name);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageTitle
        num="05"
        eyebrow="Glance"
        title="Image catalogue — the genome of every VM."
        description="A focused catalogue of disk images stored in Glance, classified by lineage and consumed later by Nova during instance creation as the initial root disk."
        meta={[
          { label: 'Images', value: String(rows.length) },
          { label: 'Families', value: String(Object.keys(families).length) }
        ]}
      />
      <ErrorNotice message={images.error || (images.data?.error as string)} />

      {/* FAMILY DISTRIBUTION */}
      <div className="mb-6 grid gap-px bg-[#11100D]/12 sm:grid-cols-4 fade-up delay-1">
        {Object.entries(families).map(([fam, count]) => (
          <div key={fam} className="bg-[#F7F2E2] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F]">
              Family
            </div>
            <div className="font-display text-2xl font-medium mt-1 tracking-tight">
              {fam}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-display tabular text-3xl font-medium">{count}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F]">
                {count === 1 ? 'image' : 'images'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 fade-up delay-2">
        <Panel
          num="05.A"
          title="Image catalogue"
          eyebrow={`${rows.length} images observed`}
          action={<ImageIcon className="h-5 w-5 text-[#1535C7]" />}
        >
          <DataTable
            rows={rows}
            columns={[
              { header: 'Name', cell: (row) => (
                <span className="font-display text-sm font-medium">{row.name || <Mono>{row.id}</Mono>}</span>
              ) },
              { header: 'Family', cell: (row) => {
                const f = family(row.name);
                const tone = FAMILY_TONES[f] || '';
                return <span className={`meta-pill ${tone}`}>{f}</span>;
              } },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'Disk', cell: (row) => <Mono>{row.disk_format || '—'}</Mono> },
              { header: 'Container', cell: (row) => <Mono>{row.container_format || '—'}</Mono> },
              { header: 'Size', cell: (row) => (
                <span className="font-mono tabular text-sm">{formatBytes(row.size)}</span>
              ), align: 'right' },
              { header: 'Visibility', cell: (row) => statusCell(row.visibility === 'public' ? 'enabled' : 'disabled') },
              { header: 'Created', cell: (row) => (
                <span className="text-xs text-[#6F6A5F]">{formatDate(row.created_at)}</span>
              ) }
            ]}
          />
        </Panel>

        <Panel num="05.B" title="Glance role" eyebrow="Learning note" variant="klein">
          <p className="font-serif italic text-2xl leading-9 max-w-3xl text-[#2A2722]">
            <span className="not-italic font-display font-medium text-[#11100D]">Glance</span> ne lance pas les VMs.
            Il <span className="not-italic font-mono text-base text-[#1535C7]">stocke</span> les images utilisées ensuite par
            <span className="not-italic font-display font-medium text-[#11100D]"> Nova</span> pour construire le disque initial d'une instance.
          </p>
        </Panel>
      </div>
    </>
  );
}
