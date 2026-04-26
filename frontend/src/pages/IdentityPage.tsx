import { Fingerprint } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, statusCell } from './pageUtils';

export default function IdentityPage({ refreshKey }: { refreshKey: number }) {
  const projects  = useApi<AnyRecord>('/identity/projects', refreshKey);
  const users     = useApi<AnyRecord>('/identity/users', refreshKey);
  const roles     = useApi<AnyRecord>('/identity/roles', refreshKey);
  const endpoints = useApi<AnyRecord>('/identity/endpoints', refreshKey);
  if (projects.loading && users.loading && roles.loading && endpoints.loading) return <LoadingBlock />;

  const projectRows  = apiItems<AnyRecord>(projects.data);
  const targetProjects = ['admin', 'service', 'demo', 'etudiants', 'enseignants', 'recherche', 'fablab-pilot'];

  return (
    <>
      <PageTitle
        num="06"
        eyebrow="Keystone"
        title="Identity & access — who is allowed to touch what."
        description="Projects, users, roles and service endpoints — Keystone is the authentication entrypoint and the catalogue of every other OpenStack service."
        meta={[
          { label: 'Projects', value: String(projectRows.length) },
          { label: 'Users',    value: String(apiItems(users.data).length) },
          { label: 'Roles',    value: String(apiItems(roles.data).length) }
        ]}
      />
      {[projects, users, roles, endpoints].map((state, index) => (
        <ErrorNotice key={index} message={state.error || (state.data?.error as string)} />
      ))}

      {/* AUTH FLOW + PROJECT MAP */}
      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_440px] fade-up delay-1">
        <Panel num="06.A" title="Architecture view" eyebrow="Auth first" variant="klein">
          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-4">
            {['Client', 'Keystone token', 'Service catalog', 'OpenStack API'].map((item, index) => (
              <div key={item} className="bg-[#F7F2E2] p-4 relative">
                <div className="mb-5 flex h-8 w-8 items-center justify-center bg-[#1535C7] text-[#EFE9D9] font-mono text-sm tabular">
                  {index + 1}
                </div>
                <div className="font-display text-sm font-medium leading-tight">{item}</div>
                <div className="mt-2 h-px w-6 bg-[#1535C7]" />
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">
                  Step {String(index + 1).padStart(2, '0')} / 04
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif italic text-[#2A2722]">
            Le client présente ses credentials à Keystone, reçoit un token Fernet, puis présente ce token aux autres services. Le catalogue dit où chaque service écoute.
          </p>
        </Panel>

        <Panel num="06.B" title="Lab project map" eyebrow="Current vs planned">
          <div className="grid gap-1.5">
            {targetProjects.map((name) => {
              const exists = projectRows.some((project) => project.name === name);
              return (
                <div key={name} className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 border-b border-[#11100D]/10 py-2 last:border-0">
                  <span className="font-mono tabular text-[10px] text-[#6F6A5F]">{exists ? '◉' : '○'}</span>
                  <span className="font-display text-sm font-medium">{name}</span>
                  {statusCell(exists ? 'active' : 'disabled')}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 fade-up delay-2">
        <Panel num="06.C" title="Projects" eyebrow="Tenants">
          <DataTable
            rows={projectRows}
            columns={[
              { header: 'Name', cell: (row) => (
                <span className="font-display text-sm font-medium">{row.name || '—'}</span>
              ) },
              { header: 'Enabled', cell: (row) => statusCell(row.enabled) },
              { header: 'Domain', cell: (row) => <Mono>{row.domain_id || '—'}</Mono> },
              { header: 'Description', cell: (row) => row.description || '—' }
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            num="06.D"
            title="Users"
            eyebrow="Principals"
            action={<Fingerprint className="h-5 w-5 text-[#1535C7]" />}
          >
            <DataTable
              rows={apiItems<AnyRecord>(users.data)}
              columns={[
                { header: 'Name', cell: (row) => (
                  <span className="font-display text-sm font-medium">{row.name || '—'}</span>
                ) },
                { header: 'Enabled', cell: (row) => statusCell(row.enabled) },
                { header: 'Domain', cell: (row) => <Mono>{row.domain_id || '—'}</Mono> }
              ]}
            />
          </Panel>
          <Panel num="06.E" title="Roles" eyebrow="RBAC names">
            <DataTable
              rows={apiItems<AnyRecord>(roles.data)}
              columns={[
                { header: 'Name', cell: (row) => (
                  <span className="font-display text-sm font-medium">{row.name || '—'}</span>
                ) },
                { header: 'ID', cell: (row) => <Mono>{row.id}</Mono> }
              ]}
            />
          </Panel>
        </div>

        <Panel num="06.F" title="Endpoints" eyebrow="Service catalog">
          <DataTable
            rows={apiItems<AnyRecord>(endpoints.data)}
            columns={[
              { header: 'Service ID', cell: (row) => <Mono>{String(row.service_id).slice(0, 12)}…</Mono> },
              { header: 'Interface', cell: (row) => (
                <span className="meta-pill">{row.interface || '—'}</span>
              ) },
              { header: 'Region', cell: (row) => row.region || '—' },
              { header: 'URL', cell: (row) => (
                <span className="font-mono text-xs break-all text-[#1535C7]">{row.url}</span>
              ) },
              { header: 'Enabled', cell: (row) => statusCell(row.enabled) }
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
