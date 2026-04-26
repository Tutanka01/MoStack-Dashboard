import { Cable, Network } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, apiItems, statusCell } from './pageUtils';

export default function NetworkPage({ refreshKey }: { refreshKey: number }) {
  const networks = useApi<AnyRecord>('/network/networks', refreshKey);
  const subnets = useApi<AnyRecord>('/network/subnets', refreshKey);
  const ports = useApi<AnyRecord>('/network/ports', refreshKey);
  const agents = useApi<AnyRecord>('/network/agents', refreshKey);
  if (networks.loading && subnets.loading && ports.loading && agents.loading) return <LoadingBlock />;

  return (
    <>
      <PageTitle eyebrow="Neutron" title="Network Plane" description="Provider network visibility, Neutron agents and a simple mental model of how a port reaches the physical network." />
      {[networks, subnets, ports, agents].map((state, index) => <ErrorNotice key={index} message={state.error || state.data?.error as string} />)}

      <div className="mb-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Panel title="Provider Network" eyebrow="Flat external segment">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between border-b border-zinc-200 py-2"><span>Subnet</span><strong>10.3.16.0/23</strong></div>
            <div className="flex justify-between border-b border-zinc-200 py-2"><span>Provider interface</span><strong>ens19</strong></div>
            <div className="flex justify-between border-b border-zinc-200 py-2"><span>OVS mapping</span><strong>provider:br-provider</strong></div>
            <div className="flex justify-between py-2"><span>Integration bridge</span><strong>br-int</strong></div>
          </div>
        </Panel>
        <Panel title="Logical Path" eyebrow="Provider network to VM">
          <div className="grid gap-3 md:grid-cols-4">
            {['Provider network', 'br-provider', 'br-int / OVS port', 'VM tap interface'].map((item, index) => (
              <div key={item} className="border border-zinc-200 bg-white p-4">
                <div className="mb-5 flex h-8 w-8 items-center justify-center bg-cyan-700 text-white">{index + 1}</div>
                <div className="font-semibold">{item}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6">
        <Panel title="Networks" eyebrow="Neutron networks" action={<Network className="h-5 w-5 text-cyan-700" />}>
          <DataTable rows={apiItems<AnyRecord>(networks.data)} columns={[
            { header: 'Name', cell: (row) => row.name || '-' },
            { header: 'Status', cell: (row) => statusCell(row.status) },
            { header: 'Provider type', cell: (row) => row['provider:network_type'] || '-' },
            { header: 'Physical network', cell: (row) => row['provider:physical_network'] || '-' },
            { header: 'Shared', cell: (row) => String(row.shared) },
            { header: 'Admin', cell: (row) => statusCell(row.admin_state_up) }
          ]} />
        </Panel>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Subnets" eyebrow="IP allocation domains">
            <DataTable rows={apiItems<AnyRecord>(subnets.data)} columns={[
              { header: 'Name', cell: (row) => row.name || '-' },
              { header: 'CIDR', cell: (row) => row.cidr || '-' },
              { header: 'Gateway', cell: (row) => row.gateway_ip || '-' },
              { header: 'DHCP', cell: (row) => statusCell(row.enable_dhcp) }
            ]} />
          </Panel>
          <Panel title="Agents" eyebrow="Neutron workers">
            <DataTable rows={apiItems<AnyRecord>(agents.data)} columns={[
              { header: 'Type', cell: (row) => row.agent_type || '-' },
              { header: 'Host', cell: (row) => row.host || '-' },
              { header: 'Alive', cell: (row) => statusCell(row.alive) },
              { header: 'Admin', cell: (row) => statusCell(row.admin_state_up) }
            ]} />
          </Panel>
        </div>
        <Panel title="Ports" eyebrow="VM and service attachment points" action={<Cable className="h-5 w-5 text-cyan-700" />}>
          <DataTable rows={apiItems<AnyRecord>(ports.data)} columns={[
            { header: 'Name', cell: (row) => row.name || row.id },
            { header: 'Status', cell: (row) => statusCell(row.status) },
            { header: 'Device owner', cell: (row) => row.device_owner || '-' },
            { header: 'MAC', cell: (row) => row.mac_address || '-' },
            { header: 'Fixed IPs', cell: (row) => (row.fixed_ips || []).map((ip: AnyRecord) => ip.ip_address).join(', ') || '-' }
          ]} />
        </Panel>
      </div>
    </>
  );
}
