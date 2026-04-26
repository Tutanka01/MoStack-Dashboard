import { CircleDashed } from 'lucide-react';

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="grid place-items-center min-h-32 border border-dashed border-[#11100D]/20 bg-[#EFE9D9]/30 p-8 text-center">
      <div className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6F6A5F]">
        <CircleDashed className="mx-auto mb-1 h-4 w-4 opacity-60" />
        <span>{title}</span>
        <span className="text-[9px] opacity-70">— end of dataset —</span>
      </div>
    </div>
  );
}
