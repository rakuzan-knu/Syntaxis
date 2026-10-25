import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function Section({ id, title, lead, children, aside, className = '' }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`py-16 [contain-intrinsic-size:auto_1200px] [content-visibility:auto] md:py-20 ${className}`}
    >
      <div className="mx-auto max-w-[76rem] px-gutter">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-[44rem]">
            <h2 id={`${id}-title`} className="text-step-3 font-semibold tracking-[-0.03em]">
              {title}
            </h2>
            {lead ? <p className="mt-4 text-step-1 text-muted">{lead}</p> : null}
          </div>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}
