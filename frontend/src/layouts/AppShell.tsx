import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Cloud,
  Database,
  Fingerprint,
  GraduationCap,
  Image,
  Lock,
  Network,
  RefreshCw,
  Server,
  ShieldCheck
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

const navItems = [
  { to: '/',          label: 'Control Plane',   short: 'Overview',   icon: Activity,       num: '01' },
  { to: '/compute',   label: 'Compute Fabric',  short: 'Compute',    icon: Server,         num: '02' },
  { to: '/network',   label: 'Network Plane',   short: 'Network',    icon: Network,        num: '03' },
  { to: '/storage',   label: 'Block Storage',   short: 'Storage',    icon: Database,       num: '04' },
  { to: '/images',    label: 'Images',          short: 'Images',     icon: Image,          num: '05' },
  { to: '/identity',  label: 'Identity',        short: 'Identity',   icon: Fingerprint,    num: '06' },
  { to: '/topology',  label: 'Topology',        short: 'Topology',   icon: Cloud,          num: '07' },
  { to: '/learning',  label: 'Learning Mode',   short: 'Learning',   icon: GraduationCap,  num: '08' }
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

type Props = {
  children: React.ReactNode;
  globalStatus?: string;
  region?: string;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
};

export function AppShell({
  children,
  globalStatus = 'UNKNOWN',
  region = 'RegionOne',
  autoRefresh,
  onAutoRefreshChange,
  onRefresh
}: Props) {
  const now = useClock();
  const utc = now.toISOString().slice(11, 19);
  const local = now.toLocaleTimeString();
  const dateStr = now.toISOString().slice(0, 10);
  const status = (globalStatus || 'UNKNOWN').toUpperCase();
  const isUp = status === 'UP';
  const location = useLocation();
  const current = navItems.find(
    (item) => item.to === location.pathname || (item.to !== '/' && location.pathname.startsWith(item.to))
  ) || navItems[0];

  const tickerItems = [
    `MOSTACK · OPENSTACK CONSOLE`,
    `EDITION 01 · v1.0`,
    `REGION · ${region}`,
    `BACKEND · 127.0.0.1:8000`,
    `CONTROLLER · 10.3.17.143`,
    `COMPUTE01 · 10.3.17.144`,
    `COMPUTE02/STORAGE · 10.3.17.145`,
    `PROVIDER · 10.3.16.0/23`,
    `OVS · provider:br-provider`,
    `CINDER · cinder-volumes / lvm`,
    `MODE · READ-ONLY`
  ];

  return (
    <div className="relative min-h-screen bg-[#EFE9D9] text-[#11100D]">
      {/* TICKER BAR */}
      <div className="relative z-40 border-b border-[#11100D]/15 bg-[#11100D] text-[#EFE9D9]">
        <div className="flex items-stretch">
          <div className="flex items-center gap-2 px-4 py-1.5 border-r border-[#EFE9D9]/15 shrink-0">
            <span className={`dot-pulse ${isUp ? '' : 'is-down'}`} />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em]">
              {isUp ? 'LIVE' : status}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 border-r border-[#EFE9D9]/15 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="opacity-60">UTC</span>
            <span className="tabular">{utc}</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 border-r border-[#EFE9D9]/15 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="opacity-60">DATE</span>
            <span className="tabular">{dateStr}</span>
          </div>
          <div className="marquee flex-1 self-center">
            <div className="marquee-track py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <span key={idx} className="opacity-80">
                  <span className="opacity-50 mr-3">◆</span>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 border-l border-[#EFE9D9]/15 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]">
            <Lock className="h-3 w-3" />
            READ-ONLY
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="lg:pl-[300px] relative z-10">
        {/* SIDEBAR */}
        <aside className="fixed top-[33px] bottom-0 left-0 z-30 hidden w-[300px] flex-col border-r border-[#11100D]/15 bg-[#EFE9D9] lg:flex">
          {/* Wordmark */}
          <div className="px-6 pt-6 pb-5 border-b border-[#11100D]/12">
            <div className="flex items-center gap-2.5">
              <div className="relative h-7 w-7">
                <div className="absolute inset-0 bg-[#11100D]" />
                <div className="absolute inset-[5px] bg-[#DD2A1C]" />
                <div className="absolute left-1/2 top-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 bg-[#EFE9D9]" />
                <div className="absolute left-1/2 top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-[#EFE9D9]" />
              </div>
              <h1 className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em]">
                MoStack
              </h1>
            </div>
            <p className="mt-2 font-serif text-[15px] italic text-[#2A2722] leading-tight">
              An OpenStack lab observatory
            </p>
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#6F6A5F]">
              <span>Edition 01</span>
              <span className="tabular">v1.0</span>
            </div>
          </div>

          {/* Section index */}
          <div className="px-6 pt-5 pb-2 flex items-end justify-between">
            <p className="eyebrow">Sections</p>
            <p className="font-mono text-[10px] tabular text-[#6F6A5F]">
              {String(navItems.length).padStart(2, '0')}
            </p>
          </div>
          <nav className="px-6 pb-4 grid gap-0.5">
            {navItems.map(({ to, label, icon: Icon, num }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
              >
                <span className="nav-num">{num}</span>
                <span className="nav-dash" />
                <Icon className="h-3.5 w-3.5 opacity-80" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer block */}
          <div className="mt-auto border-t border-[#11100D]/12 px-6 py-4 grid gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">
            <div className="flex justify-between">
              <span>Backend</span>
              <span>FastAPI</span>
            </div>
            <div className="flex justify-between">
              <span>Frontend</span>
              <span>React 19 / Vite</span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="text-[#DD2A1C]">Read only</span>
            </div>
            <div className="flex justify-between">
              <span>Local clock</span>
              <span className="tabular text-[#11100D]">{local}</span>
            </div>
          </div>
        </aside>

        {/* HEADER STRIP */}
        <header className="sticky top-[33px] z-20 border-b border-[#11100D]/15 bg-[#EFE9D9]/95 backdrop-blur-sm">
          <div className="px-4 md:px-10 py-3.5 grid gap-3 lg:grid-cols-[1fr_auto] items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] tabular text-[#6F6A5F] tracking-[0.18em]">
                {current.num}
              </span>
              <span className="hidden sm:inline-block h-3 w-px bg-[#11100D]/25" />
              <span className="font-display text-base font-medium tracking-tight text-[#11100D]">
                {current.label}
              </span>
              <span className="hidden sm:inline-block h-3 w-px bg-[#11100D]/25 mx-1" />
              <StatusBadge value={globalStatus} />
              <span className="meta-pill">
                <span>Region</span>
                <span className="text-[#11100D] font-medium">{region}</span>
              </span>
              <span className="meta-pill is-klein">
                <ShieldCheck className="h-3 w-3" />
                Read-only
              </span>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#2A2722] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => onAutoRefreshChange(event.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Auto-refresh 30s
              </label>
              <button
                type="button"
                onClick={onRefresh}
                className="group inline-flex items-center gap-2 border border-[#11100D] bg-[#11100D] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#EFE9D9] transition hover:bg-[#DD2A1C] hover:border-[#DD2A1C]"
              >
                <RefreshCw className="h-3 w-3 transition group-hover:-rotate-180 duration-500" />
                Refresh now
              </button>
            </div>
          </div>
        </header>

        {/* MAIN AREA */}
        <main className="relative px-4 md:px-10 py-10 md:py-14 swiss-grid min-h-[calc(100vh-90px)]">
          <div className="relative">{children}</div>
          <div className="mt-16 hatch-divider" />
          <footer className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F]">
            <div>
              <span className="text-[#11100D]">MoStack</span> · OpenStack lab console
            </div>
            <div className="md:text-center">
              No credentials in browser · Token stays in backend
            </div>
            <div className="md:text-right tabular">
              {dateStr} · {utc} UTC
            </div>
          </footer>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV (compact) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-[#11100D]/15 bg-[#EFE9D9]/95 backdrop-blur-sm lg:hidden">
        {navItems.slice(0, 4).map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-[10px] font-mono uppercase tracking-[0.12em] ${
                isActive ? 'bg-[#11100D] text-[#EFE9D9]' : 'text-[#11100D]'
              }`
            }
          >
            <Icon className="h-4 w-4 mb-1" />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
