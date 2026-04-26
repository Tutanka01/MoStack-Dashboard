import { Cloud, Database, Network, Server } from 'lucide-react';
import { useApi } from '../api/useApi';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, statusCell } from './pageUtils';

type Topology = {
  lab: AnyRecord;
  nodes: AnyRecord[];
  servers: AnyRecord[];
  ports: AnyRecord[];
  volumes: AnyRecord[];
  hypervisors: AnyRecord[];
  errors: string[];
};

export default function TopologyPage({ refreshKey }: { refreshKey: number }) {
  const { data, loading, error } = useApi<Topology>('/topology', refreshKey);
  if (loading && !data) return <LoadingBlock />;

  return (
    <>
      <PageTitle eyebrow="Architecture" title="Cloud Topology" description="A deliberately simple topology showing the controller, compute nodes, provider network, VMs and Cinder backend without pretending the lab is more complex than it is." />
      <ErrorNotice message={error} />
      {data?.errors?.map((message, index) => <ErrorNotice key={index} message={message} />)}

      <Panel title="Lab Architecture" eyebrow="Controller, compute, storage, network">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px_1fr] xl:items-center">
          <TopologyNode icon={Cloud} title="Controller" subtitle="API/control plane" detail={`${data?.lab?.controller?.name || 'OS-controller01'} / ${data?.lab?.controller?.ip || '10.3.17.143'}`} />
          <Connector label="Keystone catalog + API calls" />
          <div className="grid gap-4">
            <TopologyNode icon={Server} title="Compute01" subtitle="Hypervisor" detail={`${data?.lab?.compute01?.name || 'OS-compute01'} / ${data?.lab?.compute01?.ip || '10.3.17.144'}`} />
            <TopologyNode icon={Database} title="Compute02 / Storage" subtitle="Hypervisor + Cinder LVM" detail={`${data?.lab?.compute02?.name || 'OS-comput02'} / ${data?.lab?.compute02?.ip || '10.3.17.145'}`} />
          </div>
        </div>
        <div className="my-5 border-t border-zinc-300" />
        <div className="grid gap-4 md:grid-cols-3">
          <TopologyNode icon={Network} title="Provider network" subtitle="Flat provider segment" detail="10.3.16.0/23 / provider:br-provider" />
          <TopologyNode icon={Server} title="VMs observed" subtitle="Nova servers" detail={`${data?.servers?.length || 0} instances`} />
          <TopologyNode icon={Database} title="Cinder backend" subtitle="Persistent blocks" detail="cinder-volumes / os-comput02@lvm#lvm" />
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Hypervisors" eyebrow="Nova">
          <MiniList rows={data?.hypervisors || []} primary="hostname" secondary="state" />
        </Panel>
        <Panel title="VMs" eyebrow="Servers">
          <MiniList rows={data?.servers || []} primary="name" secondary="status" />
        </Panel>
        <Panel title="Volumes" eyebrow="Cinder">
          <MiniList rows={data?.volumes || []} primary="name" secondary="status" />
        </Panel>
      </div>
    </>
  );
}

function Connector({ label }: { label: string }) {
  return <div className="border-y border-zinc-300 py-4 text-center text-xs font-semibold uppercase text-cyan-700 xl:border-x xl:border-y-0">{label}</div>;
}

function TopologyNode({ icon: Icon, title, subtitle, detail }: { icon: typeof Cloud; title: string; subtitle: string; detail: string }) {
  return (
    <div className="border border-zinc-300 bg-white p-5">
      <Icon className="mb-8 h-6 w-6 text-cyan-700" />
      <div className="text-2xl font-semibold">{title}</div>
      <div className="mt-2 text-sm uppercase text-zinc-500">{subtitle}</div>
      <div className="mt-5 break-words text-sm text-zinc-700">{detail}</div>
    </div>
  );
}

function MiniList({ rows, primary, secondary }: { rows: AnyRecord[]; primary: string; secondary: string }) {
  if (!rows.length) return <p className="text-sm text-zinc-500">No live records observed.</p>;
  return (
    <div className="grid gap-2">
      {rows.slice(0, 8).map((row, index) => (
        <div key={index} className="flex items-center justify-between gap-3 border-b border-zinc-200 py-2 text-sm">
          <span className="truncate">{row[primary] || row.id || '-'}</span>
          {statusCell(row[secondary])}
        </div>
      ))}
    </div>
  );
}
