import { Send } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { telegramLink } from '@/shared/lib';

export function Closing() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="contact-title" id="contact" className="pb-24 md:pb-32">
      <div className="mx-auto max-w-[76rem] px-gutter">
        <div className="window px-6 py-14 text-center sm:px-12 md:py-20">
          <h2
            id="contact-title"
            className="mx-auto max-w-[18ch] text-step-3 font-semibold tracking-[-0.03em]"
          >
            {t.closing.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[34rem] text-step-1 text-win-muted">{t.closing.lead}</p>
          <a
            href={telegramLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center gap-2.5 rounded-xl bg-win-text px-6 py-3.5 font-medium text-win transition-colors hover:bg-white"
          >
            <Send aria-hidden="true" className="size-4" />
            {t.closing.cta}
          </a>
          <p className="mt-4 text-step--1 text-win-muted">{t.closing.response}</p>
        </div>
      </div>
    </section>
  );
}
