import { Boxes, Database, HardDrive, Image, Network, Server } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { MetricCard } from '../components/MetricCard';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, formatDate, statusCell } from './pageUtils';

type Overview = {
  observed_at: string;
  status: string;
  counts: Record<string, number>;
  service_states: AnyRecord[];
  errors: { service: string; error: string }[];
};

export default function OverviewPage({ refreshKey }: { refreshKey: number }) {
  const { data, loading, error } = useApi<Overview>('/overview', refreshKey);
  if (loading && !data) return <LoadingBlock />;

  const counts = data?.counts || {};
  const chartData = Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  return (
    <>
      <PageTitle eyebrow="Overview / Control Plane" title="Control Plane" description="A concise operational view of API availability, inventory counts and the last observed state of the lab." />
      <ErrorNotice message={error} />
      {data?.errors?.map((item, index) => <ErrorNotice key={index} message={`${item.service}: ${item.error}`} />)}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Instances" value={counts.instances} icon={Server} />
        <MetricCard label="Images" value={counts.images} icon={Image} />
        <MetricCard label="Volumes" value={counts.volumes} icon={HardDrive} />
        <MetricCard label="Networks" value={counts.networks} icon={Network} />
        <MetricCard label="Hypervisors" value={counts.hypervisors} icon={Boxes} />
        <MetricCard label="Neutron agents" value={counts.neutron_agents} icon={Database} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Service Health" eyebrow="OpenStack APIs">
          <DataTable
            rows={data?.service_states}
            columns={[
              { header: 'Service', cell: (row) => String(row.service || '-') },
              { header: 'Status', cell: (row) => statusCell(row.status as string) },
              { header: 'Error', cell: (row) => <span className="text-red-700">{String(row.error || '-')}</span> }
            ]}
          />
        </Panel>

        <Panel title="Observed Inventory" eyebrow={`Last state ${formatDate(data?.observed_at)}`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#e4e4e7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" width={110} dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} />
                <Bar dataKey="value" fill="#00a6d6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
