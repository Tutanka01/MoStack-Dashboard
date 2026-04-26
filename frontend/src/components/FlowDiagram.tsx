export function FlowDiagram({ steps }: { steps: { service: string; detail: string }[] }) {
  return (
    <div className="grid gap-3">
      {steps.map((step, index) => (
        <div key={`${step.service}-${index}`} className="grid gap-3 border border-zinc-200 bg-white p-4 md:grid-cols-[96px_180px_1fr] md:items-start">
          <div className="tabular text-xs font-semibold uppercase text-cyan-700">{String(index + 1).padStart(2, '0')}</div>
          <div className="font-semibold text-zinc-950">{step.service}</div>
          <div className="text-sm leading-6 text-zinc-600">{step.detail}</div>
        </div>
      ))}
    </div>
  );
}
