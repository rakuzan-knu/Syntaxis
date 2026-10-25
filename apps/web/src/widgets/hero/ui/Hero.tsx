import { useState } from 'react';
import { Send } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { telegramLink } from '@/shared/lib';
import { ActionLink, ExplainContext, ExplainLegend, ExplainToggle } from '@/shared/ui';
import { HeroStudio } from './HeroStudio';

export function Hero() {
  const { t } = useI18n();
  const [explain, setExplain] = useState(false);

  return (
    <section aria-labelledby="hero-title" className="pt-14 pb-16 md:pt-24 md:pb-20">
      <div className="mx-auto max-w-[76rem] px-gutter">
        <h1 id="hero-title" className="max-w-[21ch] text-step-4 font-semibold tracking-[-0.035em]">
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-[40rem] text-step-1 text-muted">{t.hero.lead}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <ActionLink
            href={telegramLink()}
            target="_blank"
            rel="noopener noreferrer"
            icon={<Send aria-hidden="true" className="size-4" />}
          >
            {t.hero.cta}
          </ActionLink>
          <ActionLink href="#work" variant="secondary">
            {t.hero.secondary}
          </ActionLink>
        </div>

        <div className="mt-14 md:mt-16">
          <ExplainContext value={explain}>
            <HeroStudio />
          </ExplainContext>
          {explain ? <ExplainLegend callouts={t.build.callouts} /> : null}
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-step--1 text-muted">{t.hero.hint}</p>
            <ExplainToggle
              active={explain}
              onToggle={() => setExplain((value) => !value)}
              className="self-start"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
