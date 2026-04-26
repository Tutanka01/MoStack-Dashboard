import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Field, inputClass, OperationPanel, OperatorNotice, OperatorProps, SubmitButton, useMutation } from '../components/OperatorControls';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, formatBytes, formatDate, statusCell } from './pageUtils';

const BTN = 'inline-flex items-center gap-1.5 border border-[#11100D]/20 bg-[#F7F2E2] px-2.5 py-1.5 font-mono text-xs uppercase tracking-[0.06em] transition hover:border-[#DD2A1C] disabled:opacity-35 cursor-pointer';
const BTN_DANGER = 'inline-flex items-center gap-1.5 border border-[#DD2A1C]/30 bg-[#DD2A1C]/[0.06] px-2.5 py-1.5 font-mono text-xs uppercase tracking-[0.06em] text-[#DD2A1C] transition hover:bg-[#DD2A1C] hover:text-[#EFE9D9] disabled:opacity-35 cursor-pointer';

const FAMILY_TONES: Record<string, string> = {
  CirrOS:              'is-flag',
  'Ubuntu cloud image':'is-klein',
  'Debian cloud image':'is-leaf',
  'Other image':       '',
};

function family(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('cirros'))  return 'CirrOS';
  if (lower.includes('ubuntu'))  return 'Ubuntu cloud image';
  if (lower.includes('debian'))  return 'Debian cloud image';
  return 'Other image';
}

export default function ImagesPage({ refreshKey, writeMode, canWrite, onMutated }: { refreshKey: number } & OperatorProps) {
  const images = useApi<AnyRecord>('/images', refreshKey);

  const imageMutation  = useMutation(onMutated);
  const importMutation = useMutation(onMutated);
  const actionMutation = useMutation(onMutated);

  // Two-step import: user creates metadata first, then selects the queued image + URL
  const [importImageId, setImportImageId] = useState('');
  const [importUrl,     setImportUrl]     = useState('');

  if (images.loading && !images.data) return <LoadingBlock />;

  const rows = apiItems<AnyRecord>(images.data);
  const queuedImages = rows.filter(r => r.status === 'queued');

  const busy = imageMutation.busy || importMutation.busy || actionMutation.busy;

  function createImage(form: HTMLFormElement) {
    const d = new FormData(form);
    imageMutation.run('/images', 'POST', {
      name:             String(d.get('name') || ''),
      disk_format:      String(d.get('disk_format') || 'qcow2'),
      container_format: String(d.get('container_format') || 'bare'),
      visibility:       String(d.get('visibility') || 'private'),
    }, 'Image metadata created — it will appear in queued state. Use the import panel to upload data.');
    form.reset();
  }

  function triggerImport() {
    if (!importImageId || !importUrl) return;
    importMutation.run(`/images/${importImageId}/import`, 'POST', { url: importUrl }, 'Web-download import queued. Glance will fetch the image data.');
    setImportImageId('');
    setImportUrl('');
  }

  const families = rows.reduce<Record<string, number>>((acc, r) => {
    const key = family(r.name);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageTitle
        num="05"
        eyebrow="Glance"
        title="Images"
        description="Glance image catalog, import queue, visibility and image lifecycle."
        meta={[
          { label: 'Images',   value: String(rows.length) },
          { label: 'Families', value: String(Object.keys(families).length) },
          { label: 'Queued',   value: String(queuedImages.length) },
        ]}
      />
      <ErrorNotice message={images.error || (images.data?.error as string)} />
      <OperatorNotice writeMode={writeMode} canWrite={canWrite} />

      {/* ── OPS PANEL ─────────────────────────────────────────────── */}
      {writeMode && (
        <Panel num="05.OPS" title="Image operator" eyebrow="Register metadata, import from URL, manage lifecycle" variant="flag">
          <div className="grid gap-4 xl:grid-cols-2">

            {/* Register metadata */}
            <OperationPanel title="Register image metadata" state={imageMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createImage(e.currentTarget); }}>
                <Field label="Name"><input name="name" required className={inputClass} placeholder="ubuntu-24.04" /></Field>
                <Field label="Disk format">
                  <select name="disk_format" className={inputClass} defaultValue="qcow2">
                    <option value="qcow2">qcow2</option>
                    <option value="raw">raw</option>
                    <option value="vmdk">vmdk</option>
                    <option value="vhd">vhd</option>
                    <option value="iso">iso</option>
                    <option value="aki">aki</option>
                    <option value="ari">ari</option>
                    <option value="ami">ami</option>
                  </select>
                </Field>
                <Field label="Container format">
                  <select name="container_format" className={inputClass} defaultValue="bare">
                    <option value="bare">bare</option>
                    <option value="ovf">ovf</option>
                    <option value="aki">aki</option>
                    <option value="ari">ari</option>
                    <option value="ami">ami</option>
                  </select>
                </Field>
                <Field label="Visibility">
                  <select name="visibility" className={inputClass} defaultValue="private">
                    <option value="private">private</option>
                    <option value="public">public</option>
                    <option value="shared">shared</option>
                    <option value="community">community</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <SubmitButton disabled={!canWrite} busy={imageMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Register metadata</SubmitButton>
                </div>
              </form>
            </OperationPanel>

            {/* Import from URL */}
            <OperationPanel title="Import from URL (web-download)" state={importMutation}>
              <p className="mb-3 font-mono text-[10px] text-[#6F6A5F] uppercase tracking-[0.12em]">
                Select a queued image, then provide a public HTTPS URL. Glance will download the image data directly.
              </p>
              <div className="grid gap-3">
                <Field label="Queued image">
                  <select value={importImageId} onChange={e => setImportImageId(e.target.value)} className={inputClass}>
                    <option value="">Select queued image</option>
                    {queuedImages.map(img => (
                      <option key={img.id} value={img.id}>{img.name || img.id}</option>
                    ))}
                  </select>
                </Field>
                {queuedImages.length === 0 && (
                  <p className="font-mono text-[10px] text-[#B36B00] uppercase tracking-[0.12em]">
                    No queued images. Register metadata first (it will appear in queued state).
                  </p>
                )}
                <Field label="Image URL">
                  <input
                    value={importUrl} onChange={e => setImportUrl(e.target.value)}
                    className={inputClass}
                    placeholder="https://cloud-images.ubuntu.com/…/focal-server-cloudimg-amd64.img"
                  />
                </Field>
                <div>
                  <button
                    type="button"
                    disabled={!canWrite || !importImageId || !importUrl || importMutation.busy}
                    onClick={triggerImport}
                    className="inline-flex items-center justify-center gap-2 border border-[#11100D] bg-[#11100D] px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#EFE9D9] transition hover:border-[#DD2A1C] hover:bg-[#DD2A1C] disabled:cursor-not-allowed disabled:border-[#11100D]/20 disabled:bg-[#11100D]/20"
                  >
                    Start import
                  </button>
                </div>
              </div>
            </OperationPanel>
          </div>
        </Panel>
      )}

      {/* ── FAMILY DISTRIBUTION ───────────────────────────────────── */}
      <div className="mb-6 grid gap-px bg-[#11100D]/12 sm:grid-cols-4 fade-up delay-1">
        {Object.entries(families).map(([fam, count]) => (
          <div key={fam} className="bg-[#F7F2E2] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F]">Family</div>
            <div className="font-display text-2xl font-medium mt-1 tracking-tight">{fam}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-display tabular text-3xl font-medium">{count}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F]">{count === 1 ? 'image' : 'images'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 fade-up delay-2">
        {/* ── IMAGE CATALOGUE ─────────────────────────────────────── */}
        <Panel num="05.A" title="Image catalogue" eyebrow={`${rows.length} images observed`} action={<ImageIcon className="h-5 w-5 text-[#1535C7]" />}>
          <DataTable
            rows={rows}
            columns={[
              { header: 'Name', cell: row => <span className="font-display text-sm font-medium">{row.name || <Mono>{String(row.id).slice(0, 12)}</Mono>}</span> },
              { header: 'Family', cell: row => {
                const f = family(row.name);
                return <span className={`meta-pill ${FAMILY_TONES[f] || ''}`}>{f}</span>;
              } },
              { header: 'Status', cell: row => statusCell(row.status) },
              { header: 'Disk',    cell: row => <Mono>{row.disk_format      || '—'}</Mono> },
              { header: 'Container',cell: row => <Mono>{row.container_format || '—'}</Mono> },
              { header: 'Size',    cell: row => <span className="font-mono tabular text-sm">{formatBytes(row.size)}</span>, align: 'right' },
              { header: 'Visibility', cell: row => statusCell(row.visibility === 'public' ? 'enabled' : 'disabled') },
              { header: 'Created', cell: row => <span className="text-xs text-[#6F6A5F]">{formatDate(row.created_at)}</span> },
              { header: 'Actions', cell: row => writeMode ? (
                <div className="flex flex-wrap gap-1.5">
                  {/* Rename */}
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => { const n = window.prompt('New name', row.name || ''); if (n) actionMutation.run(`/images/${row.id}`, 'PATCH', { name: n }, 'Renamed.'); }}>
                    Rename
                  </button>
                  {/* Visibility toggle */}
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => actionMutation.run(`/images/${row.id}`, 'PATCH', { visibility: row.visibility === 'public' ? 'private' : 'public' }, 'Visibility updated.')}>
                    {row.visibility === 'public' ? 'Make private' : 'Make public'}
                  </button>
                  {/* Deactivate / reactivate */}
                  {row.status === 'active' ? (
                    <button type="button" disabled={!canWrite || busy} className={BTN}
                      onClick={() => actionMutation.run(`/images/${row.id}/deactivate`, 'POST', undefined, 'Image deactivated.')}>
                      Deactivate
                    </button>
                  ) : row.status === 'deactivated' ? (
                    <button type="button" disabled={!canWrite || busy} className={BTN}
                      onClick={() => actionMutation.run(`/images/${row.id}/reactivate`, 'POST', undefined, 'Image reactivated.')}>
                      Reactivate
                    </button>
                  ) : null}
                  {/* Delete */}
                  <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete image ${row.name || row.id}?`) && actionMutation.run(`/images/${row.id}`, 'DELETE', undefined, 'Delete requested.')}>
                    Delete
                  </button>
                </div>
              ) : '—' },
            ]}
          />
        </Panel>

        {/* ── GLANCE ROLE ─────────────────────────────────────────── */}
      </div>
    </>
  );
}
