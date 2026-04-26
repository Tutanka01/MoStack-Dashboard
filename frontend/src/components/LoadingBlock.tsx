export function LoadingBlock({ label = 'Loading current OpenStack state...' }: { label?: string }) {
  return (
    <div className="panel p-6 text-sm text-zinc-500">
      <div className="mb-4 h-2 w-36 animate-pulse bg-zinc-200" />
      <div className="h-2 w-64 animate-pulse bg-zinc-100" />
      <p className="mt-5">{label}</p>
    </div>
  );
}
