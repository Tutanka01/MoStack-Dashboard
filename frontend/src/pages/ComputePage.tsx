import { Cpu, GitBranch, ServerCog } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, apiItems, formatAddresses, formatDate, statusCell } from './pageUtils';

export default function ComputePage({ refreshKey }: { refreshKey: number }) {
  const servers = useApi<AnyRecord>('/compute/servers', refreshKey);
  const hypervisors = useApi<AnyRecord>('/compute/hypervisors', refreshKey);
  const services = useApi<AnyRecord>('/compute/services', refreshKey);
  if (servers.loading && hypervisors.loading && services.loading) return <LoadingBlock />;

  return (
    <>
      <PageTitle eyebrow="Nova" title="Compute Fabric" description="Instances, hypervisors and Nova control services, with a clear split between API entrypoints, scheduling and compute execution." />
      <ErrorNotice message={servers.error || servers.data?.error as string} />
      <ErrorNotice message={hypervisors.error || hypervisors.data?.error as string} />
      <ErrorNotice message={services.error || services.data?.error as string} />

      <div className="grid gap-6">
        <Panel title="Instances" eyebrow="Nova servers">
          <DataTable
            rows={apiItems<AnyRecord>(servers.data)}
            columns={[
              { header: 'Name', cell: (row) => row.name || '-' },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'Flavor', cell: (row) => row.flavor || '-' },
              { header: 'Image', cell: (row) => row.image || '-' },
              { header: 'IPs', cell: (row) => <span className="text-xs text-zinc-600">{formatAddresses(row.addresses)}</span> },
              { header: 'Host', cell: (row) => row.host || '-' },
              { header: 'Created', cell: (row) => formatDate(row.created_at) }
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Hypervisors" eyebrow="Resource providers">
            <DataTable
              rows={apiItems<AnyRecord>(hypervisors.data)}
              columns={[
                { header: 'Hostname', cell: (row) => row.hostname || '-' },
                { header: 'State', cell: (row) => statusCell(row.state) },
                { header: 'vCPU', cell: (row) => `${row.vcpus_used ?? '-'} / ${row.vcpus ?? '-'}` },
                { header: 'RAM MB', cell: (row) => `${row.memory_mb_used ?? '-'} / ${row.memory_mb ?? '-'}` },
                { header: 'Disk GB', cell: (row) => `${row.local_gb_used ?? '-'} / ${row.local_gb ?? '-'}` }
              ]}
            />
          </Panel>
          <Panel title="Nova Services" eyebrow="Control service roles">
            <DataTable
              rows={apiItems<AnyRecord>(services.data)}
              columns={[
                { header: 'Binary', cell: (row) => row.binary || '-' },
                { header: 'Host', cell: (row) => row.host || '-' },
                { header: 'Zone', cell: (row) => row.zone || '-' },
                { header: 'Status', cell: (row) => statusCell(row.status) },
                { header: 'State', cell: (row) => statusCell(row.state) }
              ]}
            />
          </Panel>
        </div>

        <Panel title="Nova Control Flow" eyebrow="Pedagogical model">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { name: 'nova-api', detail: 'Receives REST calls and checks Keystone tokens.', Icon: ServerCog },
              { name: 'nova-scheduler', detail: 'Chooses the compute host using Placement inventory.', Icon: GitBranch },
              { name: 'nova-conductor', detail: 'Mediates database operations away from compute nodes.', Icon: Cpu },
              { name: 'nova-compute', detail: 'Runs the instance through libvirt/QEMU on each hypervisor.', Icon: ServerCog }
            ].map(({ name, detail, Icon }) => (
              <div key={name} className="border border-zinc-200 bg-white p-4">
                <Icon className="mb-5 h-5 w-5 text-cyan-700" />
                <h3 className="mb-2 font-semibold text-zinc-950">{name}</h3>
                <p className="text-sm leading-6 text-zinc-600">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
