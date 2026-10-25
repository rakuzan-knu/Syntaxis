import { useI18n } from '@/shared/i18n';
import { Section } from '@/shared/ui';

export function Process() {
  const { t, locale } = useI18n();
  const format = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });

  return (
    <Section id="process" title={t.process.title} lead={t.process.lead}>
      <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-window)] bg-line shadow-[0_0_0_1px_var(--line)] md:grid-cols-5">
        {t.process.steps.map((step, index) => (
          <li key={step.title} className="flex flex-col bg-surface p-6">
            <span className="font-mono text-step--1 text-accent tabular-nums">
              {format.format(index + 1)}
            </span>
            <h3 className="mt-6 text-step-1 font-semibold tracking-[-0.015em] md:mt-10">
              {step.title}
            </h3>
            <p className="mt-2 text-step--1 text-muted">{step.text}</p>
            <p className="mt-auto pt-6 font-mono text-step--2 text-faint">{step.duration}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
