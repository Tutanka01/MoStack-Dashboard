import { useState } from 'react';
import { Cpu, GitBranch, Key, Power, RotateCw, ServerCog, Square, Terminal } from 'lucide-react';
import { apiGet } from '../api/client';
import { useApi } from '../api/useApi';
import { CapacityBar } from '../components/CapacityBar';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Field, inputClass, OperationPanel, OperatorNotice, OperatorProps, SubmitButton, useMutation } from '../components/OperatorControls';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, formatAddresses, formatDate, statusCell } from './pageUtils';

const BTN = 'inline-flex items-center gap-1 border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition hover:border-[#DD2A1C] disabled:opacity-35 cursor-pointer';
const BTN_DANGER = 'inline-flex items-center gap-1 border border-[#DD2A1C]/30 bg-[#DD2A1C]/[0.06] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#DD2A1C] transition hover:bg-[#DD2A1C] hover:text-[#EFE9D9] disabled:opacity-35 cursor-pointer';
const BTN_CONFIRM = 'inline-flex items-center gap-1 border border-[#07683C]/40 bg-[#07683C]/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#07683C] transition hover:bg-[#07683C] hover:text-white disabled:opacity-35 cursor-pointer';

export default function ComputePage({ refreshKey, writeMode, canWrite, onMutated }: { refreshKey: number } & OperatorProps) {
  const servers    = useApi<AnyRecord>('/compute/servers', refreshKey);
  const hypervisors = useApi<AnyRecord>('/compute/hypervisors', refreshKey);
  const services   = useApi<AnyRecord>('/compute/services', refreshKey);
  const flavors    = useApi<AnyRecord>('/compute/flavors', refreshKey);
  const keypairs   = useApi<AnyRecord>('/compute/keypairs', refreshKey);
  const limits     = useApi<AnyRecord>('/compute/limits', refreshKey);
  const networks   = useApi<AnyRecord>('/network/networks', refreshKey);
  const volumes    = useApi<AnyRecord>('/storage/volumes', refreshKey);

  const createMutation   = useMutation(onMutated);
  const actionMutation   = useMutation(onMutated);
  const resizeMutation   = useMutation(onMutated);
  const snapshotMutation = useMutation(onMutated);
  const keypairMutation  = useMutation(onMutated);
  const flavorMutation   = useMutation(onMutated);
  const attachMutation   = useMutation(onMutated);

  const [resizeTarget,   setResizeTarget]   = useState<string | null>(null);
  const [resizeFlavor,   setResizeFlavor]   = useState('');
  const [snapshotTarget, setSnapshotTarget] = useState<string | null>(null);
  const [snapshotName,   setSnapshotName]   = useState('');
  const [attachTarget,   setAttachTarget]   = useState<string | null>(null);
  const [attachVolumeId, setAttachVolumeId] = useState('');
  const [consoleLogs,    setConsoleLogs]    = useState<Record<string, string>>({});

  if (servers.loading && hypervisors.loading && services.loading) return <LoadingBlock />;

  const serverRows  = apiItems<AnyRecord>(servers.data);
  const hyperRows   = apiItems<AnyRecord>(hypervisors.data);
  const serviceRows = apiItems<AnyRecord>(services.data);
  const flavorRows  = apiItems<AnyRecord>(flavors.data);
  const keypairRows = apiItems<AnyRecord>(keypairs.data);
  const networkRows = apiItems<AnyRecord>(networks.data);
  const volumeRows  = apiItems<AnyRecord>(volumes.data);
  const limitsData  = ((limits.data as AnyRecord)?.items ?? {}) as AnyRecord;

  function createServer(form: HTMLFormElement) {
    const d = new FormData(form);
    createMutation.run('/compute/servers', 'POST', {
      name:       String(d.get('name') || ''),
      image_id:   String(d.get('image_id') || ''),
      flavor_id:  String(d.get('flavor_id') || ''),
      network_id: String(d.get('network_id') || '') || undefined,
      key_name:   String(d.get('key_name') || '') || undefined,
    }, 'Server build requested.');
    form.reset();
  }

  function createKeypair(form: HTMLFormElement) {
    const d = new FormData(form);
    keypairMutation.run('/compute/keypairs', 'POST', {
      name:       String(d.get('name') || ''),
      public_key: String(d.get('public_key') || '') || undefined,
    }, 'Keypair created.');
    form.reset();
  }

  function createFlavor(form: HTMLFormElement) {
    const d = new FormData(form);
    flavorMutation.run('/compute/flavors', 'POST', {
      name:      String(d.get('name') || ''),
      vcpus:     Number(d.get('vcpus') || 1),
      ram:       Number(d.get('ram') || 512),
      disk:      Number(d.get('disk') || 10),
      is_public: d.get('is_public') === 'on',
    }, 'Flavor created.');
    form.reset();
  }

  async function fetchConsoleLog(serverId: string) {
    setConsoleLogs(prev => ({ ...prev, [serverId]: '⟳ Fetching…' }));
    try {
      const data = await apiGet<AnyRecord>(`/compute/servers/${serverId}/console-output?length=100`);
      const output = (data as AnyRecord)?.items?.output as string || 'No output available.';
      setConsoleLogs(prev => ({ ...prev, [serverId]: output }));
    } catch (err) {
      setConsoleLogs(prev => ({ ...prev, [serverId]: err instanceof Error ? err.message : 'Failed.' }));
    }
  }

  function confirmResize(serverId: string) {
    resizeMutation.run(`/compute/servers/${serverId}/resize`, 'POST', { flavor_id: resizeFlavor }, 'Resize requested — confirm or revert after verification.');
    setResizeTarget(null);
    setResizeFlavor('');
  }

  function confirmSnapshot(serverId: string) {
    snapshotMutation.run(`/compute/servers/${serverId}/snapshot`, 'POST', { name: snapshotName }, 'Snapshot image creation queued.');
    setSnapshotTarget(null);
    setSnapshotName('');
  }

  function confirmAttach(serverId: string) {
    attachMutation.run(`/compute/servers/${serverId}/volumes`, 'POST', { volume_id: attachVolumeId }, 'Volume attach requested.');
    setAttachTarget(null);
    setAttachVolumeId('');
  }

  const busy = actionMutation.busy || resizeMutation.busy || snapshotMutation.busy || attachMutation.busy;

  return (
    <>
      <PageTitle
        num="02"
        eyebrow="Nova"
        title="Compute fabric — where instances actually run."
        description="Instances, hypervisors, keypairs and Nova control services. Full lifecycle management: boot, resize, snapshot, pause, shelve."
        meta={[
          { label: 'Instances',   value: String(serverRows.length) },
          { label: 'Hypervisors', value: String(hyperRows.length) },
          { label: 'Keypairs',    value: String(keypairRows.length) },
        ]}
      />
      <ErrorNotice message={servers.error    || (servers.data?.error    as string)} />
      <ErrorNotice message={hypervisors.error || (hypervisors.data?.error as string)} />
      <OperatorNotice writeMode={writeMode} canWrite={canWrite} />

      <div className="grid gap-6 fade-up delay-1">

        {/* ── OPS PANEL ─────────────────────────────────────────────────── */}
        {writeMode && (
          <Panel num="02.OPS" title="Compute operator" eyebrow="Full Nova lifecycle management" variant="flag">
            <div className="grid gap-4 xl:grid-cols-2">

              {/* Boot instance */}
              <OperationPanel title="Boot instance" state={createMutation}>
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createServer(e.currentTarget); }}>
                  <Field label="Name">
                    <input name="name" required className={inputClass} placeholder="lab-vm-01" />
                  </Field>
                  <Field label="Image ID">
                    <input name="image_id" required className={inputClass} placeholder="Glance image UUID" />
                  </Field>
                  <Field label="Flavor">
                    <select name="flavor_id" required className={inputClass}>
                      <option value="">Select flavor</option>
                      {flavorRows.map(f => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
                    </select>
                  </Field>
                  <Field label="Network">
                    <select name="network_id" className={inputClass}>
                      <option value="">Nova auto-select</option>
                      {networkRows.map(n => <option key={n.id} value={n.id}>{n.name || n.id}</option>)}
                    </select>
                  </Field>
                  <Field label="Keypair">
                    <select name="key_name" className={inputClass}>
                      <option value="">None</option>
                      {keypairRows.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}
                    </select>
                  </Field>
                  <div className="self-end">
                    <SubmitButton disabled={!canWrite} busy={createMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Boot server</SubmitButton>
                  </div>
                </form>
              </OperationPanel>

              {/* Server lifecycle */}
              <OperationPanel title="Server lifecycle" state={actionMutation}>
                <div className="grid gap-3">
                  {serverRows.length === 0 && (
                    <p className="font-mono text-[10px] text-[#6F6A5F] uppercase tracking-[0.12em]">No instances.</p>
                  )}
                  {serverRows.map(server => (
                    <div key={server.id} className="border border-[#11100D]/10 bg-[#EFE9D9]/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-display text-sm font-medium">{server.name || server.id}</div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {statusCell(server.status)}
                            <Mono>{String(server.id).slice(0, 12)}</Mono>
                          </div>
                        </div>
                      </div>

                      {/* Primary actions */}
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {([
                          { action: 'start',    label: 'Start',         Icon: Power },
                          { action: 'stop',     label: 'Stop',          Icon: Square },
                          { action: 'reboot',   label: 'Reboot',        Icon: RotateCw },
                          { action: 'pause',    label: 'Pause',         Icon: Square },
                          { action: 'unpause',  label: 'Unpause',       Icon: Power },
                          { action: 'shelve',   label: 'Shelve',        Icon: Square },
                          { action: 'unshelve', label: 'Unshelve',      Icon: Power },
                        ] as const).map(({ action, label, Icon }) => (
                          <button key={action} type="button" disabled={!canWrite || busy} className={BTN}
                            onClick={() => actionMutation.run(`/compute/servers/${server.id}/action`, 'POST', { action }, `${label} requested.`)}>
                            <Icon className="h-3 w-3" />{label}
                          </button>
                        ))}
                      </div>

                      {/* Advanced actions */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Resize */}
                        {resizeTarget === server.id ? (
                          <div className="flex items-center gap-1.5">
                            <select value={resizeFlavor} onChange={e => setResizeFlavor(e.target.value)}
                              className="border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px]">
                              <option value="">Select flavor</option>
                              {flavorRows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <button type="button" disabled={!resizeFlavor || resizeMutation.busy} className={BTN_CONFIRM}
                              onClick={() => confirmResize(server.id)}>Confirm</button>
                            <button type="button" className={BTN} onClick={() => { setResizeTarget(null); setResizeFlavor(''); }}>✕</button>
                          </div>
                        ) : (
                          <button type="button" disabled={!canWrite || busy} className={BTN}
                            onClick={() => { setResizeTarget(server.id); setSnapshotTarget(null); setAttachTarget(null); }}>
                            Resize
                          </button>
                        )}

                        {/* Confirm / revert resize */}
                        <button type="button" disabled={!canWrite || busy} className={BTN_CONFIRM}
                          onClick={() => actionMutation.run(`/compute/servers/${server.id}/action`, 'POST', { action: 'confirm_resize' }, 'Resize confirmed.')}>
                          Confirm↑
                        </button>
                        <button type="button" disabled={!canWrite || busy} className={BTN}
                          onClick={() => actionMutation.run(`/compute/servers/${server.id}/action`, 'POST', { action: 'revert_resize' }, 'Resize reverted.')}>
                          Revert↩
                        </button>

                        {/* Snapshot */}
                        {snapshotTarget === server.id ? (
                          <div className="flex items-center gap-1.5">
                            <input value={snapshotName} onChange={e => setSnapshotName(e.target.value)}
                              className="border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px] w-28" placeholder="snapshot-name" />
                            <button type="button" disabled={!snapshotName || snapshotMutation.busy} className={BTN_CONFIRM}
                              onClick={() => confirmSnapshot(server.id)}>Snap</button>
                            <button type="button" className={BTN} onClick={() => { setSnapshotTarget(null); setSnapshotName(''); }}>✕</button>
                          </div>
                        ) : (
                          <button type="button" disabled={!canWrite || busy} className={BTN}
                            onClick={() => { setSnapshotTarget(server.id); setResizeTarget(null); setAttachTarget(null); }}>
                            Snapshot
                          </button>
                        )}

                        {/* Attach volume */}
                        {attachTarget === server.id ? (
                          <div className="flex items-center gap-1.5">
                            <select value={attachVolumeId} onChange={e => setAttachVolumeId(e.target.value)}
                              className="border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px]">
                              <option value="">Select volume</option>
                              {volumeRows.filter(v => !v.attachments?.length).map(v => (
                                <option key={v.id} value={v.id}>{v.name || v.id} ({v.size}GB)</option>
                              ))}
                            </select>
                            <button type="button" disabled={!attachVolumeId || attachMutation.busy} className={BTN_CONFIRM}
                              onClick={() => confirmAttach(server.id)}>Attach</button>
                            <button type="button" className={BTN} onClick={() => { setAttachTarget(null); setAttachVolumeId(''); }}>✕</button>
                          </div>
                        ) : (
                          <button type="button" disabled={!canWrite || busy} className={BTN}
                            onClick={() => { setAttachTarget(server.id); setResizeTarget(null); setSnapshotTarget(null); }}>
                            Attach vol
                          </button>
                        )}

                        {/* Console log */}
                        <button type="button" className={BTN}
                          onClick={() => consoleLogs[server.id] ? setConsoleLogs(p => { const n = {...p}; delete n[server.id]; return n; }) : fetchConsoleLog(server.id)}>
                          <Terminal className="h-3 w-3" />
                          {consoleLogs[server.id] ? 'Hide log' : 'Console'}
                        </button>

                        {/* Rename */}
                        <button type="button" disabled={!canWrite || busy} className={BTN}
                          onClick={() => { const n = window.prompt('New name', server.name || ''); if (n) actionMutation.run(`/compute/servers/${server.id}`, 'PATCH', { name: n }, 'Rename requested.'); }}>
                          Rename
                        </button>

                        {/* Delete */}
                        <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                          onClick={() => window.confirm(`Delete ${server.name || server.id}?`) && actionMutation.run(`/compute/servers/${server.id}`, 'DELETE', undefined, 'Delete requested.')}>
                          Delete
                        </button>
                      </div>

                      {/* Console log output */}
                      {consoleLogs[server.id] && (
                        <pre className="mt-3 max-h-40 overflow-y-auto bg-[#11100D] p-3 font-mono text-[10px] leading-5 text-[#EFE9D9] whitespace-pre-wrap">
                          {consoleLogs[server.id]}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </OperationPanel>

              {/* Keypairs */}
              <OperationPanel title="SSH keypairs" state={keypairMutation}>
                <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); createKeypair(e.currentTarget); }}>
                  <Field label="Name">
                    <input name="name" required className={inputClass} placeholder="my-key" />
                  </Field>
                  <Field label="Public key (optional)">
                    <input name="public_key" className={inputClass} placeholder="ssh-rsa AAAA… or leave empty to generate" />
                  </Field>
                  <div className="self-end">
                    <SubmitButton disabled={!canWrite} busy={keypairMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Add</SubmitButton>
                  </div>
                </form>
                {keypairRows.length > 0 && (
                  <div className="mt-3 grid gap-1">
                    {keypairRows.map(kp => (
                      <div key={kp.name} className="flex items-center justify-between gap-3 border-b border-[#11100D]/8 py-1.5 last:border-0">
                        <div className="flex items-center gap-2">
                          <Key className="h-3.5 w-3.5 text-[#6F6A5F]" />
                          <span className="font-mono text-xs">{kp.name}</span>
                          <span className="font-mono text-[10px] text-[#6F6A5F]">{kp.type || 'ssh'}</span>
                        </div>
                        <button type="button" disabled={!canWrite || keypairMutation.busy} className={BTN_DANGER}
                          onClick={() => window.confirm(`Delete keypair ${kp.name}?`) && keypairMutation.run(`/compute/keypairs/${kp.name}`, 'DELETE', undefined, 'Keypair deleted.')}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </OperationPanel>

              {/* Flavor manager */}
              <OperationPanel title="Flavor manager" state={flavorMutation}>
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createFlavor(e.currentTarget); }}>
                  <Field label="Name">
                    <input name="name" required className={inputClass} placeholder="m1.custom" />
                  </Field>
                  <Field label="vCPUs">
                    <input name="vcpus" type="number" min={1} defaultValue={1} required className={inputClass} />
                  </Field>
                  <Field label="RAM (MB)">
                    <input name="ram" type="number" min={128} defaultValue={512} required className={inputClass} />
                  </Field>
                  <Field label="Disk (GB)">
                    <input name="disk" type="number" min={0} defaultValue={10} required className={inputClass} />
                  </Field>
                  <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                    <input name="is_public" type="checkbox" defaultChecked /> Public
                  </label>
                  <div className="self-end">
                    <SubmitButton disabled={!canWrite} busy={flavorMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Create flavor</SubmitButton>
                  </div>
                </form>
                <div className="mt-3 grid gap-1 max-h-36 overflow-y-auto">
                  {flavorRows.map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-2 border-b border-[#11100D]/8 py-1 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium">{f.name || f.id}</span>
                        <Mono>{f.vcpus}vCPU / {f.ram}MB / {f.disk}GB</Mono>
                      </div>
                      <button type="button" disabled={!canWrite || flavorMutation.busy} className={BTN_DANGER}
                        onClick={() => window.confirm(`Delete flavor ${f.name}?`) && flavorMutation.run(`/compute/flavors/${f.id}`, 'DELETE', undefined, 'Flavor deleted.')}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </OperationPanel>

            </div>
          </Panel>
        )}

        {/* ── INSTANCES TABLE ──────────────────────────────────────────── */}
        <Panel num="02.A" title="Instances" eyebrow="Nova servers — live" variant="flag">
          <DataTable
            rows={serverRows}
            columns={[
              { header: 'Name', cell: row => <span className="font-display text-base font-medium">{row.name || '—'}</span> },
              { header: 'Status', cell: row => statusCell(row.status) },
              { header: 'Flavor', cell: row => <Mono>{row.flavor || '—'}</Mono> },
              { header: 'Image', cell: row => <Mono>{String(row.image || '—').slice(0, 12)}</Mono> },
              { header: 'IPs', cell: row => <span className="font-mono text-xs text-[#2A2722]">{formatAddresses(row.addresses)}</span> },
              { header: 'Keypair', cell: row => row.key_name ? <Mono>{row.key_name}</Mono> : '—' },
              { header: 'Host', cell: row => <Mono>{row.host || '—'}</Mono> },
              { header: 'Created', cell: row => <span className="text-xs text-[#6F6A5F]">{formatDate(row.created_at)}</span> },
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          {/* ── HYPERVISORS ─────────────────────────────────────────────── */}
          <Panel num="02.B" title="Hypervisors" eyebrow="Resource providers — capacity">
            <DataTable
              rows={hyperRows}
              columns={[
                { header: 'Hostname', cell: row => <span className="font-display text-sm font-medium">{row.hostname || '—'}</span> },
                { header: 'State', cell: row => statusCell(row.state) },
                { header: 'vCPU', cell: row => <CapacityBar used={row.vcpus_used} total={row.vcpus} unit="" tone="ink" /> },
                { header: 'RAM', cell: row => <CapacityBar used={row.memory_mb_used} total={row.memory_mb} unit="MB" tone="klein" /> },
                { header: 'Disk', cell: row => <CapacityBar used={row.local_gb_used} total={row.local_gb} unit="GB" tone="amber" /> },
                { header: 'VMs', cell: row => <span className="font-mono tabular text-sm">{row.running_vms ?? '—'}</span> },
              ]}
            />
          </Panel>

          {/* ── NOVA SERVICES ───────────────────────────────────────────── */}
          <Panel num="02.C" title="Nova services" eyebrow="Control daemons">
            <DataTable
              rows={serviceRows}
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

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {/* ── KEYPAIRS TABLE ──────────────────────────────────────────── */}
          <Panel num="02.E" title="Keypairs" eyebrow="SSH access credentials" action={<Key className="h-5 w-5 text-[#1535C7]" />}>
            <DataTable
              rows={keypairRows}
              columns={[
                { header: 'Name',        cell: row => <span className="font-display text-sm font-medium">{row.name || '—'}</span> },
                { header: 'Type',        cell: row => <Mono>{row.type || 'ssh'}</Mono> },
                { header: 'Fingerprint', cell: row => <Mono>{String(row.fingerprint || '—').slice(0, 24)}…</Mono> },
                { header: 'Actions', cell: row => writeMode ? (
                  <button type="button" disabled={!canWrite || keypairMutation.busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete keypair ${row.name}?`) && keypairMutation.run(`/compute/keypairs/${row.name}`, 'DELETE', undefined, 'Keypair deleted.')}>
                    Delete
                  </button>
                ) : '—' },
              ]}
            />
          </Panel>

          {/* ── COMPUTE LIMITS ──────────────────────────────────────────── */}
          <Panel num="02.F" title="Project quotas" eyebrow="Nova absolute limits">
            <dl className="grid gap-0 text-sm">
              {[
                ['Max instances',     limitsData.maxTotalInstances],
                ['Max vCPUs',         limitsData.maxTotalCores],
                ['Max RAM (MB)',       limitsData.maxTotalRAMSize],
                ['Instances used',    limitsData.totalInstancesUsed],
                ['vCPUs used',        limitsData.totalCoresUsed],
                ['RAM used (MB)',      limitsData.totalRAMUsed],
                ['Max key pairs',     limitsData.maxTotalKeypairs],
                ['Max security grps', limitsData.maxSecurityGroups],
              ].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-[#11100D]/10 py-2 last:border-0">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{k}</dt>
                  <dd className="font-mono tabular text-sm text-[#11100D]">{v != null ? String(v) : '—'}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        {/* ── NOVA CONTROL FLOW ───────────────────────────────────────────── */}
        <Panel num="02.D" title="Nova control flow" eyebrow="Pedagogical model" variant="klein">
          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-4">
            {[
              { name: 'nova-api',       detail: 'Receives REST calls and validates Keystone tokens before anything else.', Icon: ServerCog, code: 'A' },
              { name: 'nova-scheduler', detail: 'Picks the right compute host using Placement inventory and filters.',       Icon: GitBranch, code: 'B' },
              { name: 'nova-conductor', detail: 'Mediates database operations away from compute nodes for security.',         Icon: Cpu,       code: 'C' },
              { name: 'nova-compute',   detail: 'Runs the instance through libvirt/QEMU on the chosen hypervisor.',           Icon: ServerCog, code: 'D' },
            ].map(({ name, detail, Icon, code }, idx) => (
              <div key={name} className="bg-[#F7F2E2] p-5 relative">
                <span className="absolute right-4 top-3 font-mono text-[10px] text-[#6F6A5F] tabular">{code}.{String(idx + 1).padStart(2, '0')}</span>
                <Icon className="mb-6 h-5 w-5 text-[#1535C7]" />
                <h3 className="font-display text-lg font-medium text-[#11100D] tracking-tight">{name}</h3>
                <div className="mt-1 mb-3 h-px w-8 bg-[#1535C7]" />
                <p className="text-sm leading-6 text-[#2A2722]">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
