import { Cable, Network } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, statusCell } from './pageUtils';

export default function NetworkPage({ refreshKey }: { refreshKey: number }) {
  const networks = useApi<AnyRecord>('/network/networks', refreshKey);
  const subnets  = useApi<AnyRecord>('/network/subnets', refreshKey);
  const ports    = useApi<AnyRecord>('/network/ports', refreshKey);
  const agents   = useApi<AnyRecord>('/network/agents', refreshKey);
  if (networks.loading && subnets.loading && ports.loading && agents.loading) return <LoadingBlock />;

  return (
    <>
      <PageTitle
        num="03"
        eyebrow="Neutron"
        title="Network plane — wires, bridges, and intent."
        description="Provider network visibility, Neutron agents and a simple mental model of how a port reaches the physical network through Open vSwitch."
        meta={[
          { label: 'Networks', value: String(apiItems(networks.data).length) },
          { label: 'Ports',    value: String(apiItems(ports.data).length) },
          { label: 'Agents',   value: String(apiItems(agents.data).length) }
        ]}
      />
      {[networks, subnets, ports, agents].map((state, index) => (
        <ErrorNotice key={index} message={state.error || (state.data?.error as string)} />
      ))}

      {/* PROVIDER NETWORK + LOGICAL PATH */}
      <div className="mb-6 grid gap-6 xl:grid-cols-[400px_1fr] fade-up delay-1">
        <Panel num="03.A" title="Provider network" eyebrow="Flat external segment" variant="flag">
          <dl className="grid gap-0 text-sm">
            {[
              ['Subnet', '10.3.16.0/23'],
              ['Provider interface', 'ens19'],
              ['OVS mapping', 'provider:br-provider'],
              ['Integration bridge', 'br-int']
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-[#11100D]/10 py-2.5 last:border-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{k}</dt>
                <dd><Mono>{v}</Mono></dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel num="03.B" title="Logical path" eyebrow="Provider network → VM tap">
          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-4">
            {['Provider network', 'br-provider', 'br-int / OVS port', 'VM tap interface'].map((item, index) => (
              <div key={item} className="bg-[#F7F2E2] p-4 relative">
                <div className="mb-5 flex h-8 w-8 items-center justify-center bg-[#11100D] text-[#EFE9D9] font-mono text-sm tabular">
                  {index + 1}
                </div>
                <div className="font-display text-sm font-medium leading-tight">{item}</div>
                <div className="mt-2 h-px w-6 bg-[#DD2A1C]" />
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif italic text-[#2A2722]">
            La VM voit son port comme une carte réseau. Neutron + OVS s'occupent du reste, jusqu'au câble physique.
          </p>
        </Panel>
      </div>

      {/* TABLES */}
      <div className="grid gap-6 fade-up delay-2">
        <Panel
          num="03.C"
          title="Networks"
          eyebrow="Neutron networks"
          action={<Network className="h-5 w-5 text-[#1535C7]" />}
        >
          <DataTable
            rows={apiItems<AnyRecord>(networks.data)}
            columns={[
              { header: 'Name', cell: (row) => (
                <span className="font-display text-sm font-medium">{row.name || '—'}</span>
              ) },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'Provider type', cell: (row) => (
                <span className="meta-pill">{row['provider:network_type'] || '—'}</span>
              ) },
              { header: 'Physical net', cell: (row) => <Mono>{row['provider:physical_network'] || '—'}</Mono> },
              { header: 'Shared', cell: (row) => statusCell(row.shared ? 'enabled' : 'disabled') },
              { header: 'Admin', cell: (row) => statusCell(row.admin_state_up) }
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel num="03.D" title="Subnets" eyebrow="IP allocation domains">
            <DataTable
              rows={apiItems<AnyRecord>(subnets.data)}
              columns={[
                { header: 'Name', cell: (row) => row.name || '—' },
                { header: 'CIDR', cell: (row) => <Mono>{row.cidr || '—'}</Mono> },
                { header: 'Gateway', cell: (row) => <Mono>{row.gateway_ip || '—'}</Mono> },
                { header: 'DHCP', cell: (row) => statusCell(row.enable_dhcp ? 'enabled' : 'disabled') }
              ]}
            />
          </Panel>
          <Panel num="03.E" title="Agents" eyebrow="Neutron workers">
            <DataTable
              rows={apiItems<AnyRecord>(agents.data)}
              columns={[
                { header: 'Type', cell: (row) => (
                  <span className="font-display text-sm font-medium">{row.agent_type || '—'}</span>
                ) },
                { header: 'Host', cell: (row) => <Mono>{row.host || '—'}</Mono> },
                { header: 'Alive', cell: (row) => statusCell(row.alive) },
                { header: 'Admin', cell: (row) => statusCell(row.admin_state_up) }
              ]}
            />
          </Panel>
        </div>

        <Panel
          num="03.F"
          title="Ports"
          eyebrow="VM and service attachment points"
          action={<Cable className="h-5 w-5 text-[#1535C7]" />}
        >
          <DataTable
            rows={apiItems<AnyRecord>(ports.data)}
            columns={[
              { header: 'Name', cell: (row) => row.name || <Mono>{row.id}</Mono> },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'Device owner', cell: (row) => <Mono>{row.device_owner || '—'}</Mono> },
              { header: 'MAC', cell: (row) => <Mono>{row.mac_address || '—'}</Mono> },
              { header: 'Fixed IPs', cell: (row) => (
                <span className="font-mono text-xs">
                  {(row.fixed_ips || []).map((ip: AnyRecord) => ip.ip_address).join(', ') || '—'}
                </span>
              ) }
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
