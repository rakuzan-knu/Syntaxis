import { useRef } from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useInView } from '@/shared/lib';
import { Section } from '@/shared/ui';

export function Terms() {
  const { t } = useI18n();
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { amount: 0.3 });

  return (
    <Section id="terms" title={t.terms.title} lead={t.terms.lead}>
      <div
        ref={tableRef}
        data-inview={inView}
        className="mt-12 overflow-hidden rounded-[var(--radius-window)] bg-surface shadow-[0_0_0_1px_var(--line)]"
      >
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] border-b border-line px-6 py-3 text-step--1 text-faint sm:grid"
        >
          <span>{t.terms.usualLabel}</span>
          <span>{t.terms.oursLabel}</span>
        </div>
        <ul className="divide-y divide-line">
          {t.terms.items.map((item, index) => (
            <li
              key={item.ours}
              className="grid gap-x-8 gap-y-1.5 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
            >
              <p className="text-step--1 text-faint">
                <span className="sr-only">{t.terms.usualLabel}: </span>
                <s className="strike no-underline" style={{ '--delay': `${index * 120}ms` }}>
                  {item.usual}
                </s>
              </p>
              <p className="flex gap-3 font-medium">
                <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-accent" />
                <span>
                  <span className="sr-only">{t.terms.oursLabel}: </span>
                  {item.ours}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1 border-t border-line bg-accent-soft px-6 py-5 sm:flex-row sm:items-baseline sm:gap-6">
          <p className="shrink-0 font-semibold text-accent-strong">{t.terms.foundingTitle}</p>
          <p className="text-step--1">{t.terms.foundingText}</p>
        </div>
      </div>
    </Section>
  );
}
