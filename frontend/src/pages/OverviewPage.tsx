import { Boxes, Database, HardDrive, Image, Network, Server } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { MetricCard } from '../components/MetricCard';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, formatDate, formatTime, statusCell } from './pageUtils';

type Overview = {
  observed_at: string;
  status: string;
  counts: Record<string, number>;
  service_states: AnyRecord[];
  errors: { service: string; error: string }[];
};

const PALETTE = ['#11100D', '#DD2A1C', '#1535C7', '#07683C', '#B36B00', '#2A2722'];

export default function OverviewPage({ refreshKey }: { refreshKey: number }) {
  const { data, loading, error } = useApi<Overview>('/overview', refreshKey);
  if (loading && !data) return <LoadingBlock />;

  const counts = data?.counts || {};
  const chartData = Object.entries(counts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));
  const totalServices = data?.service_states?.length || 0;
  const okServices = (data?.service_states || []).filter(
    (s) => String(s.status).toUpperCase() === 'UP'
  ).length;

  return (
    <>
      <PageTitle
        num="01"
        eyebrow="Overview / Control plane"
        title="The cluster, in one breath."
        description="A concise operational view of API availability, inventory counts and the last observed state of the entire OpenStack lab — refreshed on demand or on a fixed cadence."
        meta={[
          { label: 'Observed', value: formatTime(data?.observed_at) },
          { label: 'Services up', value: `${okServices} / ${totalServices}` },
          { label: 'Status', value: (data?.status || 'UNKNOWN').toUpperCase() }
        ]}
      />
      <ErrorNotice message={error} />
      {data?.errors?.map((item, index) => (
        <ErrorNotice key={index} message={`${item.service}: ${item.error}`} />
      ))}

      {/* HERO METRIC GRID */}
      <div className="mb-10 grid gap-px bg-[#11100D]/12 sm:grid-cols-2 xl:grid-cols-6 fade-up delay-1">
        <MetricCard num="A.01" label="Instances"      value={counts.instances}     icon={Server}   accent="flag"  hint="Nova servers" />
        <MetricCard num="A.02" label="Images"         value={counts.images}        icon={Image}    hint="Glance catalogue" />
        <MetricCard num="A.03" label="Volumes"        value={counts.volumes}       icon={HardDrive} hint="Cinder LVM" />
        <MetricCard num="A.04" label="Networks"       value={counts.networks}      icon={Network}  accent="klein" hint="Neutron" />
        <MetricCard num="A.05" label="Hypervisors"    value={counts.hypervisors}   icon={Boxes}    hint="KVM / libvirt" />
        <MetricCard num="A.06" label="Neutron agents" value={counts.neutron_agents} icon={Database} hint="OVS workers" />
      </div>

      {/* SERVICE HEALTH + INVENTORY */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] fade-up delay-2">
        <Panel
          num="B.01"
          title="Service Health"
          eyebrow="OpenStack APIs"
          footer={`Probed via Keystone catalog · ${formatDate(data?.observed_at)}`}
        >
          <DataTable
            rows={data?.service_states}
            columns={[
              { header: 'Service', cell: (row) => (
                <span className="font-display text-base text-[#11100D]">{String(row.service || '—')}</span>
              ) },
              { header: 'Status', cell: (row) => statusCell(row.status as string) },
              { header: 'Endpoint hint', cell: (row) => (
                <Mono>{String(row.endpoint || row.url || '—')}</Mono>
              ) },
              { header: 'Error', cell: (row) => (
                <span className="text-[#DD2A1C] text-xs">{String(row.error || '—')}</span>
              ) }
            ]}
          />
        </Panel>

        <Panel
          num="B.02"
          title="Observed inventory"
          eyebrow={`Snapshot ${formatTime(data?.observed_at)}`}
          variant="flag"
        >
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="rgba(17,16,13,0.08)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#6F6A5F' }} />
                <YAxis
                  type="category"
                  width={120}
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#11100D', fontFamily: 'Geist Mono' }}
                  tickFormatter={(v) => String(v).toUpperCase()}
                />
                <Tooltip cursor={{ fill: 'rgba(17,16,13,0.05)' }} />
                <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 hr-thin" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F]">
            Counts derived from live OpenStack APIs.
          </p>
        </Panel>
      </div>

      {/* OPERATIONAL READING */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3 fade-up delay-3">
        <Panel num="C.01" title="Lab posture" eyebrow="Today's reading">
          <p className="font-serif italic text-lg leading-7 text-[#2A2722]">
            “Lecture seule, lecture honnête.” Le dashboard observe le cluster sans toucher.
            Aucun token Keystone ne traverse le navigateur.
          </p>
          <div className="mt-5 hr-thin" />
          <ul className="mt-4 grid gap-2 text-sm">
            <li className="flex justify-between">
              <span className="text-[#6F6A5F]">Token store</span>
              <span className="font-mono text-xs text-[#11100D]">backend only</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[#6F6A5F]">Mutations</span>
              <span className="font-mono text-xs text-[#DD2A1C]">disabled</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[#6F6A5F]">Cadence</span>
              <span className="font-mono text-xs text-[#11100D]">manual / 30 s</span>
            </li>
          </ul>
        </Panel>

        <Panel num="C.02" title="Physical layout" eyebrow="Lab nodes" variant="klein">
          <div className="grid gap-3 text-sm">
            {[
              { name: 'OS-controller01', role: 'Control plane', ip: '10.3.17.143' },
              { name: 'OS-compute01',    role: 'Hypervisor',    ip: '10.3.17.144' },
              { name: 'OS-comput02',     role: 'Hypervisor + Cinder LVM', ip: '10.3.17.145' }
            ].map((n) => (
              <div key={n.name} className="grid grid-cols-[1fr_auto] gap-2 border-b border-[#11100D]/10 pb-2 last:border-0">
                <div>
                  <div className="font-display text-sm font-medium">{n.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{n.role}</div>
                </div>
                <Mono>{n.ip}</Mono>
              </div>
            ))}
          </div>
        </Panel>

        <Panel num="C.03" title="What you can read" eyebrow="API surface">
          <ol className="grid gap-2 font-mono text-[11px] text-[#2A2722]">
            {[
              ['Keystone', 'tokens, projects, users, roles'],
              ['Nova',     'servers, hypervisors, services'],
              ['Neutron',  'networks, subnets, ports, agents'],
              ['Glance',   'images'],
              ['Cinder',   'volumes, types, services, pools'],
              ['Placement', 'resource providers']
            ].map(([svc, items], idx) => (
              <li key={svc} className="grid grid-cols-[28px_90px_1fr] items-baseline gap-2 border-b border-[#11100D]/8 pb-1.5 last:border-0">
                <span className="tabular text-[#6F6A5F]">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-[#11100D] font-medium uppercase tracking-[0.12em]">{svc}</span>
                <span className="text-[#6F6A5F]">{items}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
