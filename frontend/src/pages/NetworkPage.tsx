import { useState } from 'react';
import { Cable, Network, Route, Shield } from 'lucide-react';
import { useApi } from '../api/useApi';
import { DataTable } from '../components/DataTable';
import { ErrorNotice } from '../components/ErrorNotice';
import { LoadingBlock } from '../components/LoadingBlock';
import { Field, inputClass, OperationPanel, OperatorNotice, OperatorProps, SubmitButton, useMutation } from '../components/OperatorControls';
import { Panel } from '../components/Panel';
import { AnyRecord, Mono, PageTitle, apiItems, statusCell } from './pageUtils';

const BTN = 'inline-flex items-center gap-1 border border-[#11100D]/20 bg-[#F7F2E2] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition hover:border-[#DD2A1C] disabled:opacity-35 cursor-pointer';
const BTN_DANGER = 'inline-flex items-center gap-1 border border-[#DD2A1C]/30 bg-[#DD2A1C]/[0.06] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#DD2A1C] transition hover:bg-[#DD2A1C] hover:text-[#EFE9D9] disabled:opacity-35 cursor-pointer';
const BTN_CONFIRM = 'inline-flex items-center gap-1 border border-[#07683C]/40 bg-[#07683C]/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#07683C] transition hover:bg-[#07683C] hover:text-white disabled:opacity-35 cursor-pointer';

export default function NetworkPage({ refreshKey, writeMode, canWrite, onMutated }: { refreshKey: number } & OperatorProps) {
  const networks      = useApi<AnyRecord>('/network/networks', refreshKey);
  const subnets       = useApi<AnyRecord>('/network/subnets', refreshKey);
  const ports         = useApi<AnyRecord>('/network/ports', refreshKey);
  const agents        = useApi<AnyRecord>('/network/agents', refreshKey);
  const routers       = useApi<AnyRecord>('/network/routers', refreshKey);
  const floatingips   = useApi<AnyRecord>('/network/floatingips', refreshKey);
  const secgroups     = useApi<AnyRecord>('/network/security-groups', refreshKey);
  const sgrules       = useApi<AnyRecord>('/network/security-group-rules', refreshKey);

  const networkMutation  = useMutation(onMutated);
  const subnetMutation   = useMutation(onMutated);
  const routerMutation   = useMutation(onMutated);
  const floatMutation    = useMutation(onMutated);
  const sgMutation       = useMutation(onMutated);
  const sgRuleMutation   = useMutation(onMutated);
  const portMutation     = useMutation(onMutated);

  // Router interface inline state
  const [ifaceRouter,  setIfaceRouter]  = useState('');
  const [ifaceSubnet,  setIfaceSubnet]  = useState('');
  const [ifaceRemoveRouter, setIfaceRemoveRouter] = useState('');
  const [ifaceRemoveSubnet, setIfaceRemoveSubnet] = useState('');

  // Floating IP associate inline state
  const [assocFip,  setAssocFip]  = useState('');
  const [assocPort, setAssocPort] = useState('');

  if (networks.loading && subnets.loading && routers.loading) return <LoadingBlock />;

  const networkRows = apiItems<AnyRecord>(networks.data);
  const subnetRows  = apiItems<AnyRecord>(subnets.data);
  const portRows    = apiItems<AnyRecord>(ports.data);
  const agentRows   = apiItems<AnyRecord>(agents.data);
  const routerRows  = apiItems<AnyRecord>(routers.data);
  const fipRows     = apiItems<AnyRecord>(floatingips.data);
  const sgRows      = apiItems<AnyRecord>(secgroups.data);
  const sgRuleRows  = apiItems<AnyRecord>(sgrules.data);

  // Only list ports attached to a compute instance (for floating IP association)
  const computePorts = portRows.filter(p => p.device_owner?.startsWith('compute:'));

  // External (provider) networks
  const externalNetworks = networkRows.filter(n => n['router:external']);

  function createNetwork(form: HTMLFormElement) {
    const d = new FormData(form);
    networkMutation.run('/network/networks', 'POST', {
      name: String(d.get('name') || ''),
      admin_state_up: d.get('admin_state_up') === 'on',
      shared: d.get('shared') === 'on',
    }, 'Network created.');
    form.reset();
  }

  function createSubnet(form: HTMLFormElement) {
    const d = new FormData(form);
    subnetMutation.run('/network/subnets', 'POST', {
      network_id:  String(d.get('network_id') || ''),
      name:        String(d.get('name') || ''),
      cidr:        String(d.get('cidr') || ''),
      gateway_ip:  String(d.get('gateway_ip') || '') || undefined,
      enable_dhcp: d.get('enable_dhcp') === 'on',
    }, 'Subnet created.');
    form.reset();
  }

  function createRouter(form: HTMLFormElement) {
    const d = new FormData(form);
    routerMutation.run('/network/routers', 'POST', {
      name:                String(d.get('name') || ''),
      admin_state_up:      d.get('admin_state_up') === 'on',
      external_network_id: String(d.get('external_network_id') || '') || undefined,
    }, 'Router created.');
    form.reset();
  }

  function allocateFloatingIP(form: HTMLFormElement) {
    const d = new FormData(form);
    floatMutation.run('/network/floatingips', 'POST', {
      floating_network_id: String(d.get('floating_network_id') || ''),
    }, 'Floating IP allocated.');
    form.reset();
  }

  function createSecurityGroup(form: HTMLFormElement) {
    const d = new FormData(form);
    sgMutation.run('/network/security-groups', 'POST', {
      name:        String(d.get('name') || ''),
      description: String(d.get('description') || ''),
    }, 'Security group created.');
    form.reset();
  }

  function createSGRule(form: HTMLFormElement) {
    const d = new FormData(form);
    const min = d.get('port_range_min') ? Number(d.get('port_range_min')) : undefined;
    const max = d.get('port_range_max') ? Number(d.get('port_range_max')) : undefined;
    sgRuleMutation.run('/network/security-group-rules', 'POST', {
      security_group_id: String(d.get('security_group_id') || ''),
      direction:         String(d.get('direction') || 'ingress'),
      ethertype:         String(d.get('ethertype') || 'IPv4'),
      protocol:          String(d.get('protocol') || '') || undefined,
      port_range_min:    min,
      port_range_max:    max,
      remote_ip_prefix:  String(d.get('remote_ip_prefix') || '') || undefined,
    }, 'Rule added.');
    form.reset();
  }

  const busy = networkMutation.busy || subnetMutation.busy || routerMutation.busy || floatMutation.busy || sgMutation.busy || sgRuleMutation.busy || portMutation.busy;

  return (
    <>
      <PageTitle
        num="03"
        eyebrow="Neutron"
        title="Network plane — wires, routers, security."
        description="Full Neutron management: networks, subnets, routers with gateway, floating IPs, security groups with rules, and ports."
        meta={[
          { label: 'Networks',  value: String(networkRows.length) },
          { label: 'Routers',   value: String(routerRows.length) },
          { label: 'Float IPs', value: String(fipRows.length) },
          { label: 'Sec grps',  value: String(sgRows.length) },
        ]}
      />
      {[networks, subnets, ports, agents, routers, floatingips, secgroups].map((s, i) => (
        <ErrorNotice key={i} message={s.error || (s.data?.error as string)} />
      ))}
      <OperatorNotice writeMode={writeMode} canWrite={canWrite} />

      {/* ── OPS PANEL ───────────────────────────────────────────────────── */}
      {writeMode && (
        <Panel num="03.OPS" title="Network operator" eyebrow="Create and manage Neutron resources" variant="flag">
          <div className="grid gap-4 xl:grid-cols-2">

            {/* Create network */}
            <OperationPanel title="Create network" state={networkMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createNetwork(e.currentTarget); }}>
                <Field label="Name"><input name="name" required className={inputClass} placeholder="tenant-net" /></Field>
                <div className="flex flex-col gap-2 pt-5">
                  <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                    <input name="admin_state_up" type="checkbox" defaultChecked /> Admin up
                  </label>
                  <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                    <input name="shared" type="checkbox" /> Shared
                  </label>
                </div>
                <div><SubmitButton disabled={!canWrite} busy={networkMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Create network</SubmitButton></div>
              </form>
            </OperationPanel>

            {/* Create subnet */}
            <OperationPanel title="Create subnet" state={subnetMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createSubnet(e.currentTarget); }}>
                <Field label="Network">
                  <select name="network_id" required className={inputClass}>
                    <option value="">Select network</option>
                    {networkRows.map(n => <option key={n.id} value={n.id}>{n.name || n.id}</option>)}
                  </select>
                </Field>
                <Field label="Name"><input name="name" required className={inputClass} placeholder="tenant-subnet" /></Field>
                <Field label="CIDR"><input name="cidr" required className={inputClass} placeholder="192.168.20.0/24" /></Field>
                <Field label="Gateway"><input name="gateway_ip" className={inputClass} placeholder="192.168.20.1" /></Field>
                <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <input name="enable_dhcp" type="checkbox" defaultChecked /> DHCP
                </label>
                <div><SubmitButton disabled={!canWrite} busy={subnetMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Create subnet</SubmitButton></div>
              </form>
            </OperationPanel>

            {/* Create router */}
            <OperationPanel title="Create router" state={routerMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createRouter(e.currentTarget); }}>
                <Field label="Name"><input name="name" required className={inputClass} placeholder="tenant-router" /></Field>
                <Field label="External gateway (optional)">
                  <select name="external_network_id" className={inputClass}>
                    <option value="">No gateway</option>
                    {externalNetworks.map(n => <option key={n.id} value={n.id}>{n.name || n.id}</option>)}
                    {/* Fallback: list all networks */}
                    {externalNetworks.length === 0 && networkRows.map(n => <option key={n.id} value={n.id}>{n.name || n.id}</option>)}
                  </select>
                </Field>
                <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] self-end">
                  <input name="admin_state_up" type="checkbox" defaultChecked /> Admin up
                </label>
                <div className="self-end"><SubmitButton disabled={!canWrite} busy={routerMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Create router</SubmitButton></div>
              </form>
              {/* Interface management */}
              <div className="mt-4 border-t border-[#11100D]/10 pt-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">Add / remove interface</div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <select value={ifaceRouter} onChange={e => setIfaceRouter(e.target.value)} className={inputClass}>
                    <option value="">Router</option>
                    {routerRows.map(r => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
                  </select>
                  <select value={ifaceSubnet} onChange={e => setIfaceSubnet(e.target.value)} className={inputClass}>
                    <option value="">Subnet</option>
                    {subnetRows.map(s => <option key={s.id} value={s.id}>{s.name || s.cidr}</option>)}
                  </select>
                  <button type="button" disabled={!canWrite || !ifaceRouter || !ifaceSubnet || routerMutation.busy} className={BTN_CONFIRM}
                    onClick={() => { routerMutation.run(`/network/routers/${ifaceRouter}/add_interface`, 'POST', { subnet_id: ifaceSubnet }, 'Interface added.'); setIfaceRouter(''); setIfaceSubnet(''); }}>
                    Add
                  </button>
                  <button type="button" disabled={!canWrite || !ifaceRouter || !ifaceSubnet || routerMutation.busy} className={BTN_DANGER}
                    onClick={() => { routerMutation.run(`/network/routers/${ifaceRouter}/remove_interface`, 'POST', { subnet_id: ifaceSubnet }, 'Interface removed.'); setIfaceRouter(''); setIfaceSubnet(''); }}>
                    Remove
                  </button>
                </div>
              </div>
            </OperationPanel>

            {/* Floating IPs */}
            <OperationPanel title="Floating IPs" state={floatMutation}>
              <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={(e) => { e.preventDefault(); allocateFloatingIP(e.currentTarget); }}>
                <Field label="External network">
                  <select name="floating_network_id" required className={inputClass}>
                    <option value="">Select network</option>
                    {externalNetworks.map(n => <option key={n.id} value={n.id}>{n.name || n.id}</option>)}
                    {externalNetworks.length === 0 && networkRows.map(n => <option key={n.id} value={n.id}>{n.name || n.id}</option>)}
                  </select>
                </Field>
                <div className="self-end"><SubmitButton disabled={!canWrite} busy={floatMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Allocate</SubmitButton></div>
              </form>
              {/* Associate / disassociate */}
              <div className="mt-4 border-t border-[#11100D]/10 pt-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">Associate to port</div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <select value={assocFip} onChange={e => setAssocFip(e.target.value)} className={inputClass}>
                    <option value="">Floating IP</option>
                    {fipRows.map(f => <option key={f.id} value={f.id}>{f.floating_ip_address}</option>)}
                  </select>
                  <select value={assocPort} onChange={e => setAssocPort(e.target.value)} className={inputClass}>
                    <option value="">VM Port</option>
                    {computePorts.map(p => (
                      <option key={p.id} value={p.id}>
                        {(p.fixed_ips?.[0]?.ip_address) || p.id?.slice(0, 12)}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={!canWrite || !assocFip || !assocPort || floatMutation.busy} className={BTN_CONFIRM}
                    onClick={() => { floatMutation.run(`/network/floatingips/${assocFip}`, 'PATCH', { port_id: assocPort }, 'Associated.'); setAssocFip(''); setAssocPort(''); }}>
                    Associate
                  </button>
                  <button type="button" disabled={!canWrite || !assocFip || floatMutation.busy} className={BTN_DANGER}
                    onClick={() => { floatMutation.run(`/network/floatingips/${assocFip}`, 'PATCH', { port_id: null }, 'Disassociated.'); setAssocFip(''); setAssocPort(''); }}>
                    Release
                  </button>
                </div>
              </div>
            </OperationPanel>

            {/* Security groups */}
            <OperationPanel title="Security groups" state={sgMutation}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); createSecurityGroup(e.currentTarget); }}>
                <Field label="Name"><input name="name" required className={inputClass} placeholder="web-sg" /></Field>
                <Field label="Description"><input name="description" className={inputClass} placeholder="HTTP + HTTPS access" /></Field>
                <div><SubmitButton disabled={!canWrite} busy={sgMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Create group</SubmitButton></div>
              </form>
            </OperationPanel>

            {/* Security group rules */}
            <OperationPanel title="Add security group rule" state={sgRuleMutation}>
              <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); createSGRule(e.currentTarget); }}>
                <Field label="Security group">
                  <select name="security_group_id" required className={inputClass}>
                    <option value="">Select group</option>
                    {sgRows.map(sg => <option key={sg.id} value={sg.id}>{sg.name || sg.id}</option>)}
                  </select>
                </Field>
                <Field label="Direction">
                  <select name="direction" className={inputClass} defaultValue="ingress">
                    <option value="ingress">ingress</option>
                    <option value="egress">egress</option>
                  </select>
                </Field>
                <Field label="Ethertype">
                  <select name="ethertype" className={inputClass} defaultValue="IPv4">
                    <option value="IPv4">IPv4</option>
                    <option value="IPv6">IPv6</option>
                  </select>
                </Field>
                <Field label="Protocol">
                  <select name="protocol" className={inputClass}>
                    <option value="">Any</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                  </select>
                </Field>
                <Field label="Port min"><input name="port_range_min" type="number" min={1} max={65535} className={inputClass} placeholder="22" /></Field>
                <Field label="Port max"><input name="port_range_max" type="number" min={1} max={65535} className={inputClass} placeholder="22" /></Field>
                <div className="sm:col-span-2">
                  <Field label="Remote CIDR"><input name="remote_ip_prefix" className={inputClass} placeholder="0.0.0.0/0" /></Field>
                </div>
                <div className="self-end"><SubmitButton disabled={!canWrite} busy={sgRuleMutation.busy} icon={canWrite ? 'plus' : 'lock'}>Add rule</SubmitButton></div>
              </form>
            </OperationPanel>

          </div>
        </Panel>
      )}

      {/* ── PROVIDER NETWORK + LOGICAL PATH ─────────────────────────── */}
      <div className="mb-6 grid gap-6 xl:grid-cols-[400px_1fr] fade-up delay-1">
        <Panel num="03.A" title="Provider network" eyebrow="Flat external segment" variant="flag">
          <dl className="grid gap-0 text-sm">
            {[
              ['Subnet',              '10.3.16.0/23'],
              ['Provider interface',  'ens19'],
              ['OVS mapping',         'provider:br-provider'],
              ['Integration bridge',  'br-int'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-[#11100D]/10 py-2.5 last:border-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">{k}</dt>
                <dd><Mono>{v}</Mono></dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel num="03.B" title="Logical path" eyebrow="Provider network → VM tap">
          <div className="grid gap-px bg-[#11100D]/12 md:grid-cols-4">
            {['Provider network', 'br-provider', 'br-int / OVS port', 'VM tap interface'].map((item, i) => (
              <div key={item} className="bg-[#F7F2E2] p-4 relative">
                <div className="mb-5 flex h-8 w-8 items-center justify-center bg-[#11100D] text-[#EFE9D9] font-mono text-sm">{i + 1}</div>
                <div className="font-display text-sm font-medium leading-tight">{item}</div>
                <div className="mt-2 h-px w-6 bg-[#DD2A1C]" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── TABLES ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 fade-up delay-2">

        {/* Networks */}
        <Panel num="03.C" title="Networks" eyebrow="Neutron networks" action={<Network className="h-5 w-5 text-[#1535C7]" />}>
          <DataTable
            rows={networkRows}
            columns={[
              { header: 'Name', cell: row => <span className="font-display text-sm font-medium">{row.name || '—'}</span> },
              { header: 'Status', cell: row => statusCell(row.status) },
              { header: 'Provider type', cell: row => <span className="meta-pill">{row['provider:network_type'] || '—'}</span> },
              { header: 'Physical net', cell: row => <Mono>{row['provider:physical_network'] || '—'}</Mono> },
              { header: 'External', cell: row => statusCell(row['router:external'] ? 'enabled' : 'disabled') },
              { header: 'Shared', cell: row => statusCell(row.shared ? 'enabled' : 'disabled') },
              { header: 'Admin', cell: row => statusCell(row.admin_state_up) },
              { header: 'Actions', cell: row => writeMode ? (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => { const n = window.prompt('New name', row.name || ''); if (n) networkMutation.run(`/network/networks/${row.id}`, 'PATCH', { name: n }, 'Renamed.'); }}>
                    Rename
                  </button>
                  <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete network ${row.name || row.id}?`) && networkMutation.run(`/network/networks/${row.id}`, 'DELETE', undefined, 'Delete requested.')}>
                    Delete
                  </button>
                </div>
              ) : '—' },
            ]}
          />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Subnets */}
          <Panel num="03.D" title="Subnets" eyebrow="IP allocation domains">
            <DataTable
              rows={subnetRows}
              columns={[
                { header: 'Name',    cell: row => row.name || '—' },
                { header: 'CIDR',    cell: row => <Mono>{row.cidr || '—'}</Mono> },
                { header: 'Gateway', cell: row => <Mono>{row.gateway_ip || '—'}</Mono> },
                { header: 'DHCP',    cell: row => statusCell(row.enable_dhcp ? 'enabled' : 'disabled') },
                { header: 'Actions', cell: row => writeMode ? (
                  <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete subnet ${row.name || row.id}?`) && subnetMutation.run(`/network/subnets/${row.id}`, 'DELETE', undefined, 'Delete requested.')}>
                    Delete
                  </button>
                ) : '—' },
              ]}
            />
          </Panel>

          {/* Agents */}
          <Panel num="03.E" title="Agents" eyebrow="Neutron workers">
            <DataTable
              rows={agentRows}
              columns={[
                { header: 'Type',  cell: row => <span className="font-display text-sm font-medium">{row.agent_type || '—'}</span> },
                { header: 'Host',  cell: row => <Mono>{row.host || '—'}</Mono> },
                { header: 'Alive', cell: row => statusCell(row.alive) },
                { header: 'Admin', cell: row => statusCell(row.admin_state_up) },
              ]}
            />
          </Panel>
        </div>

        {/* Routers */}
        <Panel num="03.G" title="Routers" eyebrow="L3 routing — gateway & interfaces" action={<Route className="h-5 w-5 text-[#1535C7]" />}>
          <DataTable
            rows={routerRows}
            columns={[
              { header: 'Name', cell: row => <span className="font-display text-sm font-medium">{row.name || '—'}</span> },
              { header: 'Status', cell: row => statusCell(row.status) },
              { header: 'Admin', cell: row => statusCell(row.admin_state_up) },
              { header: 'External gateway', cell: row => (
                <Mono>{row.external_gateway_info?.network_id?.slice(0, 12) || '—'}</Mono>
              ) },
              { header: 'Actions', cell: row => writeMode ? (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={!canWrite || busy} className={BTN}
                    onClick={() => { const n = window.prompt('New router name', row.name || ''); if (n) routerMutation.run(`/network/routers/${row.id}`, 'PATCH', { name: n }, 'Renamed.'); }}>
                    Rename
                  </button>
                  <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                    onClick={() => window.confirm(`Delete router ${row.name || row.id}?`) && routerMutation.run(`/network/routers/${row.id}`, 'DELETE', undefined, 'Delete requested.')}>
                    Delete
                  </button>
                </div>
              ) : '—' },
            ]}
          />
        </Panel>

        {/* Floating IPs */}
        <Panel num="03.H" title="Floating IPs" eyebrow="External — routable addresses">
          <DataTable
            rows={fipRows}
            columns={[
              { header: 'Floating IP',  cell: row => <Mono>{row.floating_ip_address || '—'}</Mono> },
              { header: 'Fixed IP',     cell: row => <Mono>{row.fixed_ip_address || '—'}</Mono> },
              { header: 'Status',       cell: row => statusCell(row.status) },
              { header: 'Port',         cell: row => row.port_id ? <Mono>{String(row.port_id).slice(0, 12)}</Mono> : <span className="text-[#6F6A5F] text-xs">unassociated</span> },
              { header: 'Actions', cell: row => writeMode ? (
                <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                  onClick={() => window.confirm(`Release floating IP ${row.floating_ip_address}?`) && floatMutation.run(`/network/floatingips/${row.id}`, 'DELETE', undefined, 'Released.')}>
                  Release
                </button>
              ) : '—' },
            ]}
          />
        </Panel>

        {/* Security Groups */}
        <Panel num="03.I" title="Security groups" eyebrow="Stateful firewall rules" action={<Shield className="h-5 w-5 text-[#DD2A1C]" />}>
          <DataTable
            rows={sgRows}
            columns={[
              { header: 'Name',        cell: row => <span className="font-display text-sm font-medium">{row.name || '—'}</span> },
              { header: 'Description', cell: row => <span className="text-sm text-[#6F6A5F]">{row.description || '—'}</span> },
              { header: 'Rules',       cell: row => (
                <span className="font-mono tabular text-sm">{(row.security_group_rules || []).length}</span>
              ) },
              { header: 'Actions', cell: row => writeMode ? (
                <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                  onClick={() => window.confirm(`Delete security group ${row.name}?`) && sgMutation.run(`/network/security-groups/${row.id}`, 'DELETE', undefined, 'Deleted.')}>
                  Delete
                </button>
              ) : '—' },
            ]}
          />
        </Panel>

        {/* Security group rules */}
        <Panel num="03.J" title="Security group rules" eyebrow="Ingress / egress policies">
          <DataTable
            rows={sgRuleRows.slice(0, 50)}
            columns={[
              { header: 'Group',     cell: row => <Mono>{String(row.security_group_id).slice(0, 12)}</Mono> },
              { header: 'Direction', cell: row => <span className="meta-pill">{row.direction || '—'}</span> },
              { header: 'Protocol',  cell: row => <Mono>{row.protocol || 'any'}</Mono> },
              { header: 'Ports',     cell: row => (
                row.port_range_min != null
                  ? <Mono>{row.port_range_min}{row.port_range_max !== row.port_range_min ? `–${row.port_range_max}` : ''}</Mono>
                  : <span className="text-[#6F6A5F] text-xs">any</span>
              ) },
              { header: 'Remote',    cell: row => <Mono>{row.remote_ip_prefix || row.remote_group_id?.slice(0, 12) || '0.0.0.0/0'}</Mono> },
              { header: 'Actions', cell: row => writeMode ? (
                <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                  onClick={() => sgRuleMutation.run(`/network/security-group-rules/${row.id}`, 'DELETE', undefined, 'Rule deleted.')}>
                  Delete
                </button>
              ) : '—' },
            ]}
          />
          {sgRuleRows.length > 50 && (
            <p className="mt-3 font-mono text-[10px] text-[#6F6A5F] uppercase tracking-[0.12em]">Showing first 50 of {sgRuleRows.length} rules.</p>
          )}
        </Panel>

        {/* Ports */}
        <Panel num="03.F" title="Ports" eyebrow="VM and service attachment points" action={<Cable className="h-5 w-5 text-[#1535C7]" />}>
          <DataTable
            rows={portRows}
            columns={[
              { header: 'Name',        cell: row => row.name || <Mono>{String(row.id).slice(0, 12)}</Mono> },
              { header: 'Status',      cell: row => statusCell(row.status) },
              { header: 'Device owner',cell: row => <Mono>{row.device_owner || '—'}</Mono> },
              { header: 'MAC',         cell: row => <Mono>{row.mac_address || '—'}</Mono> },
              { header: 'Fixed IPs',   cell: row => (
                <span className="font-mono text-xs">
                  {(row.fixed_ips || []).map((ip: AnyRecord) => ip.ip_address).join(', ') || '—'}
                </span>
              ) },
              { header: 'Actions', cell: row => writeMode ? (
                <button type="button" disabled={!canWrite || busy} className={BTN_DANGER}
                  onClick={() => window.confirm(`Delete port ${row.name || row.id}?`) && portMutation.run(`/network/ports/${row.id}`, 'DELETE', undefined, 'Port deleted.')}>
                  Delete
                </button>
              ) : '—' },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
