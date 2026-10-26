import { Send } from 'lucide-react';
import { PaletteTrigger } from '@/features/command-palette';
import { LocaleSwitch } from '@/features/switch-locale';
import type { LegalSlug } from '@/shared/config';
import { localePath, useI18n } from '@/shared/i18n';
import { telegramLink } from '@/shared/lib';
import { Logo } from '@/shared/ui';

interface SiteHeaderProps {
  withNav?: boolean;
  slug?: LegalSlug | undefined;
}

export function SiteHeader({ withNav = true, slug }: SiteHeaderProps) {
  const { t, locale } = useI18n();
  const links = [
    { href: '#work', label: t.nav.work },
    { href: '#services', label: t.nav.services },
    { href: '#terms', label: t.nav.terms },
    { href: '#process', label: t.nav.process },
    { href: '#faq', label: t.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md backdrop-saturate-150">
      <a
        href="#main"
        className="sr-only rounded-lg bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {t.header.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-6 px-gutter">
        <a href={localePath(locale)} aria-label={t.header.home}>
          <Logo />
        </a>

        {withNav ? (
          <nav aria-label={t.nav.label} className="hidden lg:block">
            <ul className="flex items-center gap-7 text-step--1">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link-underline py-1 text-muted hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="flex items-center gap-5">
          {withNav ? <PaletteTrigger /> : null}
          <LocaleSwitch slug={slug} />
          <a
            href={telegramLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.header.cta}
            className="inline-flex size-10 items-center justify-center rounded-xl bg-ink text-bg transition-opacity hover:opacity-85 sm:size-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-step--1 sm:font-medium"
          >
            <Send aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{t.header.cta}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
