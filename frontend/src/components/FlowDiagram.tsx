export function FlowDiagram({ steps }: { steps: { service: string; detail: string }[] }) {
  return (
    <div className="grid gap-1.5">
      {steps.map((step, index) => (
        <div
          key={`${step.service}-${index}`}
          className="group grid grid-cols-[56px_1fr] md:grid-cols-[56px_220px_1fr] border border-[#11100D]/12 bg-[#F7F2E2] transition hover:border-[#11100D]/35"
        >
          <div className="flex items-center justify-center bg-[#11100D] text-[#EFE9D9] border-r border-[#11100D]">
            <span className="font-mono tabular text-base font-medium">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="px-4 py-3 border-r border-[#11100D]/12 hidden md:flex md:items-center">
            <div className="font-display text-base font-medium text-[#11100D] tracking-tight">
              {step.service}
            </div>
          </div>
          <div className="px-4 py-3 flex flex-col justify-center">
            <div className="md:hidden font-display font-medium text-[#11100D] mb-1">
              {step.service}
            </div>
            <p className="text-sm leading-6 text-[#2A2722]">{step.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
