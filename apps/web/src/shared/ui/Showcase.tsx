import { useState, type ReactNode } from 'react';
import { useI18n, type GlossaryItem } from '@/shared/i18n';
import { Desktop } from './Desktop';
import { ExplainLegend, ExplainToggle } from './explain';
import { Glossary, PlainCaption } from './Glossary';
import { ExplainContext } from './explainContext';
import { Section } from './Section';

interface ShowcaseProps {
  id: string;
  title: string;
  lead: string;
  benefit: string;
  callouts: readonly string[];
  children: ReactNode;
  footer?: ReactNode;
  caption?: string;
  glossary?: readonly GlossaryItem[];
}

export function Showcase({
  id,
  title,
  lead,
  benefit,
  callouts,
  children,
  footer,
  caption,
  glossary,
}: ShowcaseProps) {
  const { t } = useI18n();
  const [explain, setExplain] = useState(false);

  return (
    <Section
      id={id}
      title={title}
      lead={lead}
      aside={
        <ExplainToggle
          active={explain}
          onToggle={() => setExplain((value) => !value)}
          className="self-start lg:self-end"
        />
      }
    >
      <ExplainContext value={explain}>
        <Desktop className="mt-10">{children}</Desktop>
      </ExplainContext>
      {caption ? <PlainCaption label={t.ui.plainLabel} text={caption} /> : null}
      {explain ? <ExplainLegend callouts={callouts} /> : null}
      <p className="mt-6 flex max-w-[52rem] flex-col gap-1 text-step-0 sm:flex-row sm:gap-3">
        <span className="shrink-0 font-semibold text-accent">{t.ui.benefitLabel}</span>
        <span className="text-muted">{benefit}</span>
      </p>
      {glossary && glossary.length > 0 ? (
        <Glossary label={t.ui.glossaryLabel} items={glossary} />
      ) : null}
      {footer}
    </Section>
  );
}
