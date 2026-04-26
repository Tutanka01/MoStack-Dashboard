import { AlertTriangle } from 'lucide-react';

export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-3 grid grid-cols-[6px_1fr] overflow-hidden border border-[#DD2A1C]/35 bg-[#DD2A1C]/5">
      <div className="stripe-flag" />
      <div className="flex items-start gap-3 px-4 py-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#DD2A1C]" />
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#A6201A] mb-0.5">
            Error
          </div>
          <span className="text-sm text-[#11100D]">{message}</span>
        </div>
      </div>
    </div>
  );
}
