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
  player?: ReactNode;
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
  player,
}: ShowcaseProps) {
  const { t } = useI18n();
  const [explain, setExplain] = useState(false);

  return (
    <Section id={id} title={title} lead={lead}>
      <ExplainContext value={explain ? callouts : null}>
        <Desktop className="scroll-tilt mt-10">{children}</Desktop>
      </ExplainContext>
      {explain ? <ExplainLegend callouts={callouts} /> : null}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        {player ? <div className="w-full min-w-0 sm:w-auto sm:flex-1">{player}</div> : null}
        <ExplainToggle
          active={explain}
          onToggle={() => setExplain((value) => !value)}
          className="shrink-0"
        />
      </div>
      {caption ? <PlainCaption label={t.ui.plainLabel} text={caption} /> : null}
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
