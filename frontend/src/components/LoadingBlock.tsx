export function LoadingBlock({ label = 'Querying OpenStack control plane…' }: { label?: string }) {
  return (
    <div className="panel-chrome p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F6A5F] mb-6 flex items-center gap-2">
        <span className="dot-pulse is-mute" />
        Loading
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-2/3 animate-pulse bg-[#11100D]/10" />
        <div className="h-2.5 w-1/2 animate-pulse bg-[#11100D]/8" />
        <div className="h-2.5 w-1/3 animate-pulse bg-[#11100D]/6" />
      </div>
      <p className="mt-6 font-serif italic text-lg text-[#2A2722]">{label}</p>
    </div>
  );
}
