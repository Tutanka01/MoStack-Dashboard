import { Database, HardDrive } from 'lucide-react';
import { useApi } from '../api/useApi';
import { CapacityBar } from '../components/CapacityBar';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, statusCell } from './pageUtils';

export default function StoragePage({ refreshKey }: { refreshKey: number }) {
  const volumes  = useApi<AnyRecord>('/storage/volumes', refreshKey);
  const types    = useApi<AnyRecord>('/storage/types', refreshKey);
  const services = useApi<AnyRecord>('/storage/services', refreshKey);
  const pools    = useApi<AnyRecord>('/storage/pools', refreshKey);
  if (volumes.loading && types.loading && services.loading && pools.loading) return <LoadingBlock />;

  const volumeRows = apiItems<AnyRecord>(volumes.data);

  return (
    <>
      <PageTitle
        num="04"
        eyebrow="Cinder"
        title="Block storage — what survives a reboot."
        description="Read-only view of volumes, LVM backend capacity and the Cinder service workers that expose persistent block storage to instances over iSCSI."
        meta={[
          { label: 'Volumes', value: String(volumeRows.length) },
          { label: 'Backend', value: 'LVM + iSCSI' },
          { label: 'VG', value: 'cinder-volumes' }
        ]}
      />
      {[volumes, types, services, pools].map((state, index) => (
        <ErrorNotice key={index} message={state.error || (state.data?.error as string)} />
      ))}

      <div className="mb-6 grid gap-6 xl:grid-cols-[440px_1fr] fade-up delay-1">
        <Panel num="04.A" title="LVM Backend" eyebrow="os-comput02 storage role" variant="flag">
          <dl className="grid gap-0 text-sm">
            {[
              ['Backend', 'LVM + iSCSI via tgt'],
              ['Host', 'os-comput02@lvm#lvm'],
              ['Volume group', 'cinder-volumes'],
              ['Volume type', 'lvm']
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-[#11100D]/10 py-2.5 last:border-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{k}</dt>
                <dd><Mono>{v}</Mono></dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel
          num="04.B"
          title="Storage model"
          eyebrow="Mental model"
          action={<HardDrive className="h-5 w-5 text-[#DD2A1C]" />}
        >
          <p className="font-serif text-2xl leading-9 italic text-[#2A2722] max-w-3xl">
            Cinder fournit du <span className="not-italic font-display font-medium text-[#11100D]">block storage persistant</span>.
            Ici, le backend est <span className="font-mono text-base not-italic text-[#11100D]">LVM + iSCSI via tgt</span> sur
            <span className="font-mono text-base not-italic text-[#11100D]"> os-comput02</span>.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              ['Persistent', 'Survives reboot'],
              ['Block', 'Raw devices'],
              ['Attached', 'Via iSCSI to Nova']
            ].map(([title, desc]) => (
              <div key={title} className="border-l-2 border-[#DD2A1C] pl-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#DD2A1C]">{title}</div>
                <div className="text-sm text-[#2A2722] mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 fade-up delay-2">
        <Panel num="04.C" title="Volumes" eyebrow="Cinder volumes">
          <DataTable
            rows={volumeRows}
            columns={[
              { header: 'Name', cell: (row) => (
                <span className="font-display text-sm font-medium">{row.name || <Mono>{row.id}</Mono>}</span>
              ) },
              { header: 'Status', cell: (row) => statusCell(row.status) },
              { header: 'Size', cell: (row) => (
                <span className="font-mono tabular text-sm text-[#11100D]">{row.size ?? '—'}<span className="text-[#6F6A5F]"> GB</span></span>
              ), align: 'right' },
              { header: 'Type', cell: (row) => <span className="meta-pill">{row.volume_type || '—'}</span> },
              { header: 'Bootable', cell: (row) => statusCell(row.bootable === 'true' ? 'enabled' : 'disabled') },
              { header: 'Attached to', cell: (row) => (
                <span className="font-mono text-xs">
                  {(row.attachments || []).map((a: AnyRecord) => a.server_id?.slice(0, 8)).join(', ') || '—'}
                </span>
              ) },
              { header: 'Host', cell: (row) => <Mono>{row['os-vol-host-attr:host'] || '—'}</Mono> }
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel num="04.D" title="Backend pools" eyebrow="Capacity" variant="klein">
            <DataTable
              rows={apiItems<AnyRecord>(pools.data)}
              columns={[
                { header: 'Name', cell: (row) => (
                  <span className="font-display text-sm font-medium">{row.name || '—'}</span>
                ) },
                { header: 'Backend', cell: (row) => <Mono>{row.capabilities?.volume_backend_name || '—'}</Mono> },
                { header: 'Capacity', cell: (row) => (
                  <CapacityBar
                    used={(row.capabilities?.total_capacity_gb || 0) - (row.capabilities?.free_capacity_gb || 0)}
                    total={row.capabilities?.total_capacity_gb}
                    unit="GB"
                    tone="klein"
                  />
                ) },
                { header: 'Thin', cell: (row) => statusCell(row.capabilities?.thin_provisioning_support ? 'enabled' : 'disabled') }
              ]}
            />
          </Panel>

          <Panel num="04.E" title="Cinder services" eyebrow="Workers">
            <DataTable
              rows={apiItems<AnyRecord>(services.data)}
              columns={[
                { header: 'Binary', cell: (row) => <Mono>{row.binary || '—'}</Mono> },
                { header: 'Host', cell: (row) => <Mono>{row.host || '—'}</Mono> },
                { header: 'Zone', cell: (row) => row.zone || '—' },
                { header: 'Status', cell: (row) => statusCell(row.status) },
                { header: 'State', cell: (row) => statusCell(row.state) }
              ]}
            />
          </Panel>
        </div>

        <Panel
          num="04.F"
          title="Volume types"
          eyebrow="Policy names"
          action={<Database className="h-5 w-5 text-[#DD2A1C]" />}
        >
          <DataTable
            rows={apiItems<AnyRecord>(types.data)}
            columns={[
              { header: 'Name', cell: (row) => (
                <span className="font-display text-sm font-medium">{row.name || '—'}</span>
              ) },
              { header: 'Description', cell: (row) => row.description || '—' },
              { header: 'Public', cell: (row) => statusCell(row.is_public ? 'enabled' : 'disabled') },
              { header: 'Extra specs', cell: (row) => (
                <Mono>{JSON.stringify(row.extra_specs || {})}</Mono>
              ) }
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
