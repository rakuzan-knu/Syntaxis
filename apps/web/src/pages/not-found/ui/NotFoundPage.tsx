import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { BRAND } from '@/shared/config';
import { localePath, useI18n } from '@/shared/i18n';
import { useDocumentTitle } from '@/shared/lib';
import { ActionLink, CodeBlock } from '@/shared/ui';

export function NotFoundPage() {
  const { t, locale } = useI18n();
  useDocumentTitle(`${t.notFound.title} — ${BRAND}`);

  return (
    <>
      <SiteHeader withNav={false} />
      <main id="main" className="mx-auto max-w-[76rem] px-gutter py-20 md:py-32">
        <div className="window max-w-[32rem] px-2 py-4">
          <CodeBlock
            language="http"
            lines={[['GET /404'], ['HTTP/2 404'], ['content-type: text/html']]}
          />
        </div>
        <h1 className="mt-10 text-step-3 font-semibold tracking-[-0.03em]">{t.notFound.title}</h1>
        <p className="mt-4 max-w-[34rem] text-step-1 text-muted">{t.notFound.text}</p>
        <ActionLink href={localePath(locale)} className="mt-8">
          {t.notFound.back}
        </ActionLink>
      </main>
      <SiteFooter />
    </>
  );
}
