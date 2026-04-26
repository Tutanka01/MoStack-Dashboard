import { NavLink } from 'react-router-dom';
import { Activity, Box, Cloud, Database, Fingerprint, GraduationCap, Image, Network, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

const navItems = [
  { to: '/', label: 'Control Plane', icon: Activity },
  { to: '/compute', label: 'Compute Fabric', icon: Server },
  { to: '/network', label: 'Network Plane', icon: Network },
  { to: '/storage', label: 'Block Storage', icon: Database },
  { to: '/images', label: 'Images', icon: Image },
  { to: '/identity', label: 'Identity', icon: Fingerprint },
  { to: '/topology', label: 'Topology', icon: Cloud },
  { to: '/learning', label: 'Learning Mode', icon: GraduationCap }
];

type Props = {
  children: React.ReactNode;
  globalStatus?: string;
  region?: string;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
};

export function AppShell({ children, globalStatus = 'UNKNOWN', region = 'RegionOne', autoRefresh, onAutoRefreshChange, onRefresh }: Props) {
  return (
    <div className="min-h-screen swiss-grid bg-[#f6f7f4] text-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-zinc-300 bg-[#f8f9f6]/95 px-5 py-6 backdrop-blur lg:block">
        <div className="mb-10">
          <div className="mb-3 flex h-10 w-10 items-center justify-center bg-zinc-950 text-white">
            <Box className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold leading-7 tracking-normal">OpenStack Lab Control</h1>
          <p className="mt-3 text-xs uppercase text-zinc-500">Multi-node read-only console</p>
        </div>
        <nav className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 border px-3 py-3 text-sm font-medium transition ${
                  isActive ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-transparent text-zinc-700 hover:border-zinc-300 hover:bg-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-zinc-300 bg-[#f8f9f6]/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={globalStatus} />
                <span className="border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase text-zinc-700">{region}</span>
                <span className="inline-flex items-center gap-1 border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-semibold uppercase text-cyan-800">
                  <ShieldCheck className="h-3 w-3" />
                  Read-only
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">Local proxy dashboard for Keystone, Nova, Neutron, Glance, Cinder and Placement.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => onAutoRefreshChange(event.target.checked)}
                  className="h-4 w-4 accent-cyan-700"
                />
                30s auto-refresh
              </label>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 border border-zinc-950 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
