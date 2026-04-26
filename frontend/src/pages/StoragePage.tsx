import { useState } from 'react';
import { Camera, Database, HardDrive } from 'lucide-react';
import { useApi } from '../api/useApi';
import { CapacityBar } from '../components/CapacityBar';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Field, inputClass, OperationPanel, OperatorNotice, OperatorProps, SubmitButton, useMutation } from '../components/OperatorControls';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, formatDate, statusCell } from './pageUtils';

const BTN = 'inline-flex items-center gap-1 border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition hover:border-[#DD2A1C] disabled:opacity-35 cursor-pointer';
const BTN_DANGER = 'inline-flex items-center gap-1 border border-[#DD2A1C]/30 bg-[#DD2A1C]/[0.06] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#DD2A1C] transition hover:bg-[#DD2A1C] hover:text-[#EFE9D9] disabled:opacity-35 cursor-pointer';
const BTN_CONFIRM = 'inline-flex items-center gap-1 border border-[#07683C]/40 bg-[#07683C]/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#07683C] transition hover:bg-[#07683C] hover:text-white disabled:opacity-35 cursor-pointer';

export default function StoragePage({ refreshKey, writeMode, canWrite, onMutated }: { refreshKey: number } & OperatorProps) {
  const volumes   = useApi<AnyRecord>('/storage/volumes', refreshKey);
  const types     = useApi<AnyRecord>('/storage/types', refreshKey);
  const services  = useApi<AnyRecord>('/storage/services', refreshKey);
  const pools     = useApi<AnyRecord>('/storage/pools', refreshKey);
  const snapshots = useApi<AnyRecord>('/storage/snapshots', refreshKey);

  const volumeMutation   = useMutation(onMutated);
  const snapshotMutation = useMutation(onMutated);
  const extendMutation   = useMutation(onMutated);
  const uploadMutation   = useMutation(onMutated);

  // Inline extend state
  const [extendTarget,  setExtendTarget]  = useState<string | null>(null);
  const [extendNewSize, setExtendNewSize] = useState('');

  // Inline upload-to-image state
  const [uploadTarget,    setUploadTarget]    = useState<string | null>(null);
  const [uploadImageName, setUploadImageName] = useState('');

  if (volumes.loading && types.loading && services.loading && pools.loading) return <LoadingBlock />;

  const volumeRows   = apiItems<AnyRecord>(volumes.data);
  const typeRows     = apiItems<AnyRecord>(types.data);
  const snapshotRows = apiItems<AnyRecord>(snapshots.data);

  function createVolume(form: HTMLFormElement) {
    const d = new FormData(form);
    volumeMutation.run('/storage/volumes', 'POST', {
      name:        String(d.get('name') || ''),
      size:        Number(d.get('size') || 1),
      description: String(d.get('description') || '') || undefined,
      volume_type: String(d.get('volume_type') || '') || undefined,
    }, 'Volume create requested.');
    form.reset();
  }

  function createSnapshot(form: HTMLFormElement) {
    const d = new FormData(form);
    snapshotMutation.run('/storage/snapshots', 'POST', {
      volume_id:   String(d.get('volume_id') || ''),
      name:        String(d.get('name') || ''),
      description: String(d.get('description') || '') || undefined,
      force:       d.get('force') === 'on',
    }, 'Snapshot requested.');
    form.reset();
  }

  function confirmExtend(volumeId: string) {
    const size = Number(extendNewSize);
    if (!size || size < 1) return;
    extendMutation.run(`/storage/volumes/${volumeId}/extend`, 'POST', { new_size: size }, 'Extend requested.');
    setExtendTarget(null);
    setExtendNewSize('');
  }

  function confirmUpload(volumeId: string) {
    if (!uploadImageName) return;
    uploadMutation.run(`/storage/volumes/${volumeId}/upload-to-image`, 'POST', { image_name: uploadImageName }, 'Upload to image queued.');
    setUploadTarget(null);
    setUploadImageName('');
  }

  const busy = volumeMutation.busy || snapshotMutation.busy || extendMutation.busy || uploadMutation.busy;

  return (
    <>
      <PageTitle
        num="04"
        eyebrow="Cinder"
        title="Block storage — what survives a reboot."
        description="Full volume lifecycle: create, extend, snapshot, set bootable, upload to Glance. LVM backend over iSCSI on os-comput02."
        meta={[
          { label: 'Volumes',   value: String(volumeRows.length) },
          { label: 'Snapshots', value: String(snapshotRows.length) },
          { label: 'Backend',   value: 'LVM + iSCSI' },
        ]}
      />
      {[volumes, types, services, pools, snapshots].map((s, i) => (
        <ErrorNotice key={i} message={s.error || (s.data?.error as string)} />
      ))}
      <OperatorNotice writeMode={writeMode} canWrite={canWrite} />

      {/* ── OPS PANEL ───────────────────────────────────────────────────── */}
      {writeMode && (
        <Panel num="04.OPS" title="Storage operator" eyebrow="Create, extend, snapshot and upload Cinder volumes" variant="flag">
          <div className="grid gap-4 xl:grid-cols-2">

            {/* Create volume */}
            <OperationPanel title="Create volume" state={volumeMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createVolume(e.currentTarget); }}>
                <Field label="Name"><input name="name" required className={inputClass} placeholder="data-01" /></Field>
                <Field label="Size (GB)"><input name="size" type="number" min={1} defaultValue={1} required className={inputClass} /></Field>
                <Field label="Type">
                  <select name="volume_type" className={inputClass}>
                    <option value="">Default</option>
                    {typeRows.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="Description"><input name="description" className={inputClass} placeholder="optional" /></Field>
                <div className="sm:col-span-2">
                  <SubmitButton disabled={!canWrite} busy={volumeMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Create volume</SubmitButton>
                </div>
              </form>
            </OperationPanel>

            {/* Create snapshot */}
            <OperationPanel title="Create snapshot" state={snapshotMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createSnapshot(e.currentTarget); }}>
                <Field label="Volume">
                  <select name="volume_id" required className={inputClass}>
                    <option value="">Select volume</option>
                    {volumeRows.map(v => <option key={v.id} value={v.id}>{v.name || v.id} ({v.size}GB)</option>)}
                  </select>
                </Field>
                <Field label="Snapshot name"><input name="name" required className={inputClass} placeholder="snap-01" /></Field>
                <Field label="Description"><input name="description" className={inputClass} placeholder="optional" /></Field>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] mt-5">
                    <input name="force" type="checkbox" /> Force (snapshot in-use volumes)
                  </label>
                  <SubmitButton disabled={!canWrite} busy={snapshotMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Snapshot</SubmitButton>
                </div>
              </form>
            </OperationPanel>

          </div>
        </Panel>
      )}

      {/* ── LVM INFO + STORAGE MODEL ─────────────────────────────────── */}
      <div className="mb-6 grid gap-6 xl:grid-cols-[440px_1fr] fade-up delay-1">
        <Panel num="04.A" title="LVM Backend" eyebrow="os-comput02 storage role" variant="flag">
          <dl className="grid gap-0 text-sm">
            {[
              ['Backend',     'LVM + iSCSI via tgt'],
              ['Host',        'os-comput02@lvm#lvm'],
              ['Volume group','cinder-volumes'],
              ['Volume type', 'lvm'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-[#11100D]/10 py-2.5 last:border-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{k}</dt>
                <dd><Mono>{v}</Mono></dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel num="04.B" title="Storage model" eyebrow="Mental model" action={<HardDrive className="h-5 w-5 text-[#DD2A1C]" />}>
          <p className="font-serif text-2xl leading-9 italic text-[#2A2722] max-w-3xl">
            Cinder fournit du <span className="not-italic font-display font-medium text-[#11100D]">block storage persistant</span>.
            Ici, le backend est <span className="font-mono text-base not-italic text-[#11100D]">LVM + iSCSI via tgt</span> sur
            <span className="font-mono text-base not-italic text-[#11100D]"> os-comput02</span>.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[['Persistent', 'Survives reboot'], ['Block', 'Raw devices'], ['Attached', 'Via iSCSI to Nova']].map(([title, desc]) => (
              <div key={title} className="border-l-2 border-[#DD2A1C] pl-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#DD2A1C]">{title}</div>
                <div className="text-sm text-[#2A2722] mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 fade-up delay-2">

        {/* ── VOLUMES TABLE ─────────────────────────────────────────── */}
        <Panel num="04.C" title="Volumes" eyebrow="Cinder volumes">
          <DataTable
            rows={volumeRows}
            columns={[
              { header: 'Name', cell: row => <span className="font-display text-sm font-medium">{row.name || <Mono>{String(row.id).slice(0, 12)}</Mono>}</span> },
              { header: 'Status', cell: row => statusCell(row.status) },
              { header: 'Size', cell: row => (
                <span className="font-mono tabular text-sm">{row.size ?? '—'}<span className="text-[#6F6A5F]"> GB</span></span>
              ), align: 'right' },
              { header: 'Type',     cell: row => <span className="meta-pill">{row.volume_type || '—'}</span> },
              { header: 'Bootable', cell: row => statusCell(row.bootable === 'true' ? 'enabled' : 'disabled') },
              { header: 'Attached', cell: row => (
                <span className="font-mono text-xs">
                  {(row.attachments || []).map((a: AnyRecord) => String(a.server_id).slice(0, 8)).join(', ') || '—'}
                </span>
              ) },
              { header: 'Host', cell: row => <Mono>{row['os-vol-host-attr:host'] || '—'}</Mono> },
              { header: 'Actions', cell: row => writeMode ? (
                <div className="flex flex-wrap gap-1.5">
                  {/* Rename */}
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => { const n = window.prompt('New name', row.name || ''); if (n) volumeMutation.run(`/storage/volumes/${row.id}`, 'PATCH', { name: n }, 'Renamed.'); }}>
                    Rename
                  </button>

                  {/* Extend */}
                  {extendTarget === row.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min={Number(row.size) + 1} value={extendNewSize}
                        onChange={e => setExtendNewSize(e.target.value)}
                        className="border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px] w-16"
                        placeholder={String(Number(row.size) + 1)}
                      />
                      <span className="font-mono text-[9px] text-[#6F6A5F]">GB</span>
                      <button type="button" disabled={!extendNewSize || extendMutation.busy} className={BTN_CONFIRM}
                        onClick={() => confirmExtend(row.id)}>OK</button>
                      <button type="button" className={BTN} onClick={() => { setExtendTarget(null); setExtendNewSize(''); }}>✕</button>
                    </div>
                  ) : (
                    <button type="button" disabled={!canWrite || busy} className={BTN}
                      onClick={() => { setExtendTarget(row.id); setUploadTarget(null); }}>
                      Extend
                    </button>
                  )}

                  {/* Set bootable */}
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => volumeMutation.run(`/storage/volumes/${row.id}/set-bootable`, 'POST', { bootable: row.bootable !== 'true' }, `Bootable → ${row.bootable !== 'true'}.`)}>
                    {row.bootable === 'true' ? 'Unset boot' : 'Set bootable'}
                  </button>

                  {/* Reset state */}
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => { const s = window.prompt('Reset to status (available / error / in-use):', 'available'); if (s) volumeMutation.run(`/storage/volumes/${row.id}/reset-state`, 'POST', { status: s }, 'State reset.'); }}>
                    Reset state
                  </button>

                  {/* Upload to image */}
                  {uploadTarget === row.id ? (
                    <div className="flex items-center gap-1">
                      <input value={uploadImageName} onChange={e => setUploadImageName(e.target.value)}
                        className="border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px] w-28" placeholder="image-name" />
                      <button type="button" disabled={!uploadImageName || uploadMutation.busy} className={BTN_CONFIRM}
                        onClick={() => confirmUpload(row.id)}>Upload</button>
                      <button type="button" className={BTN} onClick={() => { setUploadTarget(null); setUploadImageName(''); }}>✕</button>
                    </div>
                  ) : (
                    <button type="button" disabled={!canWrite || busy} className={BTN}
                      onClick={() => { setUploadTarget(row.id); setExtendTarget(null); }}>
                      → Image
                    </button>
                  )}

                  {/* Delete */}
                  <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete volume ${row.name || row.id}?`) && volumeMutation.run(`/storage/volumes/${row.id}`, 'DELETE', undefined, 'Delete requested.')}>
                    Delete
                  </button>
                </div>
              ) : '—' },
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Backend pools */}
          <Panel num="04.D" title="Backend pools" eyebrow="Capacity" variant="klein">
            <DataTable
              rows={apiItems<AnyRecord>(pools.data)}
              columns={[
                { header: 'Name',    cell: row => <span className="font-display text-sm font-medium">{row.name || '—'}</span> },
                { header: 'Backend', cell: row => <Mono>{row.capabilities?.volume_backend_name || '—'}</Mono> },
                { header: 'Capacity', cell: row => (
                  <CapacityBar
                    used={(row.capabilities?.total_capacity_gb || 0) - (row.capabilities?.free_capacity_gb || 0)}
                    total={row.capabilities?.total_capacity_gb}
                    unit="GB"
                    tone="klein"
                  />
                ) },
                { header: 'Thin', cell: row => statusCell(row.capabilities?.thin_provisioning_support ? 'enabled' : 'disabled') },
              ]}
            />
          </Panel>

          {/* Cinder services */}
          <Panel num="04.E" title="Cinder services" eyebrow="Workers">
            <DataTable
              rows={apiItems<AnyRecord>(services.data)}
              columns={[
                { header: 'Binary', cell: row => <Mono>{row.binary || '—'}</Mono> },
                { header: 'Host',   cell: row => <Mono>{row.host   || '—'}</Mono> },
                { header: 'Zone',   cell: row => row.zone || '—' },
                { header: 'Status', cell: row => statusCell(row.status) },
                { header: 'State',  cell: row => statusCell(row.state) },
              ]}
            />
          </Panel>
        </div>

        {/* Snapshots */}
        <Panel num="04.G" title="Snapshots" eyebrow="Point-in-time volume copies" action={<Camera className="h-5 w-5 text-[#1535C7]" />}>
          <DataTable
            rows={snapshotRows}
            columns={[
              { header: 'Name', cell: row => <span className="font-display text-sm font-medium">{row.name || <Mono>{String(row.id).slice(0, 12)}</Mono>}</span> },
              { header: 'Status', cell: row => statusCell(row.status) },
              { header: 'Size', cell: row => (
                <span className="font-mono tabular text-sm">{row.size ?? '—'}<span className="text-[#6F6A5F]"> GB</span></span>
              ), align: 'right' },
              { header: 'Volume', cell: row => <Mono>{String(row.volume_id || '—').slice(0, 12)}</Mono> },
              { header: 'Description', cell: row => <span className="text-sm text-[#6F6A5F]">{row.description || '—'}</span> },
              { header: 'Created', cell: row => <span className="text-xs text-[#6F6A5F]">{formatDate(row.created_at)}</span> },
              { header: 'Actions', cell: row => writeMode ? (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => { const n = window.prompt('New snapshot name', row.name || ''); if (n) snapshotMutation.run(`/storage/snapshots/${row.id}`, 'PATCH', { name: n }, 'Renamed.'); }}>
                    Rename
                  </button>
                  <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete snapshot ${row.name || row.id}?`) && snapshotMutation.run(`/storage/snapshots/${row.id}`, 'DELETE', undefined, 'Snapshot deleted.')}>
                    Delete
                  </button>
                </div>
              ) : '—' },
            ]}
          />
        </Panel>

        {/* Volume types */}
        <Panel num="04.F" title="Volume types" eyebrow="Policy names" action={<Database className="h-5 w-5 text-[#DD2A1C]" />}>
          <DataTable
            rows={typeRows}
            columns={[
              { header: 'Name',        cell: row => <span className="font-display text-sm font-medium">{row.name || '—'}</span> },
              { header: 'Description', cell: row => row.description || '—' },
              { header: 'Public',      cell: row => statusCell(row.is_public ? 'enabled' : 'disabled') },
              { header: 'Extra specs', cell: row => <Mono>{JSON.stringify(row.extra_specs || {})}</Mono> },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
