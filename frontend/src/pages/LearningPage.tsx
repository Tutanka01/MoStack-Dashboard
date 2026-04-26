import { useApi } from '../api/useApi';
import { ErrorNotice } from '../components/ErrorNotice';
import { FlowDiagram } from '../components/FlowDiagram';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle } from './pageUtils';

type Flow = {
  title: string;
  steps: { service: string; detail: string }[];
  lab: AnyRecord;
};

export default function LearningPage({ refreshKey }: { refreshKey: number }) {
  const createServer = useApi<Flow>('/learning/flow/create-server', refreshKey);
  const attachVolume = useApi<Flow>('/learning/flow/attach-volume', refreshKey);
  const providerNetwork = useApi<Flow>('/learning/flow/provider-network', refreshKey);
  if (createServer.loading && attachVolume.loading && providerNetwork.loading) return <LoadingBlock />;

  return (
    <>
      <PageTitle
        num="08"
        eyebrow="Pedagogy"
        title="Learning mode — OpenStack, told through this lab."
        description="OpenStack expliqué via ce vrai cluster — vrais noms de services, vraie cartographie réseau et la vraie séquence opérationnelle derrière les actions courantes."
      />
      {[createServer, attachVolume, providerNetwork].map((state, index) => (
        <ErrorNotice key={index} message={state.error} />
      ))}

      <div className="grid gap-6 fade-up delay-1">
        <Panel
          num="08.A"
          title={createServer.data?.title || 'Create server flow'}
          eyebrow="Nova + Placement + Neutron + Glance"
          variant="flag"
        >
          <FlowDiagram steps={createServer.data?.steps || []} />
        </Panel>
        <Panel
          num="08.B"
          title={attachVolume.data?.title || 'Attach volume flow'}
          eyebrow="Cinder + iSCSI + Nova"
          variant="klein"
        >
          <FlowDiagram steps={attachVolume.data?.steps || []} />
        </Panel>
        <Panel
          num="08.C"
          title={providerNetwork.data?.title || 'Provider network flow'}
          eyebrow="Neutron + OVS"
        >
          <FlowDiagram steps={providerNetwork.data?.steps || []} />
        </Panel>

        <Panel num="08.D" title="Quel service appelle quel service ?" eyebrow="Compact reference">
          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Keystone', 'Authentifie les clients et fournit le catalogue des endpoints.', '#11100D'],
              ['Nova',     'Orchestre les VMs et délègue réseau, image et stockage aux bons services.', '#DD2A1C'],
              ['Neutron',  'Crée les ports, subnets et branche OVS vers le provider network.', '#1535C7'],
              ['Cinder',   'Expose des volumes persistants depuis LVM+iSCSI sur os-comput02.', '#07683C']
            ].map(([name, detail, color], idx) => (
              <div key={name} className="bg-[#F7F2E2] p-5 relative">
                <span className="absolute right-3 top-3 font-mono text-[9px] tabular text-[#6F6A5F]">
                  REF.{String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-2xl font-medium tracking-tight" style={{ color: color as string }}>
                  {name}
                </h3>
                <div className="mt-2 mb-3 h-0.5 w-8" style={{ background: color as string }} />
                <p className="text-sm leading-6 text-[#2A2722]">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
