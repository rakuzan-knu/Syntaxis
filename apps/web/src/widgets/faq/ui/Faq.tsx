import { Plus } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { Section } from '@/shared/ui';

export function Faq() {
  const { t } = useI18n();
  return (
    <Section id="faq" title={t.faq.title}>
      <div className="mt-12 divide-y divide-line border-y border-line">
        {t.faq.items.map((item) => (
          <details key={item.question} className="faq-item group">
            <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-6 py-5 text-step-1 font-medium transition-colors hover:text-accent">
              <h3>{item.question}</h3>
              <Plus
                aria-hidden="true"
                strokeWidth={1.75}
                className="mt-1 size-5 text-faint transition-transform duration-300 group-open:rotate-45"
              />
            </summary>
            <p className="max-w-[46rem] pb-6 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
