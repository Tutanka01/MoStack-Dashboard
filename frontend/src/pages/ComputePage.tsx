import { Cpu, GitBranch, ServerCog } from 'lucide-react';
import { useApi } from '../api/useApi';
import { CapacityBar } from '../components/CapacityBar';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, formatAddresses, formatDate, statusCell } from './pageUtils';

export default function ComputePage({ refreshKey }: { refreshKey: number }) {
  const servers = useApi<AnyRecord>('/compute/servers', refreshKey);
  const hypervisors = useApi<AnyRecord>('/compute/hypervisors', refreshKey);
  const services = useApi<AnyRecord>('/compute/services', refreshKey);
  if (servers.loading && hypervisors.loading && services.loading) return <LoadingBlock />;

  const serverRows = apiItems<AnyRecord>(servers.data);
  const hyperRows = apiItems<AnyRecord>(hypervisors.data);
  const serviceRows = apiItems<AnyRecord>(services.data);

  return (
    <>
      <PageTitle
        num="02"
        eyebrow="Nova"
        title="Compute fabric — where instances actually run."
        description="Instances, hypervisors and Nova control services, with a clear split between API entrypoints, scheduling, conducting, and compute execution on libvirt/QEMU."
        meta={[
          { label: 'Instances', value: String(serverRows.length) },
          { label: 'Hypervisors', value: String(hyperRows.length) },
          { label: 'Services', value: String(serviceRows.length) }
        ]}
      />
      <ErrorNotice message={servers.error || (servers.data?.error as string)} />
      <ErrorNotice message={hypervisors.error || (hypervisors.data?.error as string)} />
      <ErrorNotice message={services.error || (services.data?.error as string)} />

      <div className="grid gap-6 fade-up delay-1">
        <Panel num="02.A" title="Instances" eyebrow="Nova servers — live" variant="flag">
          <DataTable
            rows={serverRows}
            columns={[
              { header: 'Name', cell: (row) => (
                <span className="font-display text-base font-medium text-[#11100D]">{row.name || '—'}</span>
              ) },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'Flavor', cell: (row) => <Mono>{row.flavor || '—'}</Mono> },
              { header: 'Image', cell: (row) => row.image || '—' },
              { header: 'IPs', cell: (row) => (
                <span className="font-mono text-xs text-[#2A2722]">{formatAddresses(row.addresses)}</span>
              ) },
              { header: 'Host', cell: (row) => <Mono>{row.host || '—'}</Mono> },
              { header: 'Created', cell: (row) => (
                <span className="text-xs text-[#6F6A5F]">{formatDate(row.created_at)}</span>
              ) }
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Panel num="02.B" title="Hypervisors" eyebrow="Resource providers — capacity">
            <DataTable
              rows={hyperRows}
              columns={[
                { header: 'Hostname', cell: (row) => (
                  <span className="font-display text-sm font-medium">{row.hostname || '—'}</span>
                ) },
                { header: 'State', cell: (row) => statusCell(row.state) },
                { header: 'vCPU', cell: (row) => (
                  <CapacityBar used={row.vcpus_used} total={row.vcpus} unit="" tone="ink" />
                ) },
                { header: 'RAM', cell: (row) => (
                  <CapacityBar used={row.memory_mb_used} total={row.memory_mb} unit="MB" tone="klein" />
                ) },
                { header: 'Disk', cell: (row) => (
                  <CapacityBar used={row.local_gb_used} total={row.local_gb} unit="GB" tone="amber" />
                ) }
              ]}
            />
          </Panel>

          <Panel num="02.C" title="Nova services" eyebrow="Control daemons">
            <DataTable
              rows={serviceRows}
              columns={[
                { header: 'Binary', cell: (row) => <Mono>{row.binary || '—'}</Mono> },
                { header: 'Host', cell: (row) => <Mono>{row.host || '—'}</Mono> },
                { header: 'Zone', cell: (row) => row.zone || '—' },
                { header: 'Status', cell: (row) => statusCell(row.status) },
                { header: 'State', cell: (row) => statusCell(row.state) }
              ]}
            />
          </Panel>
        </div>

        <Panel num="02.D" title="Nova control flow" eyebrow="Pedagogical model" variant="klein">
          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-4">
            {[
              { name: 'nova-api',       detail: 'Receives REST calls and validates Keystone tokens before anything else.', Icon: ServerCog, code: 'A' },
              { name: 'nova-scheduler', detail: 'Picks the right compute host using Placement inventory and filters.',       Icon: GitBranch, code: 'B' },
              { name: 'nova-conductor', detail: 'Mediates database operations away from compute nodes for security.',         Icon: Cpu,       code: 'C' },
              { name: 'nova-compute',   detail: 'Runs the instance through libvirt/QEMU on the chosen hypervisor.',           Icon: ServerCog, code: 'D' }
            ].map(({ name, detail, Icon, code }, idx) => (
              <div key={name} className="bg-[#F7F2E2] p-5 relative">
                <span className="absolute right-4 top-3 font-mono text-[10px] text-[#6F6A5F] tabular">
                  {code}.{String(idx + 1).padStart(2, '0')}
                </span>
                <Icon className="mb-6 h-5 w-5 text-[#1535C7]" />
                <h3 className="font-display text-lg font-medium text-[#11100D] tracking-tight">{name}</h3>
                <div className="mt-1 mb-3 h-px w-8 bg-[#1535C7]" />
                <p className="text-sm leading-6 text-[#2A2722]">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
