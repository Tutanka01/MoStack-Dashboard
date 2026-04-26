import { Database, HardDrive } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, apiItems, statusCell } from './pageUtils';

export default function StoragePage({ refreshKey }: { refreshKey: number }) {
  const volumes = useApi<AnyRecord>('/storage/volumes', refreshKey);
  const types = useApi<AnyRecord>('/storage/types', refreshKey);
  const services = useApi<AnyRecord>('/storage/services', refreshKey);
  const pools = useApi<AnyRecord>('/storage/pools', refreshKey);
  if (volumes.loading && types.loading && services.loading && pools.loading) return <LoadingBlock />;

  return (
    <>
      <PageTitle eyebrow="Cinder" title="Persistent Block Storage" description="Read-only view of volumes, LVM backend capacity and the Cinder service workers behind persistent block storage." />
      {[volumes, types, services, pools].map((state, index) => <ErrorNotice key={index} message={state.error || state.data?.error as string} />)}

      <div className="mb-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="LVM Backend" eyebrow="os-comput02 storage role">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between border-b border-zinc-200 py-2"><span>Backend</span><strong>LVM + iSCSI via tgt</strong></div>
            <div className="flex justify-between border-b border-zinc-200 py-2"><span>Host</span><strong>os-comput02@lvm#lvm</strong></div>
            <div className="flex justify-between border-b border-zinc-200 py-2"><span>Volume group</span><strong>cinder-volumes</strong></div>
            <div className="flex justify-between py-2"><span>Volume type</span><strong>lvm</strong></div>
          </div>
        </Panel>
        <Panel title="Storage Model" eyebrow="Learning note" action={<HardDrive className="h-5 w-5 text-cyan-700" />}>
          <p className="max-w-3xl text-lg leading-8 text-zinc-700">
            Cinder fournit du block storage persistant. Ici, le backend est LVM+iSCSI via tgt sur os-comput02.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6">
        <Panel title="Volumes" eyebrow="Cinder volumes">
          <DataTable rows={apiItems<AnyRecord>(volumes.data)} columns={[
            { header: 'Name', cell: (row) => row.name || row.id },
            { header: 'Status', cell: (row) => statusCell(row.status) },
            { header: 'Size GB', cell: (row) => row.size ?? '-' },
            { header: 'Type', cell: (row) => row.volume_type || '-' },
            { header: 'Bootable', cell: (row) => statusCell(row.bootable === 'true' ? 'enabled' : 'disabled') },
            { header: 'Attached to', cell: (row) => (row.attachments || []).map((a: AnyRecord) => a.server_id).join(', ') || '-' },
            { header: 'Host', cell: (row) => row['os-vol-host-attr:host'] || '-' }
          ]} />
        </Panel>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Backend Pools" eyebrow="Capacity">
            <DataTable rows={apiItems<AnyRecord>(pools.data)} columns={[
              { header: 'Name', cell: (row) => row.name || '-' },
              { header: 'Backend', cell: (row) => row.capabilities?.volume_backend_name || '-' },
              { header: 'Total GB', cell: (row) => row.capabilities?.total_capacity_gb ?? '-' },
              { header: 'Free GB', cell: (row) => row.capabilities?.free_capacity_gb ?? '-' },
              { header: 'Provisioned', cell: (row) => row.capabilities?.provisioned_capacity_gb ?? '-' },
              { header: 'Thin', cell: (row) => statusCell(row.capabilities?.thin_provisioning_support) }
            ]} />
          </Panel>
          <Panel title="Cinder Services" eyebrow="Workers">
            <DataTable rows={apiItems<AnyRecord>(services.data)} columns={[
              { header: 'Binary', cell: (row) => row.binary || '-' },
              { header: 'Host', cell: (row) => row.host || '-' },
              { header: 'Zone', cell: (row) => row.zone || '-' },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'State', cell: (row) => statusCell(row.state) }
            ]} />
          </Panel>
        </div>
        <Panel title="Volume Types" eyebrow="Policy names" action={<Database className="h-5 w-5 text-cyan-700" />}>
          <DataTable rows={apiItems<AnyRecord>(types.data)} columns={[
            { header: 'Name', cell: (row) => row.name || '-' },
            { header: 'Description', cell: (row) => row.description || '-' },
            { header: 'Public', cell: (row) => statusCell(row.is_public) },
            { header: 'Extra specs', cell: (row) => <code className="text-xs">{JSON.stringify(row.extra_specs || {})}</code> }
          ]} />
        </Panel>
      </div>
    </>
  );
}
