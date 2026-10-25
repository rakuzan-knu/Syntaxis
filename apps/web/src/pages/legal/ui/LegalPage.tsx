import { ArrowRight, ChevronRight, Send } from 'lucide-react';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { BRAND, LEGAL_SLUGS, legalPath, type LegalSlug } from '@/shared/config';
import {
  localePath,
  useI18n,
  type LegalBlock,
  type LegalDocument,
  type Locale,
} from '@/shared/i18n';
import { telegramLink, useDocumentTitle } from '@/shared/lib';
import { ActionLink } from '@/shared/ui';

const DATE_LOCALES: Record<Locale, string> = { uk: 'uk-UA', en: 'en-GB' };

interface LegalPageProps {
  slug: LegalSlug;
  document: LegalDocument;
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') return <p className="mt-4 first:mt-0">{block}</p>;
  return (
    <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-accent first:mt-0">
      {block.map((item) => (
        <li key={item} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalPage({ slug, document }: LegalPageProps) {
  const { t, locale } = useI18n();
  useDocumentTitle(`${document.title} — ${BRAND}`);
  const related = LEGAL_SLUGS.filter((item) => item !== slug);

  return (
    <>
      <SiteHeader withNav={false} slug={slug} />
      <main id="main" className="mx-auto max-w-[76rem] px-gutter pt-10 pb-20 md:pt-14 md:pb-28">
        <nav aria-label={t.legal.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-step--1 text-muted">
            <li className="flex items-center gap-2">
              <a href={localePath(locale)} className="link-underline py-1 hover:text-ink">
                {t.legal.home}
              </a>
              <ChevronRight aria-hidden="true" className="size-3.5 text-faint" />
            </li>
            <li>
              <a href={legalPath(locale, slug)} aria-current="page" className="py-1 text-ink">
                {t.legal.titles[slug]}
              </a>
            </li>
          </ol>
        </nav>

        <article aria-labelledby="legal-title" className="mt-8">
          <header className="max-w-[44rem] border-b border-line pb-10">
            <h1 id="legal-title" className="text-step-3 font-semibold tracking-[-0.03em]">
              {document.title}
            </h1>
            <p className="mt-4 text-step-1 text-muted">{document.intro}</p>
            <p className="mt-6 text-step--1 text-faint">
              {t.legal.updated}:{' '}
              <time dateTime={document.updated}>{formatDate(document.updated, locale)}</time>
            </p>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
            <nav aria-labelledby="legal-contents" className="lg:sticky lg:top-24 lg:self-start">
              <p id="legal-contents" className="text-step--1 font-semibold">
                {t.legal.contents}
              </p>
              <ol className="mt-3 border-l border-line text-step--1">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l border-transparent py-1.5 pl-4 text-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-[44rem]">
              {document.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="border-b border-line py-8 first:pt-0"
                >
                  <h2
                    id={`${section.id}-title`}
                    className="flex items-baseline gap-3 text-step-2 font-semibold tracking-[-0.02em]"
                  >
                    <span aria-hidden="true" className="font-mono text-step--1 text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-4 text-muted">
                    {section.blocks.map((block, blockIndex) => (
                      <Block key={blockIndex} block={block} />
                    ))}
                  </div>
                </section>
              ))}

              <aside
                aria-labelledby="legal-questions"
                className="mt-10 rounded-[var(--radius-window)] bg-surface p-6 shadow-[0_0_0_1px_var(--line)] md:p-7"
              >
                <h2 id="legal-questions" className="text-step-1 font-semibold">
                  {t.legal.questionsTitle}
                </h2>
                <p className="mt-2 text-muted">{t.legal.questionsText}</p>
                <ActionLink
                  href={telegramLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<Send aria-hidden="true" className="size-4" />}
                  className="mt-5"
                >
                  {t.header.cta}
                </ActionLink>
              </aside>
            </div>
          </div>
        </article>

        <nav aria-labelledby="legal-related" className="mt-16 border-t border-line pt-10">
          <h2 id="legal-related" className="text-step-1 font-semibold">
            {t.legal.related}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item}>
                <a
                  href={legalPath(locale, item)}
                  className="group flex items-center justify-between gap-4 rounded-xl bg-surface px-5 py-4 font-medium shadow-[0_0_0_1px_var(--line)] transition-shadow hover:shadow-[0_0_0_1px_var(--faint)]"
                >
                  {t.legal.titles[item]}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter slug={slug} />
    </>
  );
}
