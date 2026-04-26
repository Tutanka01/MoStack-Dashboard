import { Cloud, Database, Network, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApi } from '../api/useApi';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, statusCell } from './pageUtils';

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
      <PageTitle
        num="07"
        eyebrow="Architecture"
        title="Cloud topology — without pretending it's bigger."
        description="A deliberately simple topology showing the controller, compute nodes, provider network, instances and the Cinder backend — exactly as the lab is laid out."
        meta={[
          { label: 'Nodes', value: '3' },
          { label: 'VMs', value: String(data?.servers?.length || 0) },
          { label: 'Volumes', value: String(data?.volumes?.length || 0) }
        ]}
      />
      <ErrorNotice message={error} />
      {data?.errors?.map((message, index) => <ErrorNotice key={index} message={message} />)}

      {/* MAIN ARCHITECTURE */}
      <div className="fade-up delay-1">
        <Panel num="07.A" title="Lab architecture" eyebrow="Controller — compute — storage — network" variant="flag">
          <div className="grid gap-4 xl:grid-cols-[1fr_220px_1fr] xl:items-stretch">
            <TopologyNode
              icon={Cloud}
              title="Controller"
              subtitle="API / control plane"
              hostName={data?.lab?.controller?.name || 'OS-controller01'}
              ip={data?.lab?.controller?.ip || '10.3.17.143'}
              code="N.01"
              tone="ink"
            />
            <Connector label="Keystone catalog · API calls" />
            <div className="grid gap-4">
              <TopologyNode
                icon={Server}
                title="Compute01"
                subtitle="Hypervisor"
                hostName={data?.lab?.compute01?.name || 'OS-compute01'}
                ip={data?.lab?.compute01?.ip || '10.3.17.144'}
                code="N.02"
                tone="klein"
              />
              <TopologyNode
                icon={Database}
                title="Compute02 / Storage"
                subtitle="Hypervisor + Cinder LVM"
                hostName={data?.lab?.compute02?.name || 'OS-comput02'}
                ip={data?.lab?.compute02?.ip || '10.3.17.145'}
                code="N.03"
                tone="flag"
              />
            </div>
          </div>

          <div className="my-6 hatch-divider" />

          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-3">
            <TopologyTile icon={Network} title="Provider network" subtitle="Flat segment" detail="10.3.16.0/23" hint="provider:br-provider" code="P.01" />
            <TopologyTile icon={Server}  title="VMs observed"     subtitle="Nova servers"  detail={`${data?.servers?.length || 0} instances`} hint="Live snapshot" code="P.02" />
            <TopologyTile icon={Database} title="Cinder backend"  subtitle="Persistent blocks" detail="cinder-volumes" hint="os-comput02@lvm#lvm" code="P.03" />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 fade-up delay-2">
        <Panel num="07.B" title="Hypervisors" eyebrow="Nova">
          <MiniList rows={data?.hypervisors || []} primary="hostname" secondary="state" />
        </Panel>
        <Panel num="07.C" title="VMs" eyebrow="Servers" variant="klein">
          <MiniList rows={data?.servers || []} primary="name" secondary="status" />
        </Panel>
        <Panel num="07.D" title="Volumes" eyebrow="Cinder" variant="flag">
          <MiniList rows={data?.volumes || []} primary="name" secondary="status" />
        </Panel>
      </div>
    </>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center xl:px-2">
      <div className="hidden xl:block absolute top-1/2 left-0 right-0 h-px bg-[#11100D]/30" />
      <div className="hidden xl:block absolute top-1/2 left-0 -translate-y-1/2 h-2 w-2 rounded-full bg-[#11100D]" />
      <div className="hidden xl:block absolute top-1/2 right-0 -translate-y-1/2 h-2 w-2 rounded-full bg-[#11100D]" />
      <div className="relative bg-[#F7F2E2] border border-[#11100D]/30 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#11100D]">
        {label}
      </div>
    </div>
  );
}

const TONE: Record<string, { border: string; mark: string }> = {
  ink:   { border: 'border-[#11100D]', mark: 'bg-[#11100D]' },
  flag:  { border: 'border-[#DD2A1C]', mark: 'bg-[#DD2A1C]' },
  klein: { border: 'border-[#1535C7]', mark: 'bg-[#1535C7]' }
};

function TopologyNode({
  icon: Icon,
  title,
  subtitle,
  hostName,
  ip,
  code,
  tone = 'ink'
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  hostName: string;
  ip: string;
  code: string;
  tone?: 'ink' | 'flag' | 'klein';
}) {
  const t = TONE[tone];
  return (
    <div className={`relative bg-[#F7F2E2] border ${t.border} p-5`}>
      <span className="corner-tag">{code}</span>
      <Icon className="mb-6 h-6 w-6 text-[#11100D]" />
      <div className="font-display text-2xl font-medium tracking-tight">{title}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F] mt-1">
        {subtitle}
      </div>
      <div className={`mt-4 mb-3 h-0.5 w-10 ${t.mark}`} />
      <div className="grid gap-1 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-[#6F6A5F]">Host</span>
          <Mono>{hostName}</Mono>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#6F6A5F]">IP</span>
          <Mono>{ip}</Mono>
        </div>
      </div>
    </div>
  );
}

function TopologyTile({ icon: Icon, title, subtitle, detail, hint, code }: {
  icon: LucideIcon; title: string; subtitle: string; detail: string; hint: string; code: string;
}) {
  return (
    <div className="bg-[#F7F2E2] p-4 relative">
      <span className="corner-tag">{code}</span>
      <Icon className="mb-3 h-5 w-5 text-[#1535C7]" />
      <div className="font-display text-base font-medium">{title}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F] mt-0.5">
        {subtitle}
      </div>
      <div className="mt-3 text-sm text-[#11100D]"><Mono>{detail}</Mono></div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{hint}</div>
    </div>
  );
}

function MiniList({ rows, primary, secondary }: { rows: AnyRecord[]; primary: string; secondary: string }) {
  if (!rows.length) {
    return <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6F6A5F]">No live records observed.</p>;
  }
  return (
    <div className="grid gap-1.5">
      {rows.slice(0, 8).map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-[#11100D]/10 py-2 last:border-0"
        >
          <span className="font-mono tabular text-[10px] text-[#6F6A5F]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="truncate font-display text-sm font-medium">{row[primary] || row.id || '—'}</span>
          {statusCell(row[secondary])}
        </div>
      ))}
    </div>
  );
}
