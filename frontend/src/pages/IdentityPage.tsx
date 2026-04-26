import { Fingerprint } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, PageTitle, apiItems, statusCell } from './pageUtils';

export default function IdentityPage({ refreshKey }: { refreshKey: number }) {
  const projects = useApi<AnyRecord>('/identity/projects', refreshKey);
  const users = useApi<AnyRecord>('/identity/users', refreshKey);
  const roles = useApi<AnyRecord>('/identity/roles', refreshKey);
  const endpoints = useApi<AnyRecord>('/identity/endpoints', refreshKey);
  if (projects.loading && users.loading && roles.loading && endpoints.loading) return <LoadingBlock />;
  const targetProjects = ['admin', 'service', 'demo', 'etudiants', 'enseignants', 'recherche', 'fablab-pilot'];

  return (
    <>
      <PageTitle eyebrow="Keystone" title="Identity & Access" description="Projects, users, roles and service endpoints that make Keystone the authentication entrypoint for the whole cloud." />
      {[projects, users, roles, endpoints].map((state, index) => <ErrorNotice key={index} message={state.error || state.data?.error as string} />)}

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Architecture View" eyebrow="Auth first">
          <div className="grid gap-3 md:grid-cols-4">
            {['Client', 'Keystone token', 'Service catalog', 'OpenStack API'].map((item, index) => (
              <div key={item} className="border border-zinc-200 bg-white p-4">
                <div className="mb-5 flex h-8 w-8 items-center justify-center bg-zinc-950 text-white">{index + 1}</div>
                <div className="font-semibold">{item}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Lab Project Map" eyebrow="Current and planned">
          <div className="grid gap-2">
            {targetProjects.map((name) => {
              const exists = apiItems<AnyRecord>(projects.data).some((project) => project.name === name);
              return <div key={name} className="flex items-center justify-between border-b border-zinc-200 py-2 text-sm"><span>{name}</span>{statusCell(exists ? 'active' : 'disabled')}</div>;
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6">
        <Panel title="Projects" eyebrow="Tenants">
          <DataTable rows={apiItems<AnyRecord>(projects.data)} columns={[
            { header: 'Name', cell: (row) => row.name || '-' },
            { header: 'Enabled', cell: (row) => statusCell(row.enabled) },
            { header: 'Domain', cell: (row) => row.domain_id || '-' },
            { header: 'Description', cell: (row) => row.description || '-' }
          ]} />
        </Panel>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Users" eyebrow="Principals" action={<Fingerprint className="h-5 w-5 text-cyan-700" />}>
            <DataTable rows={apiItems<AnyRecord>(users.data)} columns={[
              { header: 'Name', cell: (row) => row.name || '-' },
              { header: 'Enabled', cell: (row) => statusCell(row.enabled) },
              { header: 'Domain', cell: (row) => row.domain_id || '-' }
            ]} />
          </Panel>
          <Panel title="Roles" eyebrow="RBAC names">
            <DataTable rows={apiItems<AnyRecord>(roles.data)} columns={[
              { header: 'Name', cell: (row) => row.name || '-' },
              { header: 'ID', cell: (row) => <code className="text-xs">{row.id}</code> }
            ]} />
          </Panel>
        </div>
        <Panel title="Endpoints" eyebrow="Service catalog">
          <DataTable rows={apiItems<AnyRecord>(endpoints.data)} columns={[
            { header: 'Service ID', cell: (row) => <code className="text-xs">{row.service_id}</code> },
            { header: 'Interface', cell: (row) => row.interface || '-' },
            { header: 'Region', cell: (row) => row.region || '-' },
            { header: 'URL', cell: (row) => <span className="break-all text-xs">{row.url}</span> },
            { header: 'Enabled', cell: (row) => statusCell(row.enabled) }
          ]} />
        </Panel>
      </div>
    </>
  );
}
