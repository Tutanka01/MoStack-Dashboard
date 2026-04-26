import { Image as ImageIcon } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, apiItems, formatBytes, formatDate, statusCell } from './pageUtils';

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

  return (
    <>
      <PageTitle eyebrow="Glance" title="Images" description="A focused catalogue of VM images stored in Glance and consumed later by Nova during instance creation." />
      <ErrorNotice message={images.error || images.data?.error as string} />
      <div className="grid gap-6">
        <Panel title="Image Catalogue" eyebrow={`${rows.length} images observed`} action={<ImageIcon className="h-5 w-5 text-cyan-700" />}>
          <DataTable rows={rows} columns={[
            { header: 'Name', cell: (row) => row.name || row.id },
            { header: 'Family', cell: (row) => family(row.name) },
            { header: 'Status', cell: (row) => statusCell(row.status) },
            { header: 'Disk', cell: (row) => row.disk_format || '-' },
            { header: 'Container', cell: (row) => row.container_format || '-' },
            { header: 'Size', cell: (row) => formatBytes(row.size) },
            { header: 'Visibility', cell: (row) => row.visibility || '-' },
            { header: 'Created', cell: (row) => formatDate(row.created_at) }
          ]} />
        </Panel>
        <Panel title="Glance Role" eyebrow="Learning note">
          <p className="max-w-3xl text-lg leading-8 text-zinc-700">
            Glance ne lance pas les VMs. Il stocke les images utilisees ensuite par Nova pour construire le disque initial d'une instance.
          </p>
        </Panel>
      </div>
    </>
  );
}
