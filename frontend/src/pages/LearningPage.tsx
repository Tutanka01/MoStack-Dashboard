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
      <PageTitle eyebrow="Pedagogy" title="Learning Mode" description="OpenStack explained through this actual lab: real service names, real network mapping and the operational sequence behind common actions." />
      {[createServer, attachVolume, providerNetwork].map((state, index) => <ErrorNotice key={index} message={state.error} />)}

      <div className="grid gap-6">
        <Panel title={createServer.data?.title || 'Create server flow'} eyebrow="Nova + Placement + Neutron + Glance">
          <FlowDiagram steps={createServer.data?.steps || []} />
        </Panel>
        <Panel title={attachVolume.data?.title || 'Attach volume flow'} eyebrow="Cinder + iSCSI + Nova">
          <FlowDiagram steps={attachVolume.data?.steps || []} />
        </Panel>
        <Panel title={providerNetwork.data?.title || 'Provider network flow'} eyebrow="Neutron + OVS">
          <FlowDiagram steps={providerNetwork.data?.steps || []} />
        </Panel>
        <Panel title="Quel service appelle quel service ?" eyebrow="Compact reference">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Keystone', 'Authentifie les clients et fournit le catalogue des endpoints.'],
              ['Nova', 'Orchestre les VMs et delegue reseau, image et stockage aux bons services.'],
              ['Neutron', 'Cree les ports, subnets et branche OVS vers le provider network.'],
              ['Cinder', 'Expose des volumes persistants depuis LVM+iSCSI sur os-comput02.']
            ].map(([name, detail]) => (
              <div key={name} className="border border-zinc-200 bg-white p-4">
                <h3 className="mb-3 text-lg font-semibold">{name}</h3>
                <p className="text-sm leading-6 text-zinc-600">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
