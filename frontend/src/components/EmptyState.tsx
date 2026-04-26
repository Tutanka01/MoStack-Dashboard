import { CircleDashed } from 'lucide-react';

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
      <div>
        <CircleDashed className="mx-auto mb-3 h-5 w-5 text-zinc-400" />
        {title}
      </div>
    </div>
  );
}
