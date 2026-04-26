import type { ReactNode } from 'react';

export function Panel({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase text-zinc-500">{eyebrow}</p>}
          <h2 className="text-xl font-semibold tracking-normal text-zinc-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
