import type { ReactNode } from 'react';

type Props = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  num?: string;
  variant?: 'default' | 'flag' | 'klein' | 'mute';
  dense?: boolean;
  footer?: ReactNode;
};

const variants = {
  default: '',
  flag: 'is-flag',
  klein: 'is-klein',
  mute: 'is-mute'
};

export function Panel({ title, eyebrow, children, action, num, variant = 'default', dense, footer }: Props) {
  return (
    <section className={`panel-chrome ${variants[variant]}`}>
      <header className="flex items-start justify-between gap-4 border-b border-[#11100D]/12 px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-3">
          {num && (
            <span className="font-mono text-[11px] tabular text-[#6F6A5F] mt-0.5 select-none">
              {num}
            </span>
          )}
          <div>
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            <h2 className="font-display text-xl font-medium leading-tight tracking-[-0.01em] text-[#11100D]">
              {title}
            </h2>
          </div>
        </div>
        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </header>
      <div className={dense ? '' : 'p-5'}>{children}</div>
      {footer && (
        <footer className="border-t border-[#11100D]/12 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6F6A5F]">
          {footer}
        </footer>
      )}
    </section>
  );
}
