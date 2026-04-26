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
        title="Cluster overview"
        description="Live API health, inventory counts and the latest observed state of the OpenStack lab."
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

      <div className="mb-6 grid gap-px bg-[#11100D]/12 sm:grid-cols-2 xl:grid-cols-6 fade-up delay-1">
        <MetricCard num="A.01" label="Instances" value={counts.instances} icon={Server} accent="flag" hint="Nova servers" />
        <MetricCard num="A.02" label="Images" value={counts.images} icon={Image} hint="Glance catalog" />
        <MetricCard num="A.03" label="Volumes" value={counts.volumes} icon={HardDrive} hint="Cinder LVM" />
        <MetricCard num="A.04" label="Networks" value={counts.networks} icon={Network} accent="klein" hint="Neutron" />
        <MetricCard num="A.05" label="Hypervisors" value={counts.hypervisors} icon={Boxes} hint="KVM / libvirt" />
        <MetricCard num="A.06" label="Neutron agents" value={counts.neutron_agents} icon={Database} hint="OVS workers" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] fade-up delay-2">
        <Panel
          num="B.01"
          title="Service Health"
          eyebrow="OpenStack APIs"
          footer={`Probed via Keystone catalog / ${formatDate(data?.observed_at)}`}
        >
          <DataTable
            rows={data?.service_states}
            columns={[
              { header: 'Service', cell: (row) => (
                <span className="font-display text-base font-medium text-[#11100D]">{String(row.service || '-')}</span>
              ) },
              { header: 'Status', cell: (row) => statusCell(row.status as string) },
              { header: 'Endpoint', cell: (row) => (
                <Mono>{String(row.endpoint || row.url || '-')}</Mono>
              ) },
              { header: 'Error', cell: (row) => (
                <span className="text-[#DD2A1C] text-xs">{String(row.error || '-')}</span>
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
          <p className="mt-3 text-xs text-[#6F6A5F]">
            Counts derived from live OpenStack APIs.
          </p>
        </Panel>
      </div>
    </>
  );
}
